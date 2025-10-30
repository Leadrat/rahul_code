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
            // Ensure games table exists on startup
            _ = EnsureGamesTableExistsAsync();
        }

        private async Task EnsureGamesTableExistsAsync()
        {
            try
            {
                var connection = _db.Database.GetDbConnection();
                await connection.OpenAsync();
                var command = connection.CreateCommand();
                command.CommandText = @"
                    CREATE TABLE IF NOT EXISTS games (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        name TEXT,
                        players TEXT[],
                        human_player TEXT,
                        moves JSONB,
                        winner TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )";
                await command.ExecuteNonQueryAsync();
                await connection.CloseAsync();
                Console.WriteLine("Games table ensured to exist");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to ensure games table exists: {ex.Message}");
            }
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

        public async Task<Game> AddGameForUserAsync(string userId, Game game)
        {
            var uidInt = 0;
            int.TryParse(userId, out uidInt);
            game.UserId = uidInt;
            game.CreatedAt = DateTime.UtcNow;

            Console.WriteLine($"Adding game for user {userId} (parsed as {uidInt})");

            // try to set session RLS variable
            try
            {
                var sql = $"SET session app.current_user = '{userId}';";
                await _db.Database.ExecuteSqlRawAsync(sql);
                Console.WriteLine("Set session variable for RLS");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to set session variable: {ex.Message}");
                // ignore
            }

            try
            {
                _db.Games.Add(game);
                await _db.SaveChangesAsync();
                Console.WriteLine($"Successfully saved game with ID {game.Id}");
                return game;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Database error saving game: {ex.GetType().Name}: {ex.Message}");
                Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                throw;
            }
        }
    }
}
