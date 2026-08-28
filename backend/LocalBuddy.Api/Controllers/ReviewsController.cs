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

        // Only people who actually got in touch can review each other.
        var talked = await db.Conversations.AnyAsync(c =>
            (c.UserAId == me && c.UserBId == req.SubjectId) ||
            (c.UserAId == req.SubjectId && c.UserBId == me));
        if (!talked) return this.Invalid("no_exchange", "You have not been in touch with this member.");

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

        // GUIDELINES §4: reward hosting, never penalise non-reciprocity.
        var subject = await db.Users.FindAsync(req.SubjectId);
        if (subject is not null && await db.Listings.AnyAsync(l => l.UserId == req.SubjectId))
            subject.CreditsBalance += Pricing.HostReviewReward;

        await db.SaveChangesAsync();
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
