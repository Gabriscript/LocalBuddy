using LocalBuddy.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LocalBuddy.Api.Services;

public enum PushKind { Request, Match, Message }

/// Tells a member's devices that something happened, after the change is committed (ADR-0012).
/// Best effort: a push that fails or takes too long is logged and dropped, never the request
/// that caused it. The app's polling is the fallback.
/// shortcut: no outbox and no retry; a push lost here is lost. Add an outbox if the pilot misses them.
public class PushNotifier(LocalBuddyDbContext db, IPushSender sender, ILogger<PushNotifier> log)
{
    static readonly TimeSpan Timeout = TimeSpan.FromSeconds(3);

    public async Task NotifyAsync(Guid recipient, Guid from, PushKind kind, string url)
    {
        try
        {
            // A banned account is gone for other members, its phone included (ADR-0005).
            var tokens = await db.PushTokens.Where(t => t.UserId == recipient
                                                        && !db.Users.Any(u => u.Id == t.UserId && u.BannedAt != null))
                                            .Select(t => new { t.Token, t.Language })
                                            .ToListAsync();
            if (tokens.Count == 0) return;

            // The first name only, and never what was written: the text shows on a lock screen.
            var name = await db.Users.Where(u => u.Id == from).Select(u => u.Name).FirstAsync();
            var firstName = name.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? name;

            var messages = tokens.Select(t =>
            {
                var (title, body) = Text(t.Language, kind);
                return new PushMessage(t.Token, title, string.Format(body, firstName), url);
            }).ToList();

            using var timeout = new CancellationTokenSource(Timeout);
            var gone = await sender.SendAsync(messages, timeout.Token);
            if (gone.Count > 0)
                await db.PushTokens.Where(t => gone.Contains(t.Token)).ExecuteDeleteAsync();
        }
        catch (Exception e)
        {
            log.LogWarning(e, "Push {Kind} to {UserId} was not sent", kind, recipient);
        }
    }

    static (string Title, string Body) Text(string language, PushKind kind) =>
        (Texts.GetValueOrDefault(language) ?? Texts["en"])[kind];

    static readonly Dictionary<string, Dictionary<PushKind, (string Title, string Body)>> Texts = new()
    {
        ["en"] = new()
        {
            [PushKind.Request] = ("New contact request", "{0} would like to meet you."),
            [PushKind.Match] = ("Request accepted", "{0} said yes. The chat is open."),
            [PushKind.Message] = ("New message", "{0} wrote to you."),
        },
        ["it"] = new()
        {
            [PushKind.Request] = ("Nuova richiesta di contatto", "{0} vorrebbe conoscerti."),
            [PushKind.Match] = ("Richiesta accettata", "{0} ha detto sì. La chat è aperta."),
            [PushKind.Message] = ("Nuovo messaggio", "{0} ti ha scritto."),
        },
        ["es"] = new()
        {
            [PushKind.Request] = ("Nueva solicitud de contacto", "{0} quiere conocerte."),
            [PushKind.Match] = ("Solicitud aceptada", "{0} ha dicho que sí. El chat está abierto."),
            [PushKind.Message] = ("Nuevo mensaje", "{0} te ha escrito."),
        },
        ["fr"] = new()
        {
            [PushKind.Request] = ("Nouvelle demande de contact", "{0} aimerait vous rencontrer."),
            [PushKind.Match] = ("Demande acceptée", "{0} a dit oui. La conversation est ouverte."),
            [PushKind.Message] = ("Nouveau message", "{0} vous a écrit."),
        },
        ["fi"] = new()
        {
            [PushKind.Request] = ("Uusi yhteydenottopyyntö", "{0} haluaisi tavata sinut."),
            [PushKind.Match] = ("Pyyntö hyväksytty", "{0} sanoi kyllä. Keskustelu on auki."),
            [PushKind.Message] = ("Uusi viesti", "{0} kirjoitti sinulle."),
        },
        ["sv"] = new()
        {
            [PushKind.Request] = ("Ny kontaktförfrågan", "{0} vill gärna träffa dig."),
            [PushKind.Match] = ("Förfrågan godkänd", "{0} sa ja. Chatten är öppen."),
            [PushKind.Message] = ("Nytt meddelande", "{0} skrev till dig."),
        },
        ["de"] = new()
        {
            [PushKind.Request] = ("Neue Kontaktanfrage", "{0} möchte dich kennenlernen."),
            [PushKind.Match] = ("Anfrage angenommen", "{0} hat ja gesagt. Der Chat ist offen."),
            [PushKind.Message] = ("Neue Nachricht", "{0} hat dir geschrieben."),
        },
    };
}
