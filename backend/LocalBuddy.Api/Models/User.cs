using Microsoft.AspNetCore.Identity;

namespace LocalBuddy.Api.Models;

// Identity gives us Id, Email, PasswordHash, lockout, etc. Everything below is LocalBuddy's own.
public class User : IdentityUser<Guid>
{
    public string Name { get; set; } = "";
    public string City { get; set; } = "";
    public string Role { get; set; } = ""; // host / guest / entrambi — domain role, unrelated to Identity roles
    public string Bio { get; set; } = "";
    public bool IdentityVerified { get; set; }
    public bool AgeVerified { get; set; }
    public int CreditsBalance { get; set; }

    // traits (GUIDELINES §9)
    public bool HasCar { get; set; }
    public bool Smokes { get; set; }
    public bool HasPets { get; set; }

    public List<Photo> Photos { get; set; } = [];
    public List<Availability> Availabilities { get; set; } = [];
    public Listing? Listing { get; set; }
}
