using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using GameBackend.Domain.Interfaces;
using System.Collections.Concurrent;

namespace GameBackend.API.Hubs;

[Authorize]
public class GameHub : Hub
{
    private static readonly ConcurrentDictionary<string, string> UserConnections = new();
    private readonly IUserRepository _userRepository;

    public GameHub(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        var userEmail = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
        
        Console.WriteLine($"SignalR: User connecting - userId: {userId}, userEmail: {userEmail}, connectionId: {Context.ConnectionId}");
        
        if (!string.IsNullOrEmpty(userId))
        {
            UserConnections[userId] = Context.ConnectionId;
            Console.WriteLine($"SignalR: Added user {userId} to connections. Total connections: {UserConnections.Count}");
            Console.WriteLine($"SignalR: Current online users: [{string.Join(", ", UserConnections.Keys)}]");
            
            await Clients.Others.SendAsync("presence:changed", new { userId, online = true });
            Console.WriteLine($"SignalR: Sent presence:changed event for user {userId} (online=true) to all other clients");
        }
        else
        {
            Console.WriteLine($"SignalR: Connection rejected - no userId found in token");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        var userEmail = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress")?.Value;
        
        Console.WriteLine($"SignalR: User disconnecting - userId: {userId}, userEmail: {userEmail}, connectionId: {Context.ConnectionId}, exception: {exception?.Message}");
        
        if (!string.IsNullOrEmpty(userId))
        {
            UserConnections.TryRemove(userId, out _);
            Console.WriteLine($"SignalR: Removed user {userId} from connections. Total connections: {UserConnections.Count}");
            Console.WriteLine($"SignalR: Current online users: [{string.Join(", ", UserConnections.Keys)}]");
            
            await Clients.Others.SendAsync("presence:changed", new { userId, online = false });
            Console.WriteLine($"SignalR: Sent presence:changed event for user {userId} (online=false) to all other clients");
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

    public async Task JoinGame(string gameId, object joinData)
    {
        var userId = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        await Clients.All.SendAsync("game:joined", new { gameId, userId, data = joinData });
    }

    public async Task OpenGame(string gameId, object openData)
    {
        var userId = Context.User?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        await Clients.All.SendAsync("game:opened", new { gameId, userId, data = openData });
    }

    public async Task GetOnlineUsers()
    {
        var onlineUserIds = UserConnections.Keys.ToList();
        var userDetails = new List<object>();
        
        // Get actual user details for online users
        foreach (var userIdStr in onlineUserIds)
        {
            if (int.TryParse(userIdStr, out var userId))
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user != null)
                {
                    userDetails.Add(new { id = userIdStr, email = user.Email });
                }
                else
                {
                    userDetails.Add(new { id = userIdStr, email = $"Unknown User {userIdStr}" });
                }
            }
            else
            {
                userDetails.Add(new { id = userIdStr, email = $"Invalid User ID: {userIdStr}" });
            }
        }
        
        await Clients.Caller.SendAsync("online:users", new { 
            users = onlineUserIds, // Keep IDs for compatibility
            userDetails = userDetails // Add detailed user info with emails
        });
    }
}
