import 'package:signalr_netcore/signalr_client.dart';
import 'storage_service.dart';

class SignalRService {
  static HubConnection? _connection;
  static final String hubUrl = 'https://5629d3d33922.ngrok-free.app/gameHub';
  
  static Future<HubConnection?> connect({
    Function(dynamic)? onInviteReceived,
    Function(dynamic)? onPresenceChanged,
    Function(dynamic)? onOnlineUsers,
    Function(dynamic)? onGameStarted,
    Function(dynamic)? onMoveApplied,
  }) async {
    print('🔌 [SignalR] Connect called');
    
    if (_connection != null && _connection!.state == HubConnectionState.Connected) {
      print('🔌 [SignalR] Already connected');
      return _connection;
    }
    
    print('🔌 [SignalR] Getting token...');
    final token = await StorageService.getToken();
    if (token == null) {
      print('❌ [SignalR] No token found, cannot connect');
      return null;
    }
    
    print('🔌 [SignalR] Token found: ${token.substring(0, 20)}...');
    print('🔌 [SignalR] Connecting to: $hubUrl');
    
    print('🔌 [SignalR] Creating connection with token factory...');
    final httpConnectionOptions = HttpConnectionOptions(
      accessTokenFactory: () async {
        print('🔌 [SignalR] Token factory called');
        return token;
      },
    );
    
    print('🔌 [SignalR] Building HubConnection...');
    _connection = HubConnectionBuilder()
        .withUrl(hubUrl, options: httpConnectionOptions)
        .withAutomaticReconnect()
        .build();
    
    print('🔌 [SignalR] Connection built, current state: ${_connection!.state}');
    
    // Set up event handlers
    print('🔌 [SignalR] Registering event handlers...');
    
    if (onInviteReceived != null) {
      _connection!.on('invite:received', onInviteReceived);
      print('🔌 [SignalR] - Registered invite:received');
    }
    
    if (onPresenceChanged != null) {
      _connection!.on('presence:changed', onPresenceChanged);
      print('🔌 [SignalR] - Registered presence:changed');
    }
    
    if (onOnlineUsers != null) {
      _connection!.on('online:users', onOnlineUsers);
      print('🔌 [SignalR] - Registered online:users');
    }
    
    if (onGameStarted != null) {
      _connection!.on('game:started', onGameStarted);
      _connection!.on('game:please-start', onGameStarted);
      print('🔌 [SignalR] - Registered game:started');
    }
    
    if (onMoveApplied != null) {
      _connection!.on('move:applied', onMoveApplied);
      print('🔌 [SignalR] - Registered move:applied');
    }
    
    print('🔌 [SignalR] All handlers registered');
    
    try {
      print('🔌 [SignalR] Starting connection...');
      print('🔌 [SignalR] State before start: ${_connection!.state}');
      
      await _connection!.start();
      
      print('✅ [SignalR] Connection start completed!');
      print('✅ [SignalR] State after start: ${_connection!.state}');
      print('✅ [SignalR] Is connected: ${_connection!.state == HubConnectionState.Connected}');
      
      return _connection;
    } catch (e, stackTrace) {
      print('❌ [SignalR] Connection failed with error: $e');
      print('❌ [SignalR] Error type: ${e.runtimeType}');
      print('❌ [SignalR] Connection state after error: ${_connection!.state}');
      print('❌ [SignalR] Connection URL: $hubUrl');
      print('❌ [SignalR] Stack trace: $stackTrace');
      
      // Clean up failed connection
      _connection = null;
      
      return null;
    }
  }
  
  static Future<void> disconnect() async {
    if (_connection != null) {
      await _connection!.stop();
      _connection = null;
    }
  }
  
  static Future<void> sendMove(int gameId, Map<String, dynamic> move) async {
    print('🎮 [SEND_MOVE] Attempting to send move for game $gameId');
    print('🎮 [SEND_MOVE] Connection state: ${_connection?.state}');
    print('🎮 [SEND_MOVE] Move data: $move');
    
    if (_connection?.state == HubConnectionState.Connected) {
      try {
        print('🎮 [SEND_MOVE] Invoking SendMove with gameId: ${gameId.toString()}, move: $move');
        await _connection!.invoke('SendMove', args: [gameId.toString(), move]);
        print('✅ [SEND_MOVE] Move sent successfully');
      } catch (e, stackTrace) {
        print('❌ [SEND_MOVE] Error sending move: $e');
        print('❌ [SEND_MOVE] Stack trace: $stackTrace');
      }
    } else {
      print('❌ [SEND_MOVE] Not connected to SignalR. State: ${_connection?.state}');
    }
  }
  
  static Future<void> joinGame(int gameId) async {
    if (_connection?.state == HubConnectionState.Connected) {
      await _connection!.invoke('JoinGame', args: [gameId.toString(), {}]);
    }
  }
  
  static Future<void> getOnlineUsers() async {
    print('👥 [SignalR] Getting online users...');
    print('👥 [SignalR] Connection state: ${_connection?.state}');
    
    if (_connection?.state == HubConnectionState.Connected) {
      print('👥 [SignalR] Invoking GetOnlineUsers...');
      try {
        await _connection!.invoke('GetOnlineUsers');
        print('✅ [SignalR] GetOnlineUsers invoked successfully');
      } catch (e) {
        print('❌ [SignalR] Error invoking GetOnlineUsers: $e');
      }
    } else {
      print('❌ [SignalR] Connection not established. State: ${_connection?.state}');
    }
  }
  
  static bool get isConnected => 
      _connection?.state == HubConnectionState.Connected;
}
