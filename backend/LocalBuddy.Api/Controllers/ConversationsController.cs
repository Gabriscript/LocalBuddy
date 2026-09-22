using LocalBuddy.Api.Data;
using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/v1/conversations")]
[Authorize]
[Produces("application/json")]
public class ConversationsController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<Page<ConversationSummary>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<Page<ConversationSummary>>> List(
        int page = 0, int pageSize = Page<ConversationSummary>.DefaultSize)
    {
        var me = User.Id();
        (page, pageSize) = Page<ConversationSummary>.Clamp(page, pageSize);
        var blocked = db.BlockedIdsFor(me);

        // A block ends the conversation for both sides, so it leaves both inboxes too.
        var rows = await db.Conversations
            .Where(c => (c.UserAId == me && !blocked.Contains(c.UserBId)) ||
                        (c.UserBId == me && !blocked.Contains(c.UserAId)))
            .OrderByDescending(c => c.CreatedAt).ThenByDescending(c => c.Id)
            .Skip(page * pageSize)
            .Take(pageSize + 1) // one extra, to know whether another page exists
            .Select(c => new ConversationSummary(
                c.Id,
                c.UserAId == me ? c.UserBId : c.UserAId,
                c.UnlockedByPayment,
                c.CreatedAt,
                db.Messages.Where(m => m.ConversationId == c.Id)
                           .OrderByDescending(m => m.SentAt)
                           .Select(m => m.Content).FirstOrDefault()))
            .ToListAsync();

        return Page<ConversationSummary>.From(rows, page, pageSize);
    }

    [HttpGet("{id:guid}/messages")]
    [ProducesResponseType<Page<MessageDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Page<MessageDto>>> Messages(
        Guid id, DateTime? since, int page = 0, int pageSize = Page<MessageDto>.DefaultSize)
    {
        if (!await IsParticipant(id)) return Forbid();
        (page, pageSize) = Page<MessageDto>.Clamp(page, pageSize);

        var q = db.Messages.Where(m => m.ConversationId == id);
        if (since is not null) q = q.Where(m => m.SentAt > since); // client polls with the last timestamp it saw

        // Newest first: page 0 is what a chat screen opens on, and it is the order an inverted
        // FlatList renders bottom-up. Oldest first left every message after the 20th unseen.
        var rows = await q.OrderByDescending(m => m.SentAt).ThenByDescending(m => m.Id)
                          .Skip(page * pageSize)
                          .Take(pageSize + 1)
                          .Select(m => MessageDto.From(m))
                          .ToListAsync();

        return Page<MessageDto>.From(rows, page, pageSize);
    }

    [HttpPost("{id:guid}/messages")]
    [RequiresVerifiedIdentity]
    [ProducesResponseType<MessageDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Send(Guid id, SendMessage req)
    {
        if (string.IsNullOrWhiteSpace(req.Content))
            return this.Invalid("empty_message", "A message cannot be empty.");

        var me = User.Id();
        var chat = await db.Conversations
            .Where(c => c.Id == id && (c.UserAId == me || c.UserBId == me))
            .Select(c => new { Other = c.UserAId == me ? c.UserBId : c.UserAId })
            .FirstOrDefaultAsync();
        if (chat is null) return Forbid();

        // Blocking is the first safety tool a member reaches for: it has to stop the messages,
        // whoever pressed the button.
        if (await db.IsBlockedBetweenAsync(me, chat.Other))
            return this.Invalid("blocked", "This member is not reachable.");

        var message = new Message
        {
            Id = Guid.CreateVersion7(),
            ConversationId = id,
            SenderId = me,
            Content = req.Content
        };

        db.Messages.Add(message);
        await db.SaveChangesAsync();
        return Created($"/api/v1/conversations/{id}/messages", MessageDto.From(message));
    }

    Task<bool> IsParticipant(Guid conversationId)
    {
        var me = User.Id();
        return db.Conversations.AnyAsync(c => c.Id == conversationId && (c.UserAId == me || c.UserBId == me));
    }
}
