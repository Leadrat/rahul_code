using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using dotnet_core_backend.Entities;

namespace dotnet_core_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _config;

        public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, IConfiguration config)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            var user = new ApplicationUser { UserName = req.Email, Email = req.Email };
            var res = await _userManager.CreateAsync(user, req.Password);
            if (!res.Succeeded) return BadRequest(res.Errors.Select(e => e.Description));
            return Ok(new { user.Id, user.Email });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _userManager.FindByEmailAsync(req.Email);
            if (user == null) return Unauthorized();
            var ps = await _signInManager.CheckPasswordSignInAsync(user, req.Password, false);
            if (!ps.Succeeded) return Unauthorized();

            // create JWT
            var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "dev-secret-change-me";
            var secretBytes = Encoding.UTF8.GetBytes(jwtSecret);
            var keyBytes = System.Security.Cryptography.SHA256.HashData(secretBytes);
            var key = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[] {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                new Claim("user_id", user.Id.ToString())
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);
            return Ok(new { token = tokenStr, user = new { id = user.Id, email = user.Email } });
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (userId == null) return Unauthorized();
            // UserManager expects an integer id; parse
            if (!int.TryParse(userId, out var uid)) return Unauthorized();
            var user = await _userManager.FindByIdAsync(uid.ToString());
            return Ok(new { id = user.Id, email = user.Email });
        }

    public class RegisterRequest { public string? Email { get; set; } public string? Password { get; set; } }
    public class LoginRequest { public string? Email { get; set; } public string? Password { get; set; } }
    }
}
