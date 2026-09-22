using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
[Produces("application/json")]
public class ReviewsController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpPost("reviews")]
    [ProducesResponseType<ReviewDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(NewReview req)
    {
        var me = User.Id();
        if (me == req.SubjectId) return this.Invalid("self_target", "You cannot review yourself.");

        // Only people who actually got in touch can review each other, and an open chat is not
        // enough: a paid unlock opens one that the other side may never have answered. Both have
        // to have written, or anyone could buy the right to leave a one-star review — or farm
        // host credits, and with them discovery ranking, from accounts of their own.
        var exchanged = await db.Conversations.AnyAsync(c =>
            ((c.UserAId == me && c.UserBId == req.SubjectId) || (c.UserAId == req.SubjectId && c.UserBId == me)) &&
            db.Messages.Any(m => m.ConversationId == c.Id && m.SenderId == me) &&
            db.Messages.Any(m => m.ConversationId == c.Id && m.SenderId == req.SubjectId));
        if (!exchanged) return this.Invalid("no_exchange", "You have not been in touch with this member.");

        // A review is a way of reaching somebody too; a block rules it out in both directions.
        if (await db.IsBlockedBetweenAsync(me, req.SubjectId))
            return this.Invalid("blocked", "This member is not reachable.");

        if (await db.Reviews.AnyAsync(r => r.AuthorId == me && r.SubjectId == req.SubjectId))
            return this.Conflicted("already_reviewed", "You have already reviewed this member.");

        var review = new Review
        {
            Id = Guid.CreateVersion7(),
            AuthorId = me,
            SubjectId = req.SubjectId,
            Rating = req.Rating,
            Comment = req.Comment
        };
        db.Reviews.Add(review);

        await using var transaction = await db.Database.BeginTransactionAsync();
        await db.SaveChangesAsync();

        // GUIDELINES §4: reward hosting, never penalise non-reciprocity. One atomic UPDATE, so two
        // reviews landing together both count.
        await db.Users.Where(u => u.Id == req.SubjectId && db.Listings.Any(l => l.UserId == u.Id))
                      .ExecuteUpdateAsync(s => s.SetProperty(u => u.CreditsBalance, u => u.CreditsBalance + Pricing.HostReviewReward));

        await transaction.CommitAsync();
        return Created($"/api/v1/users/{req.SubjectId}/reviews", ReviewDto.From(review));
    }

    [HttpGet("users/{userId:guid}/reviews")]
    [ProducesResponseType<Page<ReviewDto>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<Page<ReviewDto>>> ForUser(
        Guid userId, int page = 0, int pageSize = Page<ReviewDto>.DefaultSize)
    {
        (page, pageSize) = Page<ReviewDto>.Clamp(page, pageSize);

        var rows = await db.Reviews.Where(r => r.SubjectId == userId)
                                   .OrderByDescending(r => r.CreatedAt)
                                   .Skip(page * pageSize)
                                   .Take(pageSize + 1)
                                   .Select(r => ReviewDto.From(r))
                                   .ToListAsync();

        return Page<ReviewDto>.From(rows, page, pageSize);
    }
}
