import 'dart:convert';

import 'package:flutter/material.dart';

class AdminGameReplayScreen extends StatefulWidget {
  final Map<String, dynamic> game;

  const AdminGameReplayScreen({super.key, required this.game});

  @override
  State<AdminGameReplayScreen> createState() => _AdminGameReplayScreenState();
}

class _AdminGameReplayScreenState extends State<AdminGameReplayScreen> {
  late final List<Map<String, dynamic>> _moves;
  late final List<String> _players;
  late final DateTime? _createdAt;
  int _currentMoveIndex = -1; // -1 represents initial empty board

  @override
  void initState() {
    super.initState();
    _moves = _parseMoves(widget.game['moves']);
    _players = _parsePlayers(widget.game['players']);
    _createdAt = _parseDate(widget.game['createdAt']);
  }

  List<Map<String, dynamic>> _parseMoves(dynamic movesData) {
    try {
      if (movesData == null) return [];

      List<dynamic> rawList;
      if (movesData is String) {
        rawList = jsonDecode(movesData) as List<dynamic>;
      } else if (movesData is List) {
        rawList = movesData;
      } else {
        return [];
      }

      return rawList
          .map((move) => Map<String, dynamic>.from(move as Map))
          .toList();
    } catch (e) {
      debugPrint('AdminGameReplayScreen: error parsing moves -> $e');
      return [];
    }
  }

  List<String> _parsePlayers(dynamic playersData) {
    if (playersData is List) {
      return playersData.map((p) => p.toString()).toList();
    }
    return [];
  }

  DateTime? _parseDate(dynamic date) {
    if (date == null) return null;
    try {
      return DateTime.parse(date.toString());
    } catch (_) {
      return null;
    }
  }

  List<String?> _buildBoardState() {
    final squares = List<String?>.filled(9, null);
    if (_currentMoveIndex < 0) return squares;

    final endIndex = _currentMoveIndex.clamp(0, _moves.length - 1);
    for (var i = 0; i <= endIndex; i++) {
      final move = _moves[i];
      final position = move['position'];
      final sign = move['sign'] ?? move['player'];

      if (position is int && position >= 0 && position < 9) {
        squares[position] = sign?.toString();
      }
    }

    return squares;
  }

  void _goToMove(int index) {
    if (index < -1 || index >= _moves.length) return;
    setState(() => _currentMoveIndex = index);
  }

  void _nextMove() {
    if (_currentMoveIndex < _moves.length - 1) {
      setState(() => _currentMoveIndex++);
    }
  }

  void _previousMove() {
    if (_currentMoveIndex >= 0) {
      setState(() => _currentMoveIndex--);
    }
  }

  @override
  Widget build(BuildContext context) {
    final squares = _buildBoardState();
    final theme = Theme.of(context);
    final winner = widget.game['winner']?.toString();
    final moveNumberLabel = _currentMoveIndex >= 0
        ? 'Move ${_currentMoveIndex + 1} of ${_moves.length}'
        : 'Start Position';

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.game['name']?.toString() ?? 'Game Replay'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 24,
              runSpacing: 12,
              children: [
                if (_players.isNotEmpty)
                  Text('Player X: ${_players.first}', style: theme.textTheme.bodyLarge),
                if (_players.length > 1)
                  Text('Player O: ${_players[1]}', style: theme.textTheme.bodyLarge),
                if (_createdAt != null)
                  Text('Played on: ${_createdAt!.day}/${_createdAt!.month}/${_createdAt!.year}',
                      style: theme.textTheme.bodyLarge),
                Text('Total moves: ${_moves.length}', style: theme.textTheme.bodyLarge),
                if (winner != null && winner.isNotEmpty)
                  Text('Winner: $winner',
                      style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 24),
            AspectRatio(
              aspectRatio: 1,
              child: GridView.builder(
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 1,
                ),
                itemCount: 9,
                itemBuilder: (context, index) {
                  return Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: theme.dividerColor),
                      color: theme.cardColor,
                    ),
                    child: Center(
                      child: Text(
                        squares[index] ?? '',
                        style: theme.textTheme.displaySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: squares[index] == 'X'
                              ? theme.colorScheme.primary
                              : theme.colorScheme.secondary,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  onPressed: _previousMove,
                  icon: const Icon(Icons.skip_previous),
                  tooltip: 'Previous move',
                ),
                Text(moveNumberLabel, style: theme.textTheme.titleMedium),
                IconButton(
                  onPressed: _nextMove,
                  icon: const Icon(Icons.skip_next),
                  tooltip: 'Next move',
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Card(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ListTile(
                      title: const Text('Move History'),
                      trailing: TextButton(
                        onPressed: () => _goToMove(-1),
                        child: const Text('Reset'),
                      ),
                    ),
                    const Divider(height: 1),
                    Expanded(
                      child: _moves.isEmpty
                          ? const Center(child: Text('No moves recorded for this game.'))
                          : ListView.builder(
                              itemCount: _moves.length,
                              itemBuilder: (context, index) {
                                final move = _moves[index];
                                final sign = move['sign'] ?? move['player'] ?? '?';
                                final position = move['position'];
                                final isActive = index == _currentMoveIndex;

                                return ListTile(
                                  leading: CircleAvatar(
                                    child: Text(sign.toString()),
                                  ),
                                  title: Text('Move ${index + 1}'),
                                  subtitle: Text('Position: $position'),
                                  trailing: Text(
                                    sign.toString(),
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  selected: isActive,
                                  onTap: () => _goToMove(index),
                                );
                              },
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
