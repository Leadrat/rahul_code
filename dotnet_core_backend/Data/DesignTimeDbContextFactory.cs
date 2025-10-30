using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Npgsql;

namespace dotnet_core_backend.Data
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") ?? "";
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("DATABASE_URL environment variable is not set for design-time DbContext creation.");
            }

            string npgsqlConnection;
            if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            {
                var uri = new Uri(connectionString);
                var userInfo = uri.UserInfo.Split(':');
                var builderConn = new NpgsqlConnectionStringBuilder
                {
                    Host = uri.Host,
                    Port = uri.Port > 0 ? uri.Port : 5432,
                    Username = userInfo.Length > 0 ? userInfo[0] : string.Empty,
                    Password = userInfo.Length > 1 ? userInfo[1] : string.Empty,
                    Database = uri.AbsolutePath?.TrimStart('/') ?? string.Empty,
                    SslMode = SslMode.Require,
                    TrustServerCertificate = true
                };

                var q = uri.Query;
                if (!string.IsNullOrEmpty(q))
                {
                    var parts = q.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries);
                    foreach (var p in parts)
                    {
                        var kv = p.Split('=', 2);
                        if (kv.Length != 2) continue;
                        var k = kv[0].ToLowerInvariant();
                        var val = kv[1].ToLowerInvariant();
                        if (k == "sslmode")
                        {
                            if (val == "disable") builderConn.SslMode = SslMode.Disable;
                            else if (val == "prefer") builderConn.SslMode = SslMode.Prefer;
                            else if (val == "require") builderConn.SslMode = SslMode.Require;
                            else if (val == "verify-ca") builderConn.SslMode = SslMode.VerifyCA;
                            else if (val == "verify-full") builderConn.SslMode = SslMode.VerifyFull;
                        }
                    }
                }

                npgsqlConnection = builderConn.ToString();
            }
            else
            {
                npgsqlConnection = connectionString;
            }

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseNpgsql(npgsqlConnection);
            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
