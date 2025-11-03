import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'game_replay_screen.dart';

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

  void _replayGame(Map<String, dynamic> game) {
    final parsedGame = Map<String, dynamic>.from(game);

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => GameReplayScreen(gameData: parsedGame),
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
                    final rawGame = _games[index];
                    final game = Map<String, dynamic>.from(rawGame as Map);
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
