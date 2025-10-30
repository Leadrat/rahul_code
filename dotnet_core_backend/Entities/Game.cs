using System;
using System.Collections.Generic;

namespace dotnet_core_backend.Entities
{
    public class Game
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Name { get; set; }
        public string[]? Players { get; set; }
        public string? HumanPlayer { get; set; }
        public string? Moves { get; set; } // store json as string
        public string? Winner { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
