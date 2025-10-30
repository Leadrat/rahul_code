using System.Linq.Expressions;
using GameBackend.Domain.Entities;

namespace GameBackend.Domain.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
}

public interface IUserRepository : IRepository<ApplicationUser>
{
    Task<ApplicationUser?> GetByEmailAsync(string email);
    Task<bool> IsEmailUniqueAsync(string email);
}

public interface IGameRepository : IRepository<Game>
{
    Task<IEnumerable<Game>> GetByUserIdAsync(int userId);
}

public interface IInviteRepository : IRepository<Invite>
{
    Task<IEnumerable<Invite>> GetByFromUserIdAsync(int fromUserId);
    Task<IEnumerable<Invite>> GetByToEmailAsync(string toEmail);
}
