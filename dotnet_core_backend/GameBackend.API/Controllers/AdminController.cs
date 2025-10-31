using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GameBackend.Application.DTOs;
using GameBackend.Application.Services;
using GameBackend.Infrastructure.Data;
using GameBackend.Domain.Entities;

namespace GameBackend.API.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IGameService _gameService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public AdminController(IGameService gameService, UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _gameService = gameService;
        _userManager = userManager;
        _context = context;
    }

    private bool IsAdmin()
    {
        var isAdminClaim = User.FindFirst("isAdmin")?.Value;
        return bool.TryParse(isAdminClaim, out var isAdmin) && isAdmin;
    }

    [HttpGet("players")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<object>>> GetUsers()
    {
        if (!IsAdmin()) return Unauthorized();

        var users = await _userManager.Users
            .Select(u => new
            {
                id = u.Id,
                email = u.Email,
                createdAt = u.CreatedAt,
                gameCount = _context.Games.Count(g => g.UserId == u.Id)
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("games")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<GameDto>>> GetAllGames()
    {
        if (!IsAdmin()) return Unauthorized();

        var games = await _context.Games
            .Include(g => g.User)
            .Select(g => new GameDto
            {
                Id = g.Id,
                UserId = g.UserId,
                Name = g.Name,
                Players = g.Players,
                HumanPlayer = g.HumanPlayer,
                Moves = g.Moves,
                Winner = g.Winner,
                CreatedAt = g.CreatedAt
            })
            .ToListAsync();

        return Ok(games);
    }

    [HttpGet("players/{userId}/games")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<GameDto>>> GetUserGames(int userId)
    {
        if (!IsAdmin()) return Unauthorized();

        var games = await _context.Games
            .Where(g => g.UserId == userId)
            .Include(g => g.User)
            .Select(g => new GameDto
            {
                Id = g.Id,
                UserId = g.UserId,
                Name = g.Name,
                Players = g.Players,
                HumanPlayer = g.HumanPlayer,
                Moves = g.Moves,
                Winner = g.Winner,
                CreatedAt = g.CreatedAt
            })
            .ToListAsync();

        return Ok(games);
    }

    [HttpGet("games/{gameId}")]
    [Authorize]
    public async Task<ActionResult<GameDto>> GetGame(int gameId)
    {
        if (!IsAdmin()) return Unauthorized();

        var game = await _context.Games
            .Include(g => g.User)
            .Where(g => g.Id == gameId)
            .Select(g => new GameDto
            {
                Id = g.Id,
                UserId = g.UserId,
                Name = g.Name,
                Players = g.Players,
                HumanPlayer = g.HumanPlayer,
                Moves = g.Moves,
                Winner = g.Winner,
                CreatedAt = g.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (game == null) return NotFound();

        return Ok(game);
    }

    [HttpDelete("games/{gameId}")]
    [Authorize]
    public async Task<ActionResult> DeleteGame(int gameId)
    {
        if (!IsAdmin()) return Unauthorized();

        var game = await _context.Games.FindAsync(gameId);
        if (game == null) return NotFound();

        _context.Games.Remove(game);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Game deleted successfully" });
    }
}
