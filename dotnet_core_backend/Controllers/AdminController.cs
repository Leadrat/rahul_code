using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using dotnet_core_backend.Data;
using dotnet_core_backend.Entities;
using Microsoft.EntityFrameworkCore;

namespace dotnet_core_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [HttpPost("login")]
        public async Task<IActionResult> AdminLogin([FromBody] LoginRequest req)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(req.Email);
                if (user == null) return Unauthorized();

                // Check if user is admin (you might want to add an IsAdmin property to ApplicationUser)
                // For now, let's check if email contains admin or a specific admin email
                if (!req.Email.Contains("admin") && req.Email != "rahulleadrat@gmail.com")
                {
                    return Unauthorized();
                }

                var result = await _userManager.CheckPasswordAsync(user, req.Password);
                if (!result) return Unauthorized();

                // Generate admin token (you might want to use a different approach)
                var token = GenerateJwtToken(user);
                return Ok(new { token });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Admin login error: {ex.Message}");
                return StatusCode(500, "Login failed");
            }
        }

        [HttpGet("players")]
        [Authorize]
        public async Task<IActionResult> GetPlayers()
        {
            try
            {
                var users = await _db.Users
                    .Select(u => new { u.Id, u.Email, u.CreatedAt })
                    .ToListAsync();
                return Ok(new { players = users });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get players error: {ex.Message}");
                return StatusCode(500, "Failed to fetch players");
            }
        }

        [HttpGet("games")]
        [Authorize]
        public async Task<IActionResult> GetAllGames()
        {
            try
            {
                var games = await _db.Games
                    .Join(_db.Users, g => g.UserId, u => u.Id, (g, u) => new { 
                        g.Id, 
                        g.Name, 
                        g.Players, 
                        g.HumanPlayer, 
                        g.Winner, 
                        g.CreatedAt,
                        UserEmail = u.Email
                    })
                    .ToListAsync();
                return Ok(new { games });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get all games error: {ex.Message}");
                return StatusCode(500, "Failed to fetch games");
            }
        }

        [HttpGet("players/{userId}/games")]
        [Authorize]
        public async Task<IActionResult> GetUserGames(int userId)
        {
            try
            {
                var games = await _db.Games
                    .Where(g => g.UserId == userId)
                    .Select(g => new { 
                        g.Id, 
                        g.Name, 
                        g.Players, 
                        g.HumanPlayer, 
                        g.Winner, 
                        g.CreatedAt
                    })
                    .ToListAsync();
                return Ok(new { games });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get user games error: {ex.Message}");
                return StatusCode(500, "Failed to fetch user games");
            }
        }

        [HttpGet("games/{gameId}")]
        [Authorize]
        public async Task<IActionResult> GetGameById(int gameId)
        {
            try
            {
                var game = await _db.Games
                    .Where(g => g.Id == gameId)
                    .FirstOrDefaultAsync();
                
                if (game == null) return NotFound();
                return Ok(new { game });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get game by id error: {ex.Message}");
                return StatusCode(500, "Failed to fetch game");
            }
        }

        [HttpDelete("games/{gameId}")]
        [Authorize]
        public async Task<IActionResult> DeleteGame(int gameId)
        {
            try
            {
                var game = await _db.Games.FindAsync(gameId);
                if (game == null) return NotFound();

                _db.Games.Remove(game);
                await _db.SaveChangesAsync();
                return Ok(new { message = "Game deleted" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Delete game error: {ex.Message}");
                return StatusCode(500, "Failed to delete game");
            }
        }

        private string GenerateJwtToken(ApplicationUser user)
        {
            // This is a simplified version - you should use the same JWT generation as your AuthController
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key = System.Text.Encoding.UTF8.GetBytes("replace-me-with-a-strong-secret");
            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] { new Claim("nameid", user.Id.ToString()), new Claim("email", user.Email) }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key), Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public class LoginRequest
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }
    }
}
