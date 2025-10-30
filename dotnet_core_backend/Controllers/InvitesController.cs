using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using dotnet_core_backend.Data;
using dotnet_core_backend.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace dotnet_core_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvitesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public InvitesController(ApplicationDbContext db) { _db = db; }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> List()
        {
            // naive list all invites for user (from or to)
            var email = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email)?.Value;
            if (email == null) return Unauthorized();
            var invites = await _db.Invites.Where(i => i.ToEmail == email).ToListAsync();
            return Ok(invites);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInvite req)
        {
            var userIdStr = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            int.TryParse(userIdStr, out var uid);
            var inv = new Invite { FromUserId = uid, ToEmail = req.ToEmail, Message = req.Message };
            _db.Invites.Add(inv);
            await _db.SaveChangesAsync();
            return Ok(inv);
        }

    public class CreateInvite { public string? ToEmail { get; set; } public string? Message { get; set; } }
    }
}
