using GameBackend.Application.DTOs;

namespace GameBackend.Application.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserDto?> GetCurrentUserAsync(int userId);
    Task<string> GenerateJwtTokenAsync(int userId, string email);
}
