using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using dotnet_core_backend.Services;
using dotnet_core_backend.Entities;
using System.Text.Json;

namespace dotnet_core_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GamesController : ControllerBase
    {
        private readonly GameService _games;
        public GamesController(GameService games)
        {
            _games = games;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (userId == null) return Unauthorized();
            var list = await _games.GetGamesForUserAsync(userId);
            return Ok(new { games = list });
        }

        [Authorize]
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (userId == null) return Unauthorized();
            var list = await _games.GetGamesForUserAsync(userId);
            var game = list.FirstOrDefault(g => g.Id == id);
            if (game == null) return NotFound();
            return Ok(new { game = game });
        }

        public class CreateGameRequest
        {
            public string? Name { get; set; }
            public string[]? Players { get; set; }
            public object? Moves { get; set; }
            public string? human_player { get; set; }
            public string? Winner { get; set; }
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateGameRequest req)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
            if (userId == null) return Unauthorized();

            // Log the incoming request for debugging
            Console.WriteLine($"Creating game for user {userId}");
            Console.WriteLine($"Request data: Name={req.Name}, Players={string.Join(",", req.Players ?? new string[0])}, HumanPlayer={req.human_player}, Winner={req.Winner}");

            try
            {
                var game = new Game
                {
                    Name = req.Name,
                    Players = req.Players,
                    HumanPlayer = req.human_player,
                    Winner = req.Winner,
                    Moves = req.Moves is string s ? s : JsonSerializer.Serialize(req.Moves)
                };

                var saved = await _games.AddGameForUserAsync(userId, game);
                return CreatedAtAction(nameof(GetById), new { id = saved.Id }, new { game = saved });
            }
            catch (System.Exception ex)
            {
                // Log the full exception for debugging
                Console.WriteLine($"Error saving game: {ex.GetType().Name}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                // return a 500 with some details for debugging during dev
                return Problem(detail: ex.Message, title: "Failed to save game");
            }
        }
    }
}
