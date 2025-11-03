import 'package:flutter/foundation.dart';
import '../models/game_models.dart';

class GameProvider with ChangeNotifier {
  List<String?> _squares = List.filled(9, null);
  String _currentPlayer = 'X';
  bool _isGameOver = false;
  List<int>? _winningLine;
  List<Move> _moveHistory = [];
  int? _currentGameId;
  List<String>? _currentGamePlayers;
  String? _currentGameNextEmail;
  List<Invite> _invites = [];
  Set<String> _onlineUsers = {};
  List<UserDetail> _onlineUserDetails = [];
  
  // Getters
  List<String?> get squares => _squares;
  String get currentPlayer => _currentPlayer;
  bool get isGameOver => _isGameOver;
  List<int>? get winningLine => _winningLine;
  List<Move> get moveHistory => _moveHistory;
  int? get currentGameId => _currentGameId;
  List<String>? get currentGamePlayers => _currentGamePlayers;
  String? get currentGameNextEmail => _currentGameNextEmail;
  List<Invite> get invites => _invites;
  Set<String> get onlineUsers => _onlineUsers;
  List<UserDetail> get onlineUserDetails => _onlineUserDetails;
  
  GameStatus get status {
    final result = calculateWinner(_squares);
    if (result != null) {
      return GameStatus(type: 'winner', player: result['player'], line: result['line']);
    }
    if (_squares.every((s) => s != null)) {
      return GameStatus(type: 'draw');
    }
    return GameStatus(type: 'next', player: _currentPlayer);
  }
  
  Map<String, dynamic>? calculateWinner(List<String?> squares) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6], // diagonals
    ];
    
    for (final line in lines) {
      final a = squares[line[0]];
      final b = squares[line[1]];
      final c = squares[line[2]];
      
      if (a != null && a == b && a == c) {
        return {'player': a, 'line': line};
      }
    }
    return null;
  }
  
  void makeMove(int index) {
    if (_squares[index] != null || _isGameOver) return;
    
    _squares[index] = _currentPlayer;
    
    final move = Move(
      player: _currentPlayer,
      position: index,
      timestamp: DateTime.now(),
      moveNumber: _moveHistory.length + 1,
    );
    _moveHistory.add(move);
    
    final result = calculateWinner(_squares);
    if (result != null) {
      _isGameOver = true;
      _winningLine = result['line'] as List<int>?;
    } else if (_squares.every((s) => s != null)) {
      _isGameOver = true;
    } else {
      _currentPlayer = _currentPlayer == 'X' ? 'O' : 'X';
    }
    
    notifyListeners();
  }
  
  void applyRemoteMove(int position, String player) {
    print('🎮 [REMOTE_MOVE] Applying remote move at position $position for player $player');
    
    if (_squares[position] != null) {
      print('❌ [REMOTE_MOVE] Position $position already occupied');
      return;
    }
    
    _squares[position] = player;
    print('✅ [REMOTE_MOVE] Square updated at position $position');
    
    // Update current player for next turn
    _currentPlayer = player == 'X' ? 'O' : 'X';
    print('🔄 [REMOTE_MOVE] Next player: $_currentPlayer');
    
    final move = Move(
      player: player,
      position: position,
      timestamp: DateTime.now(),
      moveNumber: _moveHistory.length + 1,
    );
    _moveHistory.add(move);
    print('📝 [REMOTE_MOVE] Move added to history. Total moves: ${_moveHistory.length}');
    
    final result = calculateWinner(_squares);
    if (result != null) {
      _isGameOver = true;
      _winningLine = result['line'] as List<int>?;
      print('🏆 [REMOTE_MOVE] Game over! Winner: $player');
    } else if (_squares.every((s) => s != null)) {
      _isGameOver = true;
      print('🤝 [REMOTE_MOVE] Game over! Draw');
    }
    
    print('🔔 [REMOTE_MOVE] Calling notifyListeners()');
    notifyListeners();
    print('✅ [REMOTE_MOVE] Remote move applied successfully');
  }
  
  void resetGame({String? newHumanPlayer}) {
    _squares = List.filled(9, null);
    _currentPlayer = 'X';
    _isGameOver = false;
    _winningLine = null;
    _moveHistory = [];
    notifyListeners();
  }
  
  void startNewLocalGame() {
    _currentGameId = null;
    _currentGamePlayers = null;
    _currentGameNextEmail = null;
    resetGame();
  }
  
  void loadGame(Map<String, dynamic> gameData) {
    _squares = List.filled(9, null);
    _moveHistory = [];
    
    final players = gameData['players'] as List?;
    final moves = gameData['moves'] as List?;
    
    if (players != null && players.isNotEmpty) {
      _currentGamePlayers = players.map((p) => p.toString().toLowerCase()).toList();
    }
    
    if (moves != null) {
      final signMap = <String, String>{};
      if (_currentGamePlayers != null && _currentGamePlayers!.isNotEmpty) {
        if (_currentGamePlayers!.length > 0) signMap[_currentGamePlayers![0]] = 'X';
        if (_currentGamePlayers!.length > 1) signMap[_currentGamePlayers![1]] = 'O';
      }
      
      for (var i = 0; i < moves.length; i++) {
        final m = moves[i];
        final pos = m['position'] ?? m['index'] ?? 0;
        var sign = m['sign'] ?? m['player'];
        
        if (sign == null && m['playerEmail'] != null) {
          final email = m['playerEmail'].toString().toLowerCase();
          sign = signMap[email];
        }
        
        if (sign != null) {
          _squares[pos] = sign;
          _moveHistory.add(Move(
            player: sign,
            position: pos,
            timestamp: DateTime.now(),
            moveNumber: i + 1,
          ));
        }
      }
      
      _currentPlayer = moves.length % 2 == 0 ? 'X' : 'O';
    }
    
    notifyListeners();
  }
  
  void setCurrentGameId(int? gameId) {
    _currentGameId = gameId;
    notifyListeners();
  }
  
  void setInvites(List<Invite> invites) {
    _invites = invites;
    notifyListeners();
  }
  
  void addInvite(Invite invite) {
    _invites.insert(0, invite);
    notifyListeners();
  }
  
  void removeInvite(int inviteId) {
    print('📤 [INVITE] Removing invite $inviteId from local state');
    final countBefore = _invites.length;
    _invites.removeWhere((inv) => inv.id == inviteId);
    final countAfter = _invites.length;
    print('✅ [INVITE] Invite removed. Count: $countBefore → $countAfter');
    notifyListeners();
  }
  
  void updateOnlineUsers(Set<String> users) {
    _onlineUsers = users;
    notifyListeners();
  }
  
  void addOnlineUser(String userId) {
    _onlineUsers.add(userId);
    notifyListeners();
  }
  
  void removeOnlineUser(String userId) {
    _onlineUsers.remove(userId);
    notifyListeners();
  }
  
  void setOnlineUserDetails(List<UserDetail> details) {
    print('👥 [PROVIDER] Setting ${details.length} online users');
    for (var user in details) {
      print('👥 [PROVIDER] - ${user.email} (ID: ${user.id})');
    }
    _onlineUserDetails = details;
    print('👥 [PROVIDER] Notifying listeners...');
    notifyListeners();
    print('✅ [PROVIDER] Online users updated');
  }
  
  void setGameStarted(int gameId, List<String> players) {
    _currentGameId = gameId;
    _currentGamePlayers = players;
    resetGame();
  }
}
