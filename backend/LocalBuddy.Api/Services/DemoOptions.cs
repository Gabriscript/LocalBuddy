namespace LocalBuddy.Api.Services;

/// The "Demo" configuration section (ADR-0014). Absent from every committed settings file: the
/// switch is turned on, with its password, only where the demo cast should exist.
public class DemoOptions
{
    public const string Section = "Demo";

    /// The password the old seed script published in the repository. Anyone who has read it could
    /// sign in as the presenter and reset the demo, so it is refused anywhere but Development.
    public const string PublishedPassword = "DemoPass123!";

    public bool ResetEnabled { get; set; }
    public string AccountPassword { get; set; } = "";

    /// Absolute, or relative to the content root (Program.cs resolves it once at boot).
    public string PhotosPath { get; set; } = "";

    /// Fails at boot instead of seeding accounts anyone can sign in to. Nothing is checked while
    /// the switch is off, because then nothing is seeded.
    public DemoOptions Validated(bool publishedPasswordAllowed)
    {
        if (!ResetEnabled) return this;
        if (AccountPassword.Length < 12)
            throw new InvalidOperationException(
                $"{Section}:ResetEnabled is on but {Section}:AccountPassword is missing or shorter than 12 characters.");
        if (!publishedPasswordAllowed && AccountPassword == PublishedPassword)
            throw new InvalidOperationException(
                $"{Section}:AccountPassword is the password published in the repository. Supply a fresh one.");
        return this;
    }
}
