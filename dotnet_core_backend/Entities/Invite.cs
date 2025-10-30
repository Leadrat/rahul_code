using System;

namespace dotnet_core_backend.Entities
{
    public class Invite
    {
        public int Id { get; set; }
        public int FromUserId { get; set; }
        public string? ToEmail { get; set; }
        public int? GameId { get; set; }
        public string Status { get; set; } = "pending";
        public string? Message { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
