import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SavedGamesScreen extends StatefulWidget {
  const SavedGamesScreen({super.key});

  @override
  State<SavedGamesScreen> createState() => _SavedGamesScreenState();
}

class _SavedGamesScreenState extends State<SavedGamesScreen> {
  List<dynamic> _games = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadGames();
  }

  Future<void> _loadGames() async {
    setState(() => _loading = true);
    try {
      final games = await ApiService.getUserGames();
      setState(() {
        _games = games;
        _loading = false;
      });
    } catch (e) {
      print('❌ [SAVED_GAMES] Error loading games: $e');
      setState(() => _loading = false);
    }
  }

  void _replayGame(dynamic game) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => GameReplayScreen(gameData: game),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Saved Games'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadGames,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _games.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.games_outlined,
                          size: 64, color: Colors.grey.shade600),
                      const SizedBox(height: 16),
                      Text(
                        'No saved games yet',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _games.length,
                  itemBuilder: (context, index) {
                    final game = _games[index];
                    final players = game['players'] as List?;
                    
                    // Moves is stored as JSON string, need to parse it
                    List? moves;
                    try {
                      final movesData = game['moves'];
                      if (movesData is String && movesData.isNotEmpty) {
                        moves = jsonDecode(movesData) as List?;
                      } else if (movesData is List) {
                        moves = movesData;
                      }
                    } catch (e) {
                      print('Error parsing moves: $e');
                      moves = null;
                    }
                    
                    final winner = game['winner'];
                    final gameName = game['name'] ?? 'Game ${game['id']}';
                    final createdAt = game['createdAt'];

                    return Card(
                      color: Colors.grey.shade800,
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: winner != null
                              ? Colors.amber
                              : Colors.grey.shade700,
                          child: Icon(
                            winner != null ? Icons.emoji_events : Icons.games,
                            color: Colors.white,
                          ),
                        ),
                        title: Text(
                          gameName,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            if (players != null && players.isNotEmpty)
                              Text(
                                players.join(' vs '),
                                style: TextStyle(color: Colors.grey.shade400),
                              ),
                            const SizedBox(height: 2),
                            Text(
                              '${moves?.length ?? 0} moves • ${winner != null ? 'Winner: $winner' : 'Draw'}',
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 12,
                              ),
                            ),
                            if (createdAt != null)
                              Text(
                                _formatDate(createdAt),
                                style: TextStyle(
                                  color: Colors.grey.shade600,
                                  fontSize: 11,
                                ),
                              ),
                          ],
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.play_arrow, color: Colors.blue),
                          onPressed: () => _replayGame(game),
                        ),
                        onTap: () => _replayGame(game),
                      ),
                    );
                  },
                ),
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return '';
    try {
      final dt = DateTime.parse(date.toString());
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return '';
    }
  }
}

class GameReplayScreen extends StatefulWidget {
  final dynamic gameData;

  const GameReplayScreen({super.key, required this.gameData});

  @override
  State<GameReplayScreen> createState() => _GameReplayScreenState();
}

class _GameReplayScreenState extends State<GameReplayScreen> {
  int _currentMoveIndex = 0;
  List<String?> _currentBoard = List.filled(9, null);
  List<dynamic> _moves = [];

  @override
  void initState() {
    super.initState();
    
    // Parse moves from JSON string or use as list
    try {
      final movesData = widget.gameData['moves'];
      if (movesData is String && movesData.isNotEmpty) {
        _moves = jsonDecode(movesData) as List? ?? [];
      } else if (movesData is List) {
        _moves = movesData;
      } else {
        _moves = [];
      }
    } catch (e) {
      print('Error parsing moves in replay: $e');
      _moves = [];
    }
    
    print('📹 [REPLAY] Loaded ${_moves.length} moves for replay');
    _updateBoard();
  }

  void _updateBoard() {
    _currentBoard = List.filled(9, null);
    for (int i = 0; i <= _currentMoveIndex && i < _moves.length; i++) {
      final move = _moves[i];
      final pos = move['position'] ?? move['index'] ?? 0;
      final sign = move['sign'] ?? move['player'] ?? 'X';
      _currentBoard[pos] = sign;
    }
    setState(() {});
  }

  void _nextMove() {
    if (_currentMoveIndex < _moves.length - 1) {
      _currentMoveIndex++;
      _updateBoard();
    }
  }

  void _previousMove() {
    if (_currentMoveIndex > 0) {
      _currentMoveIndex--;
      _updateBoard();
    }
  }

  void _resetReplay() {
    _currentMoveIndex = 0;
    _updateBoard();
  }

  void _showAllMoves() {
    _currentMoveIndex = _moves.length - 1;
    _updateBoard();
  }

  @override
  Widget build(BuildContext context) {
    final gameName = widget.gameData['name'] ?? 'Game Replay';
    final players = widget.gameData['players'] as List?;
    final winner = widget.gameData['winner'];

    return Scaffold(
      backgroundColor: Colors.grey.shade900,
      appBar: AppBar(
        title: Text(gameName),
        backgroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Game info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  if (players != null && players.isNotEmpty)
                    Text(
                      players.join(' vs '),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    winner != null ? 'Winner: $winner' : 'Draw',
                    style: TextStyle(
                      fontSize: 16,
                      color: winner != null ? Colors.amber : Colors.grey.shade400,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Move ${_currentMoveIndex + 1} of ${_moves.length}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade400,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Game board
            AspectRatio(
              aspectRatio: 1,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: GridView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: 9,
                  itemBuilder: (context, index) {
                    final value = _currentBoard[index];
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey.shade800,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: value != null
                            ? Text(
                                value,
                                style: TextStyle(
                                  fontSize: 48,
                                  fontWeight: FontWeight.bold,
                                  color: value == 'X' ? Colors.blue : Colors.red,
                                ),
                              )
                            : null,
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Replay controls
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: const Icon(Icons.skip_previous, size: 32),
                  color: Colors.blue,
                  onPressed: _currentMoveIndex > 0 ? _resetReplay : null,
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_left, size: 32),
                  color: Colors.blue,
                  onPressed: _currentMoveIndex > 0 ? _previousMove : null,
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right, size: 32),
                  color: Colors.blue,
                  onPressed: _currentMoveIndex < _moves.length - 1 ? _nextMove : null,
                ),
                IconButton(
                  icon: const Icon(Icons.skip_next, size: 32),
                  color: Colors.blue,
                  onPressed: _currentMoveIndex < _moves.length - 1 ? _showAllMoves : null,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Move history
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Move History',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._moves.asMap().entries.map((entry) {
                    final index = entry.key;
                    final move = entry.value;
                    final pos = move['position'] ?? move['index'] ?? 0;
                    final sign = move['sign'] ?? move['player'] ?? 'X';
                    final isCurrent = index == _currentMoveIndex;

                    return Container(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      margin: const EdgeInsets.only(bottom: 4),
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? Colors.blue.withOpacity(0.3)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Move ${index + 1}: $sign → Position $pos',
                        style: TextStyle(
                          color: isCurrent ? Colors.white : Colors.grey.shade300,
                          fontSize: 14,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
