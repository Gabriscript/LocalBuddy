using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace LocalBuddy.Api.Data;

/// EF tooling — dotnet ef, and the migration bundle that runs on deploy — builds the context
/// from here instead of booting the application host. The host demands the full runtime
/// configuration (JWT signing key, payment gateways), none of which a schema migration has any
/// business needing: without this, the bundle fails on any machine that has no appsettings.
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<LocalBuddyDbContext>
{
    public LocalBuddyDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var options = new DbContextOptionsBuilder<LocalBuddyDbContext>();
        var connectionString = configuration.GetConnectionString("Default");

        // No connection string locally is fine: the bundle supplies one with --connection,
        // which EF applies after the context is built.
        if (string.IsNullOrWhiteSpace(connectionString))
            options.UseNpgsql();
        else
            options.UseNpgsql(connectionString);

        return new LocalBuddyDbContext(options.Options);
    }
}
