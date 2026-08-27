using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

public record SendMessage(string Content);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConversationsController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var me = User.Id();
        var conversations = await db.Conversations
            .Where(c => c.UserAId == me || c.UserBId == me)
            .Select(c => new
            {
                c.Id,
                c.UnlockedByPayment,
                c.CreatedAt,
                OtherUserId = c.UserAId == me ? c.UserBId : c.UserAId,
                LastMessage = db.Messages.Where(m => m.ConversationId == c.Id)
                                         .OrderByDescending(m => m.SentAt)
                                         .Select(m => m.Content).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(conversations);
    }

    [HttpGet("{id}/messages")]
    public async Task<IActionResult> Messages(Guid id, DateTime? since)
    {
        if (!await IsParticipant(id)) return Forbid();

        var q = db.Messages.Where(m => m.ConversationId == id);
        if (since is not null) q = q.Where(m => m.SentAt > since); // client polls with the last timestamp it saw

        return Ok(await q.OrderBy(m => m.SentAt).ToListAsync());
    }

    [HttpPost("{id}/messages")]
    public async Task<IActionResult> Send(Guid id, SendMessage req)
    {
        if (string.IsNullOrWhiteSpace(req.Content)) return BadRequest("Empty message");
        if (!await IsParticipant(id)) return Forbid();

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = id,
            SenderId = User.Id(),
            Content = req.Content
        };

        db.Messages.Add(message);
        await db.SaveChangesAsync();
        return Ok(message);
    }

    Task<bool> IsParticipant(Guid conversationId)
    {
        var me = User.Id();
        return db.Conversations.AnyAsync(c => c.Id == conversationId && (c.UserAId == me || c.UserBId == me));
    }
}
