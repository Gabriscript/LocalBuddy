using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LocalBuddy.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace LocalBuddy.Api.Controllers;

public record RegisterRequest(string Email, string Password, string Name, string City, string Role);
public record LoginRequest(string Email, string Password);

[ApiController]
[Route("api/[controller]")]
public class AuthController(UserManager<User> users, IConfiguration config) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var user = new User
        {
            UserName = req.Email,
            Email = req.Email,
            Name = req.Name,
            City = req.City,
            Role = req.Role
        };

        var result = await users.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors.Select(e => e.Description));

        return Ok(new { token = CreateToken(user), userId = user.Id });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await users.FindByEmailAsync(req.Email);
        // Same response either way — don't leak which emails exist.
        if (user is null || !await users.CheckPasswordAsync(user, req.Password))
            return Unauthorized("Invalid credentials");

        return Ok(new { token = CreateToken(user), userId = user.Id });
    }

    string CreateToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Issuer"],
            claims: [new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())],
            expires: DateTime.UtcNow.AddDays(30), // ponytail: long-lived token, no refresh flow. Add refresh when sessions need revoking.
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
