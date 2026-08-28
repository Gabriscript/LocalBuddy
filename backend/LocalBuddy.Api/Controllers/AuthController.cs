using LocalBuddy.Api.Dtos;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LocalBuddy.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
[Produces("application/json")]
public class AuthController(
    UserManager<User> users,
    SignInManager<User> signIn,
    TokenService tokens,
    ILogger<AuthController> log) : ControllerBase
{
    // Identity names the field that collided, which tells a caller whether an address already
    // has an account here. On a platform for meeting strangers, that is itself sensitive.
    static readonly string[] AccountExistsCodes = ["DuplicateUserName", "DuplicateEmail"];

    [HttpPost("register")]
    [ProducesResponseType<AuthResult>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
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
        {
            // Deliberately 400 and not the semantically correct 409: a Conflict would confirm
            // that the address already has an account. Do not "fix" this without an email
            // verification flow to replace it.
            if (result.Errors.Any(e => AccountExistsCodes.Contains(e.Code)))
            {
                log.LogInformation("Registration refused: the address is already registered.");
                return this.Invalid("registration_failed", "Registration could not be completed.");
            }

            // Password and format complaints are about what the caller just typed, not about
            // anybody else, so those come back verbatim.
            return this.Invalid("weak_password", string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        return Created($"/api/v1/users/{user.Id}", new AuthResult(tokens.Create(user, []), user.Id));
    }

    [HttpPost("login")]
    [ProducesResponseType<AuthResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await users.FindByEmailAsync(req.Email);
        // Same response either way — do not leak which emails exist.
        if (user is null)
            return this.Failure(StatusCodes.Status401Unauthorized, "invalid_credentials", "Invalid credentials.");

        // CheckPasswordSignInAsync, never UserManager.CheckPasswordAsync: only this path feeds
        // the lockout counter. A locked-out account answers exactly like a wrong password, so
        // the response still does not confirm that the address exists.
        var result = await signIn.CheckPasswordSignInAsync(user, req.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
            return this.Failure(StatusCodes.Status401Unauthorized, "invalid_credentials", "Invalid credentials.");

        // A banned account is told plainly: unlike the cases above, the holder already knows
        // the account exists, and needs to know why it stopped working.
        if (user.BannedAt is not null)
            return this.Denied("account_banned", user.BanReason ?? "This account is suspended.");

        return Ok(new AuthResult(tokens.Create(user, await users.GetRolesAsync(user)), user.Id));
    }
}
