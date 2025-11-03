import 'dart:convert';

import 'package:flutter/material.dart';

class GameReplayScreen extends StatefulWidget {
  final Map<String, dynamic> gameData;

  const GameReplayScreen({super.key, required this.gameData});

  @override
  State<GameReplayScreen> createState() => _GameReplayScreenState();
}

class _GameReplayScreenState extends State<GameReplayScreen> {
  int _currentMoveIndex = 0;
  late List<String?> _currentBoard;
  late final List<Map<String, dynamic>> _moves;

  @override
  void initState() {
    super.initState();
    _currentBoard = List.filled(9, null);
    _moves = _parseMoves(widget.gameData['moves']);
    _updateBoard();
  }

  List<Map<String, dynamic>> _parseMoves(dynamic movesData) {
    try {
      final List<dynamic> rawMoves;
      if (movesData is String && movesData.isNotEmpty) {
        rawMoves = jsonDecode(movesData) as List<dynamic>;
      } else if (movesData is List) {
        rawMoves = movesData;
      } else {
        return [];
      }

      return rawMoves
          .map((move) => Map<String, dynamic>.from(move as Map))
          .toList();
    } catch (e) {
      debugPrint('📹 [REPLAY] Error parsing moves: $e');
      return [];
    }
  }

  void _updateBoard() {
    _currentBoard = List.filled(9, null);
    for (int i = 0; i <= _currentMoveIndex && i < _moves.length; i++) {
      final move = _moves[i];
      final position = move['position'] ?? move['index'];
      final sign = move['sign'] ?? move['player'];

      if (position is int && position >= 0 && position < 9 && sign is String) {
        _currentBoard[position] = sign;
      }
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
    if (_moves.isNotEmpty) {
      _currentMoveIndex = _moves.length - 1;
      _updateBoard();
    }
  }

  @override
  Widget build(BuildContext context) {
    final gameName = widget.gameData['name']?.toString() ?? 'Game Replay';
    final players = (widget.gameData['players'] as List?)?.map((p) => p.toString()).toList() ?? [];
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
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  if (players.isNotEmpty)
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
                    winner != null && winner.toString().isNotEmpty
                        ? 'Winner: $winner'
                        : 'Draw',
                    style: TextStyle(
                      fontSize: 16,
                      color: winner != null ? Colors.amber : Colors.grey.shade400,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _moves.isEmpty
                        ? 'No moves recorded'
                        : 'Move ${_currentMoveIndex + 1} of ${_moves.length}',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade400,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
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
                  if (_moves.isEmpty)
                    const Text(
                      'No moves recorded for this game.',
                      style: TextStyle(color: Colors.white60),
                    )
                  else
                    SizedBox(
                      height: 240,
                      child: ListView.builder(
                        padding: EdgeInsets.zero,
                        itemCount: _moves.length,
                        itemBuilder: (context, listIndex) {
                          final move = _moves[listIndex];
                          final position = move['position'] ?? move['index'];
                          final sign = move['sign'] ?? move['player'] ?? '?';
                          final isCurrent = listIndex == _currentMoveIndex;

                          return Container(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                            margin: const EdgeInsets.only(bottom: 4),
                            decoration: BoxDecoration(
                              color: isCurrent
                                  ? Colors.blue.withOpacity(0.3)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Move ${listIndex + 1}',
                                  style: TextStyle(
                                    color: isCurrent ? Colors.white : Colors.grey.shade300,
                                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                                Text(
                                  '$sign → Position $position',
                                  style: TextStyle(
                                    color: isCurrent ? Colors.white : Colors.grey.shade400,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
