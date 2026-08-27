using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

public record NewReview(Guid SubjectId, int Rating, string Comment);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewsController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(NewReview req)
    {
        if (req.Rating is < 1 or > 5) return BadRequest("Rating must be 1-5");

        var me = User.Id();
        if (me == req.SubjectId) return BadRequest("Cannot review yourself");

        // Only people who actually got in touch can review each other.
        var talked = await db.Conversations.AnyAsync(c =>
            (c.UserAId == me && c.UserBId == req.SubjectId) ||
            (c.UserAId == req.SubjectId && c.UserBId == me));
        if (!talked) return BadRequest("No exchange with this user");

        if (await db.Reviews.AnyAsync(r => r.AuthorId == me && r.SubjectId == req.SubjectId))
            return BadRequest("Already reviewed this user");

        db.Reviews.Add(new Review
        {
            Id = Guid.NewGuid(),
            AuthorId = me,
            SubjectId = req.SubjectId,
            Rating = req.Rating,
            Comment = req.Comment
        });

        // GUIDELINES §4: reward hosting, never penalise non-reciprocity.
        var subject = await db.Users.FindAsync(req.SubjectId);
        if (subject is not null && await db.Listings.AnyAsync(l => l.UserId == req.SubjectId))
            subject.CreditsBalance += 1;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> ForUser(Guid userId)
        => Ok(await db.Reviews.Where(r => r.SubjectId == userId)
                              .OrderByDescending(r => r.CreatedAt)
                              .ToListAsync());
}
