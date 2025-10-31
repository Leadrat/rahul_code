using GameBackend.Application.DTOs;
using GameBackend.Domain.Entities;
using GameBackend.Domain.Interfaces;

namespace GameBackend.Application.Services;

public class GameService : IGameService
{
    private readonly IGameRepository _gameRepository;

    public GameService(IGameRepository gameRepository)
    {
        _gameRepository = gameRepository;
    }

    public async Task<IEnumerable<GameDto>> GetUserGamesAsync(int userId)
    {
        var games = await _gameRepository.GetByUserIdAsync(userId);
        return games.Select(MapToDto);
    }

    public async Task<GameDto?> GetGameByIdAsync(int id, int userId)
    {
        var game = await _gameRepository.GetByIdAsync(id);
        if (game == null || game.UserId != userId)
        {
            return null;
        }

        return MapToDto(game);
    }

    public async Task<GameDto> CreateGameAsync(CreateGameDto request, int userId)
    {
        var game = new Game
        {
            UserId = userId,
            Name = request.Name,
            Players = request.Players,
            HumanPlayer = request.HumanPlayer,
            Moves = request.Moves,
            Winner = request.Winner,
            CreatedAt = DateTime.UtcNow
        };

        var createdGame = await _gameRepository.AddAsync(game);
        return MapToDto(createdGame);
    }

    public async Task<GameDto> UpdateGameAsync(int id, CreateGameDto request, int userId)
    {
        var existingGame = await _gameRepository.GetByIdAsync(id);
        if (existingGame == null || existingGame.UserId != userId)
        {
            throw new Exception("Game not found or access denied");
        }

        existingGame.Name = request.Name;
        existingGame.Players = request.Players;
        existingGame.HumanPlayer = request.HumanPlayer;
        existingGame.Moves = request.Moves;
        existingGame.Winner = request.Winner;

        await _gameRepository.UpdateAsync(existingGame);
        return MapToDto(existingGame);
    }

    public async Task<bool> DeleteGameAsync(int id, int userId)
    {
        var game = await _gameRepository.GetByIdAsync(id);
        if (game == null || game.UserId != userId)
        {
            return false;
        }

        await _gameRepository.DeleteAsync(game);
        return true;
    }

    private static GameDto MapToDto(Game game)
    {
        return new GameDto
        {
            Id = game.Id,
            UserId = game.UserId,
            Name = game.Name,
            Players = game.Players,
            HumanPlayer = game.HumanPlayer,
            Moves = game.Moves,
            Winner = game.Winner,
            CreatedAt = game.CreatedAt
        };
    }
}
