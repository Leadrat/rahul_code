import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  List<dynamic> _players = [];
  bool _loading = false;
  dynamic _selectedPlayer;
  List<dynamic>? _selectedPlayerGames;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    
    try {
      final players = await ApiService.getAdminPlayers();
      
      setState(() {
        _players = players;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    }
  }

  Future<void> _loadPlayerGames(int playerId) async {
    setState(() => _loading = true);
    
    try {
      final games = await ApiService.getPlayerGames(playerId);
      setState(() {
        _selectedPlayerGames = games;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading player games: $e')),
        );
      }
    }
  }

  Future<void> _deleteGame(int gameId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Game'),
        content: const Text('Are you sure you want to delete this game?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ApiService.deleteGame(gameId);
        if (_selectedPlayer != null) {
          await _loadPlayerGames(_selectedPlayer['id']);
        }
        await _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Game deleted')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting game: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.admin_panel_settings, color: Theme.of(context).primaryColor),
            const SizedBox(width: 8),
            const Text('Admin Panel'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              context.read<AuthProvider>().logout();
              Navigator.pop(context);
            },
          ),
        ],
      ),
      body: _loading && _players.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Players section
                  Card(
                    color: Theme.of(context).cardColor,
                    elevation: 4,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'Players',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).textTheme.titleLarge?.color,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${_players.length} total',
                                style: TextStyle(
                                  color: Colors.grey.shade400,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          if (_players.isEmpty)
                            Text('No players', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color))
                          else
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                headingRowColor: MaterialStateProperty.all(
                                  Colors.grey.shade700,
                                ),
                                columns: [
                                  DataColumn(label: Text('Player', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Status', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold))),
                                  DataColumn(label: Text('Games', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold))),
                                ],
                                rows: _players.map((player) {
                                  return DataRow(
                                    selected: _selectedPlayer?['id'] == player['id'],
                                    onSelectChanged: (_) {
                                      setState(() => _selectedPlayer = player);
                                      _loadPlayerGames(player['id']);
                                    },
                                    cells: [
                                      DataCell(
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              player['email'] ?? 'Unknown',
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: Theme.of(context).textTheme.bodyLarge?.color,
                                              ),
                                            ),
                                            Text(
                                              'Joined ${_formatDate(player['createdAt'])}',
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: Colors.grey.shade400,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      DataCell(
                                        Row(
                                          children: [
                                            Container(
                                              width: 8,
                                              height: 8,
                                              decoration: const BoxDecoration(
                                                color: Colors.grey,
                                                shape: BoxShape.circle,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Text('Offline', style: TextStyle(color: Theme.of(context).textTheme.bodySmall?.color)),
                                          ],
                                        ),
                                      ),
                                      DataCell(
                                        Text(
                                          '${player['gameCount'] ?? 0}',
                                          style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                                        ),
                                      ),
                                    ],
                                  );
                                }).toList(),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  
                  // Selected player's games
                  if (_selectedPlayer != null) ...[
                    const SizedBox(height: 16),
                    Card(
                      color: Theme.of(context).cardColor,
                      elevation: 4,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Games for ${_selectedPlayer['email']}',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Theme.of(context).textTheme.titleLarge?.color,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Text(
                                  '${_selectedPlayerGames?.length ?? 0} saved',
                                  style: TextStyle(
                                    color: Theme.of(context).textTheme.bodySmall?.color,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.close),
                                  onPressed: () {
                                    setState(() {
                                      _selectedPlayer = null;
                                      _selectedPlayerGames = null;
                                    });
                                  },
                                  tooltip: 'Close',
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            if (_loading)
                              const Center(child: CircularProgressIndicator())
                            else if (_selectedPlayerGames == null || _selectedPlayerGames!.isEmpty)
                              Text('No saved games', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color))
                            else
                              SingleChildScrollView(
                                scrollDirection: Axis.horizontal,
                                child: DataTable(
                                  headingRowColor: MaterialStateProperty.all(
                                    Colors.grey.shade700,
                                  ),
                                  columns: [
                                    DataColumn(label: Text('Date', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold))),
                                    DataColumn(label: Text('Name', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold))),
                                    DataColumn(label: Text('Players', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold))),
                                    DataColumn(label: Text('Winner', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold))),
                                    DataColumn(label: Text('Actions', style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color, fontWeight: FontWeight.bold))),
                                  ],
                                  rows: _selectedPlayerGames!.map((game) {
                                    return DataRow(
                                      cells: [
                                        DataCell(
                                          Text(
                                            _formatDate(game['createdAt']),
                                            style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                                          ),
                                        ),
                                        DataCell(
                                          Container(
                                            constraints: const BoxConstraints(maxWidth: 200),
                                            child: Text(
                                              game['name'] ?? '—',
                                              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ),
                                        DataCell(
                                          Container(
                                            constraints: const BoxConstraints(maxWidth: 150),
                                            child: Text(
                                              (game['players'] as List?)?.join(' vs ') ?? '',
                                              style: TextStyle(color: Theme.of(context).textTheme.bodyLarge?.color),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ),
                                        DataCell(
                                          Text(
                                            game['winner']?.toString() ?? '—',
                                            style: TextStyle(
                                              color: game['winner'] != null ? Colors.amber : Colors.white,
                                              fontWeight: game['winner'] != null ? FontWeight.bold : FontWeight.normal,
                                            ),
                                          ),
                                        ),
                                        DataCell(
                                          IconButton(
                                            icon: const Icon(Icons.delete, color: Colors.red),
                                            onPressed: () => _deleteGame(game['id']),
                                          ),
                                        ),
                                      ],
                                    );
                                  }).toList(),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'Unknown';
    try {
      final dt = DateTime.parse(date.toString());
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (e) {
      return 'Unknown';
    }
  }
}
