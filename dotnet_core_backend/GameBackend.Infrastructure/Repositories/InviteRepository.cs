using Microsoft.EntityFrameworkCore;
using GameBackend.Domain.Entities;
using GameBackend.Domain.Interfaces;
using GameBackend.Infrastructure.Data;

namespace GameBackend.Infrastructure.Repositories;

public class InviteRepository : Repository<Invite>, IInviteRepository
{
    public InviteRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Invite>> GetByFromUserIdAsync(int fromUserId)
    {
        return await _dbSet.Where(i => i.FromUserId == fromUserId).ToListAsync();
    }

    public async Task<IEnumerable<Invite>> GetByToEmailAsync(string toEmail)
    {
        return await _dbSet.Where(i => i.ToEmail == toEmail).ToListAsync();
    }
}
