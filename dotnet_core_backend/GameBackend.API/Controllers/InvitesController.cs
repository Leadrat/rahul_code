using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GameBackend.Application.DTOs;
using GameBackend.Application.Services;

namespace GameBackend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvitesController : ControllerBase
{
    private readonly IInviteService _inviteService;

    public InvitesController(IInviteService inviteService)
    {
        _inviteService = inviteService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InviteDto>>> GetUserInvites()
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var invites = await _inviteService.GetUserInvitesAsync(userId);
        return Ok(invites);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InviteDto>> GetInvite(int id)
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var invite = await _inviteService.GetInviteByIdAsync(id, userId);
        if (invite == null)
        {
            return NotFound();
        }

        return Ok(invite);
    }

    [HttpPost]
    public async Task<ActionResult<InviteDto>> CreateInvite([FromBody] CreateInviteDto request)
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            var invite = await _inviteService.CreateInviteAsync(request, userId);
            return CreatedAtAction(nameof(GetInvite), new { id = invite.Id }, invite);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateInviteStatus(int id, [FromBody] string status)
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await _inviteService.UpdateInviteStatusAsync(id, status, userId);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvite(int id)
    {
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await _inviteService.DeleteInviteAsync(id, userId);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }
}
