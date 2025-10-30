using GameBackend.Application.DTOs;
using GameBackend.Domain.Entities;
using GameBackend.Domain.Interfaces;

namespace GameBackend.Application.Services;

public class InviteService : IInviteService
{
    private readonly IInviteRepository _inviteRepository;

    public InviteService(IInviteRepository inviteRepository)
    {
        _inviteRepository = inviteRepository;
    }

    public async Task<IEnumerable<InviteDto>> GetUserInvitesAsync(int userId)
    {
        var invites = await _inviteRepository.GetByFromUserIdAsync(userId);
        return invites.Select(MapToDto);
    }

    public async Task<InviteDto?> GetInviteByIdAsync(int id, int userId)
    {
        var invite = await _inviteRepository.GetByIdAsync(id);
        if (invite == null || invite.FromUserId != userId)
        {
            return null;
        }

        return MapToDto(invite);
    }

    public async Task<InviteDto> CreateInviteAsync(CreateInviteDto request, int userId)
    {
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
        return MapToDto(createdInvite);
    }

    public async Task<bool> UpdateInviteStatusAsync(int id, string status, int userId)
    {
        var invite = await _inviteRepository.GetByIdAsync(id);
        if (invite == null || invite.FromUserId != userId)
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
        if (invite == null || invite.FromUserId != userId)
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
            FromUserEmail = invite.FromUser.Email,
            ToEmail = invite.ToEmail,
            GameId = invite.GameId,
            Status = invite.Status,
            Message = invite.Message,
            ExpiresAt = invite.ExpiresAt,
            CreatedAt = invite.CreatedAt
        };
    }
}
