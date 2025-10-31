using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using GameBackend.Domain.Entities;

namespace GameBackend.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Game> Games { get; set; }
    public DbSet<Invite> Invites { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure Game entity
        builder.Entity<Game>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).IsRequired();
            entity.Property(e => e.Players).HasColumnType("text[]");
            entity.Property(e => e.Moves).HasColumnType("jsonb");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.Games)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Row Level Security removed - handled in service layer
        });

        // Configure Invite entity
        builder.Entity<Invite>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FromUserId).IsRequired();
            entity.Property(e => e.ToEmail).IsRequired();
            entity.HasOne(e => e.FromUser)
                  .WithMany(u => u.SentInvites)
                  .HasForeignKey(e => e.FromUserId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Game)
                  .WithMany(g => g.Invites)
                  .HasForeignKey(e => e.GameId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Row Level Security removed - handled in service layer
        });

        // Enable Row Level Security for PostgreSQL
        builder.HasPostgresExtension("pgcrypto");
    }

    private static string GetCurrentUserId()
    {
        // This will be set by the service using DbContext.SetCurrentUser()
        return string.Empty; // Placeholder
    }

    private static int GetCurrentUserIdInt()
    {
        // This will be set by the service using DbContext.SetCurrentUser()
        return 0; // Placeholder for now
    }
}
