using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using dotnet_core_backend.Entities;

namespace dotnet_core_backend.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<int>, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Game> Games { get; set; }
        public DbSet<Invite> Invites { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<Game>(b =>
            {
                b.ToTable("games");
                b.HasKey(x => x.Id);
                b.Property(x => x.Players).HasColumnType("text[]");
                b.Property(x => x.Moves).HasColumnType("jsonb");
            });

            builder.Entity<Invite>(b =>
            {
                b.ToTable("invites");
                b.HasKey(x => x.Id);
            });
        }
    }
}
