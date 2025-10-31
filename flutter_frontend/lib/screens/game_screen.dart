import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/game_provider.dart';
import '../services/signalr_service.dart';
import '../services/api_service.dart';
import '../models/game_models.dart';
import '../widgets/game_board.dart';
import '../widgets/notifications_panel.dart';
import 'admin_screen.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  bool _isConnectingSignalR = false;

  @override
  void initState() {
    super.initState();
    _initializeSignalR();
    _loadInvites();
  }

  Future<void> _initializeSignalR() async {
    if (_isConnectingSignalR) return;
    _isConnectingSignalR = true;

    final gameProvider = context.read<GameProvider>();
    
    await SignalRService.connect(
      onInviteReceived: (data) {
        print('Invite received: $data');
        if (data is List && data.isNotEmpty) {
          final inviteData = data[0];
          final invite = Invite.fromJson(inviteData);
          gameProvider.addInvite(invite);
        }
      },
      onPresenceChanged: (data) {
        print('Presence changed: $data');
        if (data is List && data.isNotEmpty) {
          final presenceData = data[0];
          final userId = presenceData['userId']?.toString();
          final online = presenceData['online'] ?? false;
          
          if (userId != null) {
            if (online) {
              gameProvider.addOnlineUser(userId);
            } else {
              gameProvider.removeOnlineUser(userId);
            }
          }
        }
      },
      onOnlineUsers: (data) {
        print('Online users received: $data');
        if (data is List && data.isNotEmpty) {
          final userData = data[0];
          final userDetails = (userData['userDetails'] as List?)
              ?.map((u) => UserDetail.fromJson(u))
              .toList() ?? [];
          gameProvider.setOnlineUserDetails(userDetails);
        }
      },
      onGameStarted: (data) {
        print('Game started: $data');
        if (data is List && data.isNotEmpty) {
          final gameData = data[0];
          final gameId = gameData['gameId'];
          final players = (gameData['players'] as List?)?.map((p) => p.toString()).toList();
          
          if (gameId != null && players != null) {
            gameProvider.setGameStarted(gameId, players);
            _loadGameFromServer(gameId);
          }
        }
      },
      onMoveApplied: (data) {
        print('Move applied: $data');
        if (data is List && data.isNotEmpty) {
          final moveData = data[0];
          final gameId = moveData['gameId'];
          final move = moveData['move'];
          
          if (gameId == gameProvider.currentGameId && move != null) {
            final position = move['position'];
            final sign = move['sign'] ?? move['player'];
            
            if (position != null && sign != null) {
              gameProvider.applyRemoteMove(position, sign);
            }
          }
        }
      },
    );
  }

  Future<void> _loadInvites() async {
    try {
      final invites = await ApiService.getInvites();
      final inviteList = invites.map((inv) => Invite.fromJson(inv)).toList();
      if (mounted) {
        context.read<GameProvider>().setInvites(inviteList);
      }
    } catch (e) {
      print('Error loading invites: $e');
    }
  }

  Future<void> _loadGameFromServer(int gameId) async {
    try {
      final gameData = await ApiService.getGame(gameId);
      if (mounted) {
        context.read<GameProvider>().loadGame(gameData);
        context.read<GameProvider>().setCurrentGameId(gameId);
        await SignalRService.joinGame(gameId);
      }
    } catch (e) {
      print('Error loading game: $e');
    }
  }

  void _handleSquareClick(int index) {
    final gameProvider = context.read<GameProvider>();
    
    if (gameProvider.squares[index] != null || gameProvider.isGameOver) {
      return;
    }

    // If in multiplayer mode, send move via SignalR
    if (gameProvider.currentGameId != null && SignalRService.isConnected) {
      SignalRService.sendMove(
        gameProvider.currentGameId!,
        {
          'position': index,
          'sign': gameProvider.currentPlayer,
        },
      );
    } else {
      // Local game
      gameProvider.makeMove(index);
    }
  }

  void _showInviteDialog() {
    final emailController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Invite Player'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: 'Player Email',
                hintText: 'player@example.com',
              ),
              keyboardType: TextInputType.emailAddress,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final email = emailController.text.trim();
              if (email.isEmpty) return;
              
              try {
                await ApiService.createInvite(email);
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Invite sent!')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}')),
                  );
                }
              }
            },
            child: const Text('Send'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade900,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.black.withOpacity(0.3),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Tic Tac Toe',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Classic 3×3 Grid Game',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade400,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Consumer<GameProvider>(
                          builder: (context, game, _) {
                            final status = game.status;
                            String statusText;
                            if (status.type == 'winner') {
                              statusText = 'Winner: ${status.player}';
                            } else if (status.type == 'draw') {
                              statusText = 'Draw';
                            } else {
                              statusText = 'Next: ${status.player}';
                            }
                            return Text(
                              statusText,
                              style: const TextStyle(
                                fontSize: 16,
                                color: Colors.amber,
                                fontWeight: FontWeight.w500,
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  // Notifications
                  Consumer<GameProvider>(
                    builder: (context, game, _) => NotificationsPanel(
                      invites: game.invites,
                      onlineUserDetails: game.onlineUserDetails,
                      onAccept: (invite) async {
                        try {
                          final response = await ApiService.respondToInvite(invite.id, 'accept');
                          game.removeInvite(invite.id);
                          
                          final gameId = response['gameId'];
                          if (gameId != null) {
                            await _loadGameFromServer(gameId);
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error: $e')),
                            );
                          }
                        }
                      },
                      onDecline: (invite) async {
                        try {
                          await ApiService.respondToInvite(invite.id, 'decline');
                          game.removeInvite(invite.id);
                        } catch (e) {
                          print('Error declining invite: $e');
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  // User menu
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) => PopupMenuButton<int>(
                      icon: CircleAvatar(
                        backgroundColor: Colors.blue,
                        child: Text(
                          auth.userEmail?.substring(0, 1).toUpperCase() ?? 'U',
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                      itemBuilder: (context) => <PopupMenuEntry<int>>[
                        PopupMenuItem<int>(
                          value: -1,
                          child: Text(auth.userEmail ?? 'User'),
                          enabled: false,
                        ),
                        const PopupMenuDivider(),
                        if (auth.isAdmin)
                          PopupMenuItem<int>(
                            value: 1,
                            child: const Text('Admin Panel'),
                            onTap: () {
                              Future.delayed(Duration.zero, () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const AdminScreen(),
                                  ),
                                );
                              });
                            },
                          ),
                        PopupMenuItem<int>(
                          value: 2,
                          child: const Text('Logout'),
                          onTap: () => auth.logout(),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Game content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 600),
                    child: Column(
                      children: [
                        // Game board
                        Consumer<GameProvider>(
                          builder: (context, game, _) => GameBoard(
                            squares: game.squares,
                            winningLine: game.winningLine,
                            onSquareClick: _handleSquareClick,
                            isLocked: game.isGameOver,
                          ),
                        ),
                        const SizedBox(height: 24),
                        // Action buttons
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          alignment: WrapAlignment.center,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () {
                                context.read<GameProvider>().startNewLocalGame();
                              },
                              icon: const Icon(Icons.refresh),
                              label: const Text('New Local Game'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 12,
                                ),
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: _showInviteDialog,
                              icon: const Icon(Icons.person_add),
                              label: const Text('Invite Player'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        // Move history
                        Consumer<GameProvider>(
                          builder: (context, game, _) {
                            if (game.moveHistory.isEmpty) {
                              return const SizedBox.shrink();
                            }
                            
                            return Container(
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
                                  ...game.moveHistory.map((move) => Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Text(
                                      'Move ${move.moveNumber}: ${move.player} → Position ${move.position}',
                                      style: TextStyle(
                                        color: Colors.grey.shade300,
                                        fontSize: 14,
                                      ),
                                    ),
                                  )),
                                ],
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
