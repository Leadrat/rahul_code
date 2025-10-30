using System;
using System.Threading.Tasks;
using System.Text;
using System.Collections.Generic;
using Npgsql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using dotnet_core_backend.Data;
using dotnet_core_backend.Entities;
using dotnet_core_backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure connection string from env (Neon DATABASE_URL)
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") ?? builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine("WARNING: DATABASE_URL not set. Ensure you provide Neon connection string.");
}

// If DATABASE_URL is in URI form (postgres://...), convert it to a Npgsql connection string
string npgsqlConnection;
if (!string.IsNullOrEmpty(connectionString) && (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)))
{
    try
    {
        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':');
        var builderConn = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = userInfo.Length > 0 ? userInfo[0] : string.Empty,
            Password = userInfo.Length > 1 ? userInfo[1] : string.Empty,
            Database = uri.AbsolutePath?.TrimStart('/') ?? string.Empty,
            SslMode = Npgsql.SslMode.Require,
            TrustServerCertificate = true
        };

        // parse query parameters (e.g., sslmode=require)
        var q = uri.Query;
        if (!string.IsNullOrEmpty(q))
        {
            // q starts with '?'
            var parts = q.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries);
            foreach (var p in parts)
            {
                var kv = p.Split('=', 2);
                if (kv.Length != 2) continue;
                var qk = kv[0].ToLowerInvariant();
                var val = kv[1].ToLowerInvariant();
                if (qk == "sslmode")
                {
                    if (val == "disable") builderConn.SslMode = Npgsql.SslMode.Disable;
                    else if (val == "prefer") builderConn.SslMode = Npgsql.SslMode.Prefer;
                    else if (val == "require") builderConn.SslMode = Npgsql.SslMode.Require;
                    else if (val == "verify-ca") builderConn.SslMode = Npgsql.SslMode.VerifyCA;
                    else if (val == "verify-full") builderConn.SslMode = Npgsql.SslMode.VerifyFull;
                }
                // other params like channel_binding are ignored here
            }
        }

        npgsqlConnection = builderConn.ToString();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to parse DATABASE_URL URI, falling back to raw string: {ex.Message}");
        npgsqlConnection = connectionString;
    }
}
else
{
    npgsqlConnection = connectionString;
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(npgsqlConnection, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure();
    });
});

// Identity
builder.Services.AddIdentity<ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<int>>(options =>
{
    options.User.RequireUniqueEmail = true;
}).AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();

// JWT
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "dev-secret-change-me";
// Ensure signing key is at least 256 bits by deriving SHA256 of the secret
var secretBytes = Encoding.UTF8.GetBytes(jwtSecret);
var keyBytes = System.Security.Cryptography.SHA256.HashData(secretBytes);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
    IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateLifetime = true
    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// CORS: allow frontend (Next.js) dev origin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        // Allow localhost dev origins and keep credentials working by
        // dynamically allowing origins that look like localhost or 127.0.0.1.
        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrEmpty(origin)) return false;
            // Accept http://localhost:* and http://127.0.0.1:* on ports 3000 and 3001
            return (origin.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase) &&
                   (origin.Contains(":3000") || origin.Contains(":3001")))
                   || (origin.StartsWith("http://127.0.0.1", StringComparison.OrdinalIgnoreCase) &&
                   (origin.Contains(":3000") || origin.Contains(":3001")));
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// Application services
builder.Services.AddScoped<GameService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors("AllowFrontend");
// Ensure CORS headers are present on all responses (safety net for error responses)
app.Use(async (context, next) =>
{
    var origin = context.Request.Headers["Origin"].ToString();
    app.Logger.LogInformation("Incoming request {method} {path} Origin={origin}", context.Request.Method, context.Request.Path, origin);

    context.Response.OnStarting(state =>
    {
        var httpContext = (Microsoft.AspNetCore.Http.HttpContext)state!;
        var headers = httpContext.Response.Headers;
        // Add Access-Control-Allow-Origin if not already present
        if (!headers.ContainsKey("Access-Control-Allow-Origin") && !string.IsNullOrEmpty(origin))
        {
            headers["Access-Control-Allow-Origin"] = origin;
        }
        // Ensure the credential header is present when allowed
        if (!headers.ContainsKey("Access-Control-Allow-Credentials"))
        {
            headers["Access-Control-Allow-Credentials"] = "true";
        }
        return Task.CompletedTask;
    }, context);

    await next();

    // Log the resulting header for troubleshooting
    var outHeader = context.Response.Headers.ContainsKey("Access-Control-Allow-Origin") ? context.Response.Headers["Access-Control-Allow-Origin"].ToString() : "(none)";
    app.Logger.LogInformation("Response Access-Control-Allow-Origin: {header}", outHeader);
});
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
