using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace GameBackend.API.Hubs;

[Authorize]
public class GameHub : Hub
{
    private static readonly ConcurrentDictionary<string, string> UserConnections = new();

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            UserConnections[userId] = Context.ConnectionId;
            await Clients.Others.SendAsync("presence:changed", new { userId, online = true });
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            UserConnections.TryRemove(userId, out _);
            await Clients.Others.SendAsync("presence:changed", new { userId, online = false });
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendInvite(string toUserId, object inviteData)
    {
        var fromUserId = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        
        if (UserConnections.TryGetValue(toUserId, out var connectionId))
        {
            await Clients.Client(connectionId).SendAsync("invite:received", inviteData);
        }
    }

    public async Task UpdateInviteStatus(string inviteId, string status)
    {
        var userId = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        
        await Clients.All.SendAsync("invite:status", new { inviteId, status, userId });
    }

    public async Task SendGameState(string gameId, object gameState)
    {
        await Clients.All.SendAsync("game:state", new { gameId, state = gameState });
    }

    public async Task StartGame(string gameId, object gameData)
    {
        await Clients.All.SendAsync("game:started", new { gameId, data = gameData });
    }

    public async Task RequestGameStart(string gameId, object requestData)
    {
        await Clients.All.SendAsync("game:please-start", new { gameId, data = requestData });
    }

    public async Task SendMove(string gameId, object moveData)
    {
        await Clients.All.SendAsync("move:applied", new { gameId, move = moveData });
    }
}
