namespace LocalBuddy.Api.Models;

/// One definition of how long each free-text field may be, shared by the request validation in
/// Dtos and the column widths in LocalBuddyDbContext, so validation and schema cannot disagree.
public static class Limits
{
    public const int Email = 254;      // the practical maximum for an address
    public const int Password = 128;
    public const int Name = 80;
    public const int City = 80;
    public const int Role = 20;
    public const int Prompt = 500;     // each guided profile prompt
    public const int Languages = 120;
    public const int Comment = 1000;
    public const int Reason = 1000;
    public const int Message = 2000;
    public const int Url = 200;
    public const int ExternalId = 100; // Stripe identifiers
    public const int SubjectHash = 128;
}
