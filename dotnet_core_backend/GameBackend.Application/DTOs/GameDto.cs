namespace GameBackend.Application.DTOs;

public class GameDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Name { get; set; }
    public string[] Players { get; set; } = Array.Empty<string>();
    public string? HumanPlayer { get; set; }
    public string? Moves { get; set; }
    public string? Winner { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateGameDto
{
    public string? Name { get; set; }
    public string[] Players { get; set; } = Array.Empty<string>();
    public string? HumanPlayer { get; set; }
    public string? Moves { get; set; }
    public string? Winner { get; set; }
}
