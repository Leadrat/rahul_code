using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using GameBackend.Application.DTOs;
using GameBackend.Application.Services;
using GameBackend.API.Hubs;
using GameBackend.Domain.Interfaces;

namespace GameBackend.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvitesController : ControllerBase
{
    private readonly IInviteService _inviteService;
    private readonly IHubContext<GameHub> _hubContext;
    private readonly IUserRepository _userRepository;
    private readonly IGameService _gameService;

    public InvitesController(IInviteService inviteService, IHubContext<GameHub> hubContext, IUserRepository userRepository, IGameService gameService)
    {
        _inviteService = inviteService;
        _hubContext = hubContext;
        _userRepository = userRepository;
        _gameService = gameService;
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
        
        // Populate fromUserEmail for each invite and convert to snake_case for frontend consistency
        var invitesWithEmail = invites.Select(invite =>
        {
            if (invite.FromUserId > 0)
            {
                // For now, we'll need to fetch the user email
                // In a real implementation, you'd include this in the service layer
                var fromUser = _userRepository.GetByIdAsync(invite.FromUserId).Result;
                invite.FromUserEmail = fromUser?.Email ?? "";
            }
            return invite;
        }).Select(invite => new
        {
            id = invite.Id,
            from_user_id = invite.FromUserId,
            from_user_email = invite.FromUserEmail,
            to_email = invite.ToEmail,
            toUserId = invite.ToUserId,
            gameId = invite.GameId,
            status = invite.Status,
            message = invite.Message,
            expiresAt = invite.ExpiresAt,
            createdAt = invite.CreatedAt
        });

        return Ok(invitesWithEmail);
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

    [HttpPost("{id}/respond")]
    public async Task<ActionResult> RespondToInvite(int id, [FromBody] RespondToInviteDto request)
    {
        Console.WriteLine($"🎯 RespondToInvite endpoint called! Invite ID: {id}, Response: {request?.Response}");
        
        var userIdStr = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        Console.WriteLine($"🎯 User ID from token: {userIdStr}");
        
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            Console.WriteLine($"🎯 Unauthorized - invalid user ID: {userIdStr}");
            return Unauthorized();
        }

        try
        {
            if (request.Response.ToLower() == "decline")
            {
                // Delete the invite when declined
                var deleted = await _inviteService.DeleteInviteAsync(id, userId);
                if (!deleted)
                {
                    return NotFound(new { message = "Invite not found or you don't have permission to delete it" });
                }
                
                return Ok(new { message = "Invite declined and removed", deleted = true });
            }
            else if (request.Response.ToLower() == "accept")
            {
                Console.WriteLine($"Accepting invite {id} by user {userId}");
                
                // Get the invite details first
                var invite = await _inviteService.GetInviteByIdAsync(id, userId);
                if (invite == null)
                {
                    Console.WriteLine($"Invite {id} not found for user {userId}");
                    return NotFound(new { message = "Invite not found or you don't have permission to update it" });
                }

                Console.WriteLine($"Invite found: FromUserId={invite.FromUserId}, ToEmail={invite.ToEmail}, ToUserId={invite.ToUserId}");

                // Update the invite status when accepted
                var updated = await _inviteService.UpdateInviteStatusAsync(id, "accepted", userId);
                if (!updated)
                {
                    Console.WriteLine($"Failed to update invite {id} status");
                    return NotFound(new { message = "Invite not found or you don't have permission to update it" });
                }

                Console.WriteLine($"Invite {id} status updated to accepted");

                // Get both players' information
                var sender = await _userRepository.GetByIdAsync(invite.FromUserId);
                var receiver = await _userRepository.GetByIdAsync(userId);
                
                Console.WriteLine($"Sender: {sender?.Email}, Receiver: {receiver?.Email}");
                
                if (sender != null && receiver != null)
                {
                    // Create a new game with both players
                    var createGameDto = new CreateGameDto
                    {
                        Name = $"Game from {sender.Email} to {receiver.Email}",
                        Players = new[] { sender.Email.ToLower(), receiver.Email.ToLower() },
                        HumanPlayer = sender.Email.ToLower() // Sender starts as X
                    };

                    Console.WriteLine($"Creating game with players: {string.Join(" vs ", createGameDto.Players)}");

                    var game = await _gameService.CreateGameAsync(createGameDto, invite.FromUserId);
                    
                    Console.WriteLine($"Game created with ID: {game.Id}");
                    
                    // Send SignalR notification to both players about the game starting
                    var gameStartData = new
                    {
                        gameId = game.Id,
                        players = game.Players,
                        startedBy = sender.Email,
                        inviteId = invite.Id
                    };

                    Console.WriteLine($"Sending game:started notification to sender {invite.FromUserId} and receiver {invite.ToUserId}");

                    // Notify sender
                    await _hubContext.Clients.User(invite.FromUserId.ToString()).SendAsync("game:started", gameStartData);
                    
                    // Notify receiver
                    if (invite.ToUserId.HasValue)
                    {
                        await _hubContext.Clients.User(invite.ToUserId.Value.ToString()).SendAsync("game:started", gameStartData);
                    }

                    Console.WriteLine($"Game {game.Id} created and notifications sent for accepted invite {invite.Id}");

                    return Ok(new { 
                        message = "Invite accepted and game created", 
                        status = "accepted",
                        gameId = game.Id,
                        game = game
                    });
                }
                
                Console.WriteLine("Failed to create game - missing sender or receiver info");
                return Ok(new { message = "Invite accepted", status = "accepted" });
            }
            else
            {
                return BadRequest(new { message = "Invalid response. Must be 'accept' or 'decline'" });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
            // Get current user's email to prevent self-invites
            var currentUser = await _userRepository.GetByIdAsync(userId);
            if (currentUser != null && currentUser.Email.Equals(request.ToEmail, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "You cannot send an invite to yourself" });
            }

            var invite = await _inviteService.CreateInviteAsync(request, userId);
            
            // Send real-time notification if target user exists
            if (invite.ToUserId.HasValue)
            {
                var inviteData = new
                {
                    id = invite.Id,
                    from_user_id = userId,
                    from_user_email = currentUser?.Email ?? "",
                    to_email = invite.ToEmail,
                    gameId = invite.GameId,
                    message = invite.Message,
                    createdAt = invite.CreatedAt
                };
                
                Console.WriteLine($"Sending SignalR invite notification to user {invite.ToUserId.Value}");
                await _hubContext.Clients.User(invite.ToUserId.Value.ToString()).SendAsync("invite:received", inviteData);
                Console.WriteLine($"SignalR notification sent successfully");
            }
            else
            {
                Console.WriteLine($"Target user not found for email {request.ToEmail}, no SignalR notification sent");
            }
            
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
