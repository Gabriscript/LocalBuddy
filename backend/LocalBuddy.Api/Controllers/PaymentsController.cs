using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

// GUIDELINES §2, non-negotiable: the platform only ever charges to unlock a contact.
// Nothing here may ever take a cut of, or price, the exchange between two people.
[ApiController]
[Route("api/v1")]
[Authorize]
[Produces("application/json")]
public class PaymentsController(
    LocalBuddyDbContext db,
    IPaymentGateway gateway,
    ConversationService conversations) : ControllerBase
{
    /// Skip the mutual-match wait and open a chat directly — paid, or with earned credits.
    /// 201 when this call opened the conversation, 200 when it was already open and nothing
    /// was charged.
    [HttpPost("users/{targetId:guid}/unlock")]
    [RequiresVerifiedIdentity]
    [ProducesResponseType<UnlockResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<UnlockResult>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Unlock(Guid targetId)
    {
        var me = User.Id();
        if (me == targetId) return this.Invalid("self_target", "You cannot unlock yourself.");

        // A banned account is gone as far as other members are concerned (ADR-0005).
        var target = await db.Users.Where(u => u.Id == targetId && u.BannedAt == null)
                                   .Select(u => new { u.IdentityVerified })
                                   .FirstOrDefaultAsync();
        if (target is null) return NotFound();
        // Nobody pays to reach someone who cannot answer: sending requires verification (ADR-0007).
        if (!target.IdentityVerified)
            return this.Invalid("target_not_verified", "This member has not verified their identity yet.");
        if (await db.IsBlockedBetweenAsync(me, targetId))
            return this.Invalid("blocked", "This member is not reachable.");

        // Never charge for a chat that is already open — a mutual match may have opened it free,
        // or a second tap on this same button. The pair lock makes the second tap see the first.
        await using var transaction = await conversations.BeginPairAsync(me, targetId);
        var (conversation, created) = await conversations.OpenAsync(me, targetId, unlockedByPayment: true);
        if (!created) return Ok(new UnlockResult(conversation.Id, "none"));

        var subscribed = await db.Subscriptions.AnyAsync(s =>
            s.UserId == me && s.Status == "active" && s.ExpiresAt > DateTime.UtcNow);

        string charged;
        if (subscribed)
        {
            charged = "subscription";
        }
        else if (await SpendCreditAsync(me))
        {
            // GUIDELINES §4: credits earned by hosting, spent instead of cash.
            charged = "credits";
        }
        else
        {
            // ponytail: charged before the rows are saved. Harmless with the fake gateway; the
            // Stripe integration needs an idempotency key and the unlock confirmed by webhook.
            var stripeId = await gateway.ChargeOneTimeAsync(me, Pricing.Unlock);
            db.Payments.Add(new Payment
            {
                Id = Guid.CreateVersion7(),
                UserId = me,
                Type = PaymentType.OneTimeUnlock,
                Amount = Pricing.Unlock,
                UnlockedUserId = targetId,
                StripeId = stripeId
            });
            charged = "one-time";
        }

        await db.SaveChangesAsync();
        await transaction.CommitAsync();
        return Created($"/api/v1/conversations/{conversation.Id}/messages",
                       new UnlockResult(conversation.Id, charged));
    }

    /// One atomic UPDATE, so two unlocks racing for the last credit cannot both spend it.
    /// Runs inside the caller's transaction, so a failed unlock gives the credit back.
    async Task<bool> SpendCreditAsync(Guid me) =>
        await db.Users.Where(u => u.Id == me && u.CreditsBalance >= Pricing.UnlockCreditCost)
                      .ExecuteUpdateAsync(s => s.SetProperty(u => u.CreditsBalance, u => u.CreditsBalance - Pricing.UnlockCreditCost)) == 1;

    /// No Location header: there is no endpoint yet that serves a single subscription.
    [HttpPost("subscriptions")]
    [ProducesResponseType<SubscriptionDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Subscribe(SubscribeRequest req)
    {
        if (req.PlanType is not ("monthly" or "yearly"))
            return this.Invalid("unknown_plan", "Plan must be monthly or yearly.");
        var monthly = req.PlanType == "monthly";

        var me = User.Id();
        if (await db.Subscriptions.AnyAsync(s => s.UserId == me && s.Status == "active" && s.ExpiresAt > DateTime.UtcNow))
            return this.Conflicted("already_subscribed", "You already have an active subscription.");

        var stripeId = await gateway.StartSubscriptionAsync(me, req.PlanType);

        var subscription = new Subscription
        {
            Id = Guid.CreateVersion7(),
            UserId = me,
            PlanType = req.PlanType,
            Status = "active",
            ExpiresAt = DateTime.UtcNow.AddMonths(monthly ? 1 : 12)
        };

        db.Subscriptions.Add(subscription);
        db.Payments.Add(new Payment
        {
            Id = Guid.CreateVersion7(),
            UserId = me,
            Type = PaymentType.Subscription,
            Amount = monthly ? Pricing.MonthlySubscription : Pricing.YearlySubscription,
            StripeId = stripeId
        });

        await db.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created, SubscriptionDto.From(subscription));
        // ponytail: no Stripe webhook yet — renewals and cancellations land here when
        // the real gateway replaces the stub.
    }
}
