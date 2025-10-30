# dotnet_core_backend

This is a scaffolded .NET Web API that uses PostgreSQL (Neon) and ASP.NET Core Identity with EF Core.

Quick start (PowerShell):

```powershell
# from this folder
cd dotnet_core_backend
# restore packages
dotnet restore
# add ef tools if not installed
dotnet tool restore
# create initial migration (requires dotnet-ef)
dotnet ef migrations add InitialCreate
# apply migrations (ensure DATABASE_URL env var is set to your Neon connection string)
dotnet ef database update
# run
$env:DATABASE_URL = "postgresql://..."; dotnet run
```

Environment variables used:
- DATABASE_URL: Neon/Postgres connection string (including sslmode=require if needed)
- JWT_SECRET: secret for signing JWT tokens
- ASPNETCORE_ENVIRONMENT: Development/Production

Notes:
- This is a minimal scaffold with examples showing how to set a session variable for RLS before queries.
- After applying migrations, run the SQL in `Migrations/EnableRls.sql` (or integrate it into migrations) to enable row level security and policies.
