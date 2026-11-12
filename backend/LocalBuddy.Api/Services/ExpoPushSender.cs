namespace LocalBuddy.Api.Services;

/// Expo's push service, which forwards to FCM for Android (ADR-0012). Registered in Demo only.
/// shortcut: tickets only, no receipts; a token Google drops later is found on the next send
/// that Expo refuses, or never. Poll /push/getReceipts if dead tokens pile up.
public class ExpoPushSender(HttpClient http, ILogger<ExpoPushSender> log) : IPushSender
{
    const string Endpoint = "https://exp.host/--/api/v2/push/send";

    public async Task<IReadOnlyList<string>> SendAsync(IReadOnlyList<PushMessage> messages, CancellationToken cancellationToken)
    {
        // Up to 100 messages per request; a member has a handful of devices at most.
        var payload = messages.Select(m => new
        {
            to = m.To,
            title = m.Title,
            body = m.Body,
            data = new { url = m.Url },
            // The app creates this channel before it asks for a token. A channel the device does
            // not have means the notification is not shown at all.
            channelId = "default",
            priority = "high", // normal priority may wait until a sleeping phone wakes
        });

        using var response = await http.PostAsJsonAsync(Endpoint, payload, cancellationToken);
        if (!response.IsSuccessStatusCode)
            log.LogWarning("Expo refused a push batch with HTTP {Status}", (int)response.StatusCode);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<Tickets>(cancellationToken);

        // The error name only: tokens and texts stay out of the logs.
        foreach (var ticket in result?.Data ?? [])
            if (ticket.Status == "error" && ticket.Details?.Error != "DeviceNotRegistered")
                log.LogWarning("Expo refused a push: {Error}", ticket.Details?.Error ?? "unknown");

        // Tickets come back in the order the messages went out.
        return (result?.Data ?? [])
            .Select((ticket, i) => (ticket, i))
            .Where(x => x.i < messages.Count && x.ticket.Details?.Error == "DeviceNotRegistered")
            .Select(x => messages[x.i].To)
            .ToList();
    }

    sealed record Tickets(List<Ticket>? Data);
    sealed record Ticket(string? Status, TicketDetails? Details);
    sealed record TicketDetails(string? Error);
}
