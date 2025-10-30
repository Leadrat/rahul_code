using Microsoft.EntityFrameworkCore;
using System.Linq;
using dotnet_core_backend.Data;
using dotnet_core_backend.Entities;

namespace dotnet_core_backend.Services
{
    public class GameService
    {
        private readonly ApplicationDbContext _db;
        public GameService(ApplicationDbContext db)
        {
            _db = db;
        }

        // Set a session variable to support RLS and then query games for that user
        public async Task<List<Game>> GetGamesForUserAsync(string userId)
        {
            // attempt to set session variable used by RLS policy
            try
            {
                var sql = $"SET session app.current_user = '{userId}';";
                await _db.Database.ExecuteSqlRawAsync(sql);
            }
            catch
            {
                // ignore if setting session variable fails (e.g., permission)
            }

            var uidInt = 0;
            int.TryParse(userId, out uidInt);
            // fallback: filter by user id column as well
            return await _db.Games.Where(g => g.UserId == uidInt).ToListAsync();
        }
    }
}
