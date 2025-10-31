using GameBackend.Application.DTOs;
using GameBackend.Domain.Entities;
using GameBackend.Domain.Interfaces;

namespace GameBackend.Application.Services;

public class InviteService : IInviteService
{
    private readonly IInviteRepository _inviteRepository;
    private readonly IUserRepository _userRepository;

    public InviteService(IInviteRepository inviteRepository, IUserRepository userRepository)
    {
        _inviteRepository = inviteRepository;
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<InviteDto>> GetUserInvitesAsync(int userId)
    {
        // Get the user's email first
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Enumerable.Empty<InviteDto>();
        }
        
        // Get invites sent to this user's email
        var invites = await _inviteRepository.GetByToEmailAsync(user.Email);
        return invites.Select(MapToDto);
    }

    public async Task<InviteDto?> GetInviteByIdAsync(int id, int userId)
    {
        var invite = await _inviteRepository.GetByIdAsync(id);
        if (invite == null)
        {
            return null;
        }

        // Get the user making the request
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        // Allow access if user is the sender OR the receiver (by email)
        if (invite.FromUserId != userId && user.Email.ToLower() != invite.ToEmail.ToLower())
        {
            return null;
        }

        return MapToDto(invite);
    }

    public async Task<InviteDto> CreateInviteAsync(CreateInviteDto request, int userId)
    {
        // Find the target user by email
        var targetUser = await _userRepository.GetByEmailAsync(request.ToEmail);
        
        var invite = new Invite
        {
            FromUserId = userId,
            ToEmail = request.ToEmail,
            GameId = request.GameId,
            Message = request.Message,
            ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(7),
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        var createdInvite = await _inviteRepository.AddAsync(invite);
        
        // Return DTO with target user info if found
        var dto = MapToDto(createdInvite);
        if (targetUser != null)
        {
            dto.ToUserId = targetUser.Id;
        }
        
        return dto;
    }

    public async Task<bool> UpdateInviteStatusAsync(int id, string status, int userId)
    {
        var invite = await _inviteRepository.GetByIdAsync(id);
        if (invite == null)
        {
            return false;
        }

        // Get the user's email to check if they are the receiver
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return false;
        }

        // Allow update if user is the sender OR the receiver (person who received the invite)
        var isSender = invite.FromUserId == userId;
        var isReceiver = user.Email.Equals(invite.ToEmail, StringComparison.OrdinalIgnoreCase);

        if (!isSender && !isReceiver)
        {
            return false;
        }

        invite.Status = status;
        await _inviteRepository.UpdateAsync(invite);
        return true;
    }

    public async Task<bool> DeleteInviteAsync(int id, int userId)
    {
        var invite = await _inviteRepository.GetByIdAsync(id);
        if (invite == null)
        {
            return false;
        }

        // Get the user's email to check if they are the receiver
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return false;
        }

        // Allow deletion if user is the sender OR the receiver (person who received the invite)
        var isSender = invite.FromUserId == userId;
        var isReceiver = user.Email.Equals(invite.ToEmail, StringComparison.OrdinalIgnoreCase);

        if (!isSender && !isReceiver)
        {
            return false;
        }

        await _inviteRepository.DeleteAsync(invite);
        return true;
    }

    private static InviteDto MapToDto(Invite invite)
    {
        return new InviteDto
        {
            Id = invite.Id,
            FromUserId = invite.FromUserId,
            FromUserEmail = "", // Will be set by the controller after fetching user
            ToEmail = invite.ToEmail,
            ToUserId = null, // Will be set by the service if target user is found
            GameId = invite.GameId,
            Status = invite.Status,
            Message = invite.Message,
            ExpiresAt = invite.ExpiresAt,
            CreatedAt = invite.CreatedAt
        };
    }
}
