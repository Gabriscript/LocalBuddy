using System.Text;
using LocalBuddy.Api.Data;
using LocalBuddy.Api.Models;
using LocalBuddy.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Must exist before the builder resolves WebRootPath, or static files never get served.
Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<LocalBuddyDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddIdentityCore<User>(o =>
    {
        o.User.RequireUniqueEmail = true;
        o.Password.RequiredLength = 8;
    })
    .AddRoles<IdentityRole<Guid>>()
    .AddEntityFrameworkStores<LocalBuddyDbContext>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Issuer"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    });

builder.Services.AddAuthorization();
builder.Services.AddSingleton<IPaymentGateway, FakePaymentGateway>();
builder.Services.AddSingleton<IIdentityVerifier, FakeIdentityVerifier>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.UseStaticFiles(); // serves uploaded photos out of wwwroot
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
