using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;

namespace LocalBuddy.Api.Controllers;

// TODO: exposes the User entity directly instead of a DTO — fine while User has no
// sensitive fields, but revisit before adding anything internal (password hash, etc.)
[ApiController]
[Route("api/[controller]")]
public class UsersController(LocalBuddyDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<List<User>> GetAll()
        => await db.Users.ToListAsync();

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetById(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        return user is null ? NotFound() : user;
    }

    [HttpPost]
    public async Task<ActionResult<User>> Create(User user)
    {
        user.Id = Guid.NewGuid();
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, User update)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.Name = update.Name;
        user.City = update.City;
        user.Role = update.Role;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
