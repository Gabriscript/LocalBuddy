using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// No need to advertise the server software.
builder.WebHost.ConfigureKestrel(o => o.AddServerHeader = false);

// Bound and checked once, here, so a missing or too-short signing key stops the app at boot
// instead of at the first login.
var jwt = (builder.Configuration.GetSection(JwtOptions.Section).Get<JwtOptions>()
           ?? throw new InvalidOperationException($"Missing '{JwtOptions.Section}' configuration section."))
    .Validated();

// Enums travel by name, not by position: "evening" means the same thing to every app version,
// while 2 only meant evening as long as nobody reordered the members.
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));

// The OpenAPI document is built from these options, not from the MVC ones above. Without the
// same converter here it would go on describing enums as integers while the API sends names.
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();

var connectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

builder.Services.AddDbContext<LocalBuddyDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddIdentityCore<User>(o =>
    {
        o.User.RequireUniqueEmail = true;
        o.Password.RequiredLength = 8;

        // Brute force protection. Only ever applied through SignInManager, never through
        // UserManager.CheckPasswordAsync, which does not touch the failure counter.
        o.Lockout.AllowedForNewUsers = true;
        o.Lockout.MaxFailedAccessAttempts = 5;
        o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<LocalBuddyDbContext>()
    .AddSignInManager();

builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton<TokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = jwt.ValidationParameters());

builder.Services.AddAuthorization();

// A lockout only slows down one account at a time; the limiter is what stops the spray.
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // A 429 with no Retry-After just invites an immediate retry.
    o.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "60";
        await Results.Problem(
            title: "Too many requests",
            detail: "Rate limit exceeded. Try again in 60 seconds.",
            statusCode: StatusCodes.Status429TooManyRequests,
            extensions: new Dictionary<string, object?> { ["code"] = "rate_limited" })
            .ExecuteAsync(context.HttpContext);
    };

    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            PartitionKey(context),
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 120, Window = TimeSpan.FromMinutes(1) }));

    // Credential endpoints are the ones worth guessing at, so they get far less room, and are
    // keyed by address only: an attacker must not get a fresh budget per account tried.
    o.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            ClientAddress(context),
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));

    // A decoding photo holds up to a few hundred MB until it is resized, and the budgets above
    // count requests per minute, not how many decode at once. Two at a time for the whole
    // server; the rest wait their turn.
    o.AddConcurrencyLimiter("photo-upload", c => { c.PermitLimit = 2; c.QueueLimit = 10; });
});

builder.Services.AddScoped<ConversationService>();
builder.Services.AddSingleton<IPhotoStorage, LocalDiskPhotoStorage>();

// The fakes are Development-only. Outside it nothing is registered and the app refuses to
// start, rather than quietly accepting fake payments and approving every identity check.
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSingleton<IPaymentGateway, FakePaymentGateway>();
    builder.Services.AddSingleton<IIdentityVerifier, FakeIdentityVerifier>();

    // Development only: lets the Expo web preview call the API from the Metro dev server.
    // The mobile client is not a browser and never needs this.
    builder.Services.AddCors(o => o.AddPolicy("dev", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
}
else
{
    throw new InvalidOperationException(
        "No real IPaymentGateway / IIdentityVerifier is registered. LocalBuddy will not start " +
        "outside Development with fake payments and fake identity verification — wire up Stripe " +
        "in Program.cs first.");
}

var app = builder.Build();

app.UseExceptionHandler(); // unhandled errors come back as RFC 7807 ProblemDetails
if (app.Environment.IsDevelopment())
    app.MapOpenApi();
else
    app.UseHsts();

app.UseHttpsRedirection();

// Uploaded photos are served from the same origin as the API, so browsers must not be allowed
// to second-guess their declared type.
app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    await next();
});

// No UseStaticFiles: photos are served by PhotosController so the per-host visibility rule
// cannot be bypassed with a bare URL. See ADR-0006.
if (app.Environment.IsDevelopment()) app.UseCors("dev");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter(); // after authentication, so the partition can be keyed by user
app.UseMiddleware<BanEnforcementMiddleware>();
app.MapControllers();
app.MapHealthChecks("/health");

using (var scope = app.Services.CreateScope())
{
    await ModeratorSeed.ApplyAsync(
        app.Configuration.GetSection("Moderators").Get<string[]>() ?? [],
        scope.ServiceProvider.GetRequiredService<UserManager<User>>(),
        scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>(),
        scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Moderators"));
}

app.Run();

// Authenticated callers get their own budget; everyone else shares one per address.
static string PartitionKey(HttpContext context) =>
    context.User.Identity?.IsAuthenticated == true
        ? context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? ClientAddress(context)
        : ClientAddress(context);

static string ClientAddress(HttpContext context) =>
    context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
