using Microsoft.EntityFrameworkCore;
using GameBackend.Domain.Entities;
using GameBackend.Domain.Interfaces;
using GameBackend.Infrastructure.Data;

namespace GameBackend.Infrastructure.Repositories;

public class GameRepository : Repository<Game>, IGameRepository
{
    public GameRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Game>> GetByUserIdAsync(int userId)
    {
        return await _context.Games
            .Where(g => g.UserId == userId)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }
}
