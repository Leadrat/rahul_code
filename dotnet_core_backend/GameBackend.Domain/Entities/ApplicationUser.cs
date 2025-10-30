using Microsoft.AspNetCore.Identity;
using GameBackend.Domain.Interfaces;

namespace GameBackend.Domain.Entities;

public class ApplicationUser : IdentityUser<int>
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<Game> Games { get; set; } = new List<Game>();
    public virtual ICollection<Invite> SentInvites { get; set; } = new List<Invite>();
}
