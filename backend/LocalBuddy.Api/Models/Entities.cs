namespace LocalBuddy.Api.Models;

// ponytail: every entity in one file — they're all 5-line shapes, splitting them into
// 10 files buys nothing. Split when one grows real behaviour.

public enum PhotoType { Profile, Home }
public enum TimeOfDay { Morning, Afternoon, Evening, Night }
public enum MatchStatus { Pending, Matched, Passed }
public enum PaymentType { OneTimeUnlock, Subscription }
public enum ReportStatus { Open, Reviewed, Dismissed }

public class Photo
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public PhotoType Type { get; set; }
    public string Url { get; set; } = "";
}

public class Availability
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public TimeOfDay TimeOfDay { get; set; }
    public DateOnly? SeasonStart { get; set; }
    public DateOnly? SeasonEnd { get; set; }
}

public class Listing
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public bool OffersExperience { get; set; }
    public bool OffersOvernight { get; set; }
    // GUIDELINES §5: overnight can only be switched on with an explicit TULPS/Alloggiati ack
    public bool OvernightComplianceAck { get; set; }
}

// One row per direction of interest. Both directions existing = a match.
public class Match
{
    public Guid Id { get; set; }
    public Guid InitiatorId { get; set; }
    public Guid TargetId { get; set; }
    public MatchStatus Status { get; set; }
    public DateTime? MatchedAt { get; set; }
}

// ponytail: no MatchId FK — participants live here directly, since a paid unlock
// opens a conversation with no match behind it.
public class Conversation
{
    public Guid Id { get; set; }
    public Guid UserAId { get; set; }
    public Guid UserBId { get; set; }
    public bool UnlockedByPayment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Message
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string Content { get; set; } = "";
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}

public class Payment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public PaymentType Type { get; set; }
    public decimal Amount { get; set; }
    public Guid? UnlockedUserId { get; set; } // set for one-time contact unlocks
    public string StripeId { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Subscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string PlanType { get; set; } = ""; // monthly / yearly
    public string Status { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
}

public class Review
{
    public Guid Id { get; set; }
    public Guid AuthorId { get; set; }
    public Guid SubjectId { get; set; }
    public int Rating { get; set; } // 1-5
    public string Comment { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Report
{
    public Guid Id { get; set; }
    public Guid ReporterId { get; set; }
    public Guid ReportedId { get; set; }
    public string Reason { get; set; } = "";
    public ReportStatus Status { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Block
{
    public Guid Id { get; set; }
    public Guid BlockerId { get; set; }
    public Guid BlockedId { get; set; }
}
