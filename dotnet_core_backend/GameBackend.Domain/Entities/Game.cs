namespace GameBackend.Domain.Entities;

public class Game
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Name { get; set; }
    public string[] Players { get; set; } = Array.Empty<string>();
    public string? HumanPlayer { get; set; }
    public string? Moves { get; set; } // JSON string
    public string? Winner { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual ICollection<Invite> Invites { get; set; } = new List<Invite>();
}
