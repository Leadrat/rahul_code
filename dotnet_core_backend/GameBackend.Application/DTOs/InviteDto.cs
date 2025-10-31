namespace GameBackend.Application.DTOs;

public class InviteDto
{
    public int Id { get; set; }
    public int FromUserId { get; set; }
    public string FromUserEmail { get; set; } = string.Empty;
    public string ToEmail { get; set; } = string.Empty;
    public int? ToUserId { get; set; }
    public int? GameId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateInviteDto
{
    public string ToEmail { get; set; } = string.Empty;
    public int? GameId { get; set; }
    public string? Message { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class RespondToInviteDto
{
    public string Response { get; set; } = string.Empty; // "accept" or "decline"
}
