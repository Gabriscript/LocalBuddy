using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace LocalBuddy.Api.Services;

/// The single binding of the "Jwt" configuration section. Token issuance (TokenService) and
/// token validation (Program.cs) both read this one instance, so the signing key, issuer and
/// audience cannot drift apart the way two independent IConfiguration reads can.
public class JwtOptions
{
    public const string Section = "Jwt";

    public string Issuer { get; set; } = "";
    public string Key { get; set; } = "";

    /// Fails at boot instead of at the first login.
    public JwtOptions Validated()
    {
        if (string.IsNullOrWhiteSpace(Issuer))
            throw new InvalidOperationException($"{Section}:Issuer is not configured.");
        if (Key.Length < 32)
            throw new InvalidOperationException(
                $"{Section}:Key is missing or shorter than the 32 characters HMAC-SHA256 requires.");
        return this;
    }

    public SecurityKey SigningKey() => new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Key));

    public TokenValidationParameters ValidationParameters() => new()
    {
        ValidateIssuer = true,
        ValidIssuer = Issuer,
        ValidateAudience = true,
        ValidAudience = Issuer,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = SigningKey()
    };
}
