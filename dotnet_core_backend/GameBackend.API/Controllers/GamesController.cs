using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameBackend.Application.DTOs;
using GameBackend.Application.Services;

namespace GameBackend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IGameService _gameService;

    public GamesController(IGameService gameService)
    {
        _gameService = gameService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<GameDto>>> GetUserGames()
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var games = await _gameService.GetUserGamesAsync(userId);
        return Ok(games);
    }

    [HttpGet("stats")]
    [Authorize]
    public async Task<ActionResult<object>> GetUserGameStats()
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var games = await _gameService.GetUserGamesAsync(userId);
        var stats = new
        {
            wins = games.Count(g => g.Winner == "Human"),
            losses = games.Count(g => g.Winner == "AI"),
            draws = games.Count(g => g.Winner == "Draw"),
            total = games.Count()
        };

        return Ok(stats);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<GameDto>> GetGame(int id)
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var game = await _gameService.GetGameByIdAsync(id, userId);
        if (game == null)
        {
            return NotFound();
        }

        return Ok(game);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<GameDto>> CreateGame([FromBody] CreateGameDto request)
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var game = await _gameService.CreateGameAsync(request, userId);
            return CreatedAtAction(nameof(GetGame), new { id = game.Id }, game);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GameDto>> UpdateGame(int id, [FromBody] CreateGameDto request)
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var game = await _gameService.UpdateGameAsync(id, request, userId);
            return Ok(game);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGame(int id)
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await _gameService.DeleteGameAsync(id, userId);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
}
