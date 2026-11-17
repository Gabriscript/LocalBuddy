namespace LocalBuddy.Api.Services;

/// ADR-0016: the names of the same city in two languages, so "Florence" finds Firenze. The first
/// name of a group is the canonical one, the one stored from now on. Add a city only with a test.
public static class CityNames
{
    public static readonly IReadOnlyList<string[]> Groups =
    [
        ["Roma", "Rome"],
        ["Milano", "Milan"],
        ["Firenze", "Florence"],
        ["Venezia", "Venice"],
        ["Napoli", "Naples"],
        ["Torino", "Turin"],
        ["Genova", "Genoa"],
        ["Helsinki", "Helsingfors"],
        ["Stockholm", "Tukholma"],
        ["Copenhagen", "København", "Kobenhavn", "Köpenhamn", "Kööpenhamina"],
        ["Prague", "Praha"],
        ["Vienna", "Wien"],
        ["Munich", "München", "Munchen"],
        ["Cologne", "Köln", "Koln"],
        ["Lisbon", "Lisboa"],
        ["Seville", "Sevilla"],
    ];

    // Throws at first use if a name sits in two groups, which the table test also checks.
    static readonly Dictionary<string, string[]> GroupOf = Groups
        .SelectMany(g => g.Select(name => (Key: name.ToLowerInvariant(), Group: g)))
        .ToDictionary(x => x.Key, x => x.Group);

    static string[]? Find(string? name) => GroupOf.GetValueOrDefault((name ?? "").Trim().ToLowerInvariant());

    /// The canonical spelling of a known city, otherwise the trimmed input unchanged.
    public static string Canonical(string? name) => Find(name)?[0] ?? (name ?? "").Trim();

    /// Every lower-cased name of the input's group; just the lower-cased input for an unknown city.
    public static string[] Names(string name) =>
        Find(name)?.Select(n => n.ToLowerInvariant()).ToArray() ?? [name.Trim().ToLowerInvariant()];

    /// The lower-cased names of every group with any name starting with the prefix.
    public static string[] CanonicalsWithAliasPrefix(string lowerPrefix) =>
        Groups.Where(g => g.Any(n => n.ToLowerInvariant().StartsWith(lowerPrefix, StringComparison.Ordinal)))
              .SelectMany(g => g.Select(n => n.ToLowerInvariant())).ToArray();
}
