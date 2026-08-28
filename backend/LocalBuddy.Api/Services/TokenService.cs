using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using LocalBuddy.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace LocalBuddy.Api.Services;

/// The only place that knows how a LocalBuddy access token is built and signed.
public class TokenService(JwtOptions jwt)
{
    /// Roles are baked into the token, so a role granted after issue only takes effect at the
    /// next sign-in. Acceptable while the only role is moderator, which is granted rarely.
    public string Create(User user, IEnumerable<string> roles)
    {
        List<Claim> claims = [new(ClaimTypes.NameIdentifier, user.Id.ToString())];
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var token = new JwtSecurityToken(
            issuer: jwt.Issuer,
            audience: jwt.Issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30), // ponytail: long-lived token, no refresh flow. Add refresh when sessions need revoking.
            signingCredentials: new SigningCredentials(jwt.SigningKey(), SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
