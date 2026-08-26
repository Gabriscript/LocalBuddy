namespace LocalBuddy.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string City { get; set; } = "";
    public string Role { get; set; } = ""; // host / guest / entrambi
    public bool IdentityVerified { get; set; }
    public bool AgeVerified { get; set; }
    public int CreditsBalance { get; set; }
}
