namespace LocalBuddy.Api.Dtos;

/// Every collection endpoint answers with this. A bare array cannot tell a client whether
/// another page exists, which is what four of the five list endpoints used to do.
/// <param name="HasMore">Computed by asking for one row more than the page and dropping it.</param>
public record Page<T>(IReadOnlyList<T> Items, int PageNumber, int PageSize, bool HasMore)
{
    public const int DefaultSize = 20;
    public const int MaxSize = 50;

    /// Clamps the caller request, then splits the over-fetched row off the end.
    public static Page<T> From(List<T> fetched, int pageNumber, int pageSize)
    {
        var hasMore = fetched.Count > pageSize;
        return new Page<T>(hasMore ? fetched.Take(pageSize).ToList() : fetched, pageNumber, pageSize, hasMore);
    }

    public static (int Page, int Size) Clamp(int page, int pageSize)
        => (Math.Max(page, 0), Math.Clamp(pageSize, 1, MaxSize));
}
