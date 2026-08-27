using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

public record SubscribeRequest(string PlanType); // monthly / yearly

// GUIDELINES §2, non-negotiable: the platform only ever charges to unlock a contact.
// Nothing here may ever take a cut of, or price, the exchange between two people.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController(LocalBuddyDbContext db, IPaymentGateway gateway) : ControllerBase
{
    const decimal UnlockPrice = 4.99m;
    const int UnlockCreditCost = 1;

    /// Skip the mutual-match wait and open a chat directly — paid, or with earned credits.
    [HttpPost("unlock/{targetId}")]
    public async Task<IActionResult> Unlock(Guid targetId)
    {
        var me = User.Id();
        if (me == targetId) return BadRequest("Cannot unlock yourself");

        var user = await db.Users.FindAsync(me);
        if (user is null) return NotFound();
        if (!await db.Users.AnyAsync(u => u.Id == targetId)) return NotFound("Target not found");

        if (await db.Blocks.AnyAsync(b =>
            (b.BlockerId == me && b.BlockedId == targetId) ||
            (b.BlockerId == targetId && b.BlockedId == me)))
            return BadRequest("Blocked");

        var existing = await db.Conversations.FirstOrDefaultAsync(c =>
            (c.UserAId == me && c.UserBId == targetId) || (c.UserAId == targetId && c.UserBId == me));
        if (existing is not null) return Ok(new { conversationId = existing.Id, charged = "already open" });

        var subscribed = await db.Subscriptions.AnyAsync(s =>
            s.UserId == me && s.Status == "active" && s.ExpiresAt > DateTime.UtcNow);

        string charged;
        if (subscribed)
        {
            charged = "subscription";
        }
        else if (user.CreditsBalance >= UnlockCreditCost)
        {
            // GUIDELINES §4: credits earned by hosting, spent instead of cash.
            user.CreditsBalance -= UnlockCreditCost;
            charged = "credits";
        }
        else
        {
            var stripeId = await gateway.ChargeOneTimeAsync(me, UnlockPrice);
            db.Payments.Add(new Payment
            {
                Id = Guid.NewGuid(),
                UserId = me,
                Type = PaymentType.OneTimeUnlock,
                Amount = UnlockPrice,
                UnlockedUserId = targetId,
                StripeId = stripeId
            });
            charged = "one-time";
        }

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            UserAId = me,
            UserBId = targetId,
            UnlockedByPayment = true
        };
        db.Conversations.Add(conversation);

        await db.SaveChangesAsync();
        return Ok(new { conversationId = conversation.Id, charged });
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe(SubscribeRequest req)
    {
        if (req.PlanType is not ("monthly" or "yearly")) return BadRequest("Plan must be monthly or yearly");

        var me = User.Id();
        var stripeId = await gateway.StartSubscriptionAsync(me, req.PlanType);

        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = me,
            PlanType = req.PlanType,
            Status = "active",
            ExpiresAt = DateTime.UtcNow.AddMonths(req.PlanType == "monthly" ? 1 : 12)
        };

        db.Subscriptions.Add(subscription);
        db.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            UserId = me,
            Type = PaymentType.Subscription,
            Amount = req.PlanType == "monthly" ? 9.99m : 79.99m,
            StripeId = stripeId
        });

        await db.SaveChangesAsync();
        return Ok(subscription);
        // ponytail: no Stripe webhook yet — renewals and cancellations land here when
        // the real gateway replaces the stub.
    }
}
