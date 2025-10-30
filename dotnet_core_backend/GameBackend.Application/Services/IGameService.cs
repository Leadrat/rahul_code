using GameBackend.Application.DTOs;

namespace GameBackend.Application.Services;

public interface IGameService
{
    Task<IEnumerable<GameDto>> GetUserGamesAsync(int userId);
    Task<GameDto?> GetGameByIdAsync(int id, int userId);
    Task<GameDto> CreateGameAsync(CreateGameDto request, int userId);
    Task<GameDto> UpdateGameAsync(int id, CreateGameDto request, int userId);
    Task<bool> DeleteGameAsync(int id, int userId);
}
