import 'package:signalr_netcore/signalr_client.dart';
import 'storage_service.dart';

class SignalRService {
  static HubConnection? _connection;
  static final String hubUrl = 'https://bc63c715d5f7.ngrok-free.app/gameHub';
  
  static Future<HubConnection?> connect({
    Function(dynamic)? onInviteReceived,
    Function(dynamic)? onPresenceChanged,
    Function(dynamic)? onOnlineUsers,
    Function(dynamic)? onGameStarted,
    Function(dynamic)? onMoveApplied,
  }) async {
    if (_connection != null && _connection!.state == HubConnectionState.Connected) {
      return _connection;
    }
    
    final token = await StorageService.getToken();
    if (token == null) return null;
    
    final httpConnectionOptions = HttpConnectionOptions(
      accessTokenFactory: () async => token,
    );
    
    _connection = HubConnectionBuilder()
        .withUrl(hubUrl, options: httpConnectionOptions)
        .withAutomaticReconnect()
        .build();
    
    // Set up event handlers
    if (onInviteReceived != null) {
      _connection!.on('invite:received', onInviteReceived);
    }
    
    if (onPresenceChanged != null) {
      _connection!.on('presence:changed', onPresenceChanged);
    }
    
    if (onOnlineUsers != null) {
      _connection!.on('online:users', onOnlineUsers);
    }
    
    if (onGameStarted != null) {
      _connection!.on('game:started', onGameStarted);
      _connection!.on('game:please-start', onGameStarted);
    }
    
    if (onMoveApplied != null) {
      _connection!.on('move:applied', onMoveApplied);
    }
    
    try {
      print('🔌 [SignalR] Attempting to connect to: $hubUrl');
      print('🔌 [SignalR] Token available: ${token.isNotEmpty}');
      await _connection!.start();
      print('✅ [SignalR] Connected successfully!');
      return _connection;
    } catch (e) {
      print('❌ [SignalR] Connection failed: $e');
      print('❌ [SignalR] Connection state: ${_connection!.state}');
      print('❌ [SignalR] Connection URL: $hubUrl');
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
    if (_connection?.state == HubConnectionState.Connected) {
      await _connection!.invoke('SendMove', args: [gameId.toString(), move]);
    }
  }
  
  static Future<void> joinGame(int gameId) async {
    if (_connection?.state == HubConnectionState.Connected) {
      await _connection!.invoke('JoinGame', args: [gameId.toString(), {}]);
    }
  }
  
  static Future<void> getOnlineUsers() async {
    if (_connection?.state == HubConnectionState.Connected) {
      await _connection!.invoke('GetOnlineUsers');
    }
  }
  
  static bool get isConnected => 
      _connection?.state == HubConnectionState.Connected;
}
