namespace LocalBuddy.Api.Models;

public class Photo
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Type { get; set; } = ""; // "profilo" or "casa"
    public string Url { get; set; } = "";
}
