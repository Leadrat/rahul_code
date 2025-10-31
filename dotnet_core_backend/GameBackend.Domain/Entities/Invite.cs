namespace GameBackend.Domain.Entities;

public class Invite
{
    public int Id { get; set; }
    public int FromUserId { get; set; }
    public string ToEmail { get; set; } = string.Empty;
    public int? GameId { get; set; }
    public string Status { get; set; } = "pending"; // pending, accepted, declined, expired
    public string? Message { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ApplicationUser FromUser { get; set; } = null!;
    public virtual Game? Game { get; set; }
}
