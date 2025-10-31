using GameBackend.Application.DTOs;

namespace GameBackend.Application.Services;

public interface IInviteService
{
    Task<IEnumerable<InviteDto>> GetUserInvitesAsync(int userId);
    Task<InviteDto?> GetInviteByIdAsync(int id, int userId);
    Task<InviteDto> CreateInviteAsync(CreateInviteDto request, int userId);
    Task<bool> UpdateInviteStatusAsync(int id, string status, int userId);
    Task<bool> DeleteInviteAsync(int id, int userId);
}
