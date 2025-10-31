import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/game_provider.dart';
import '../providers/theme_provider.dart';
import '../services/signalr_service.dart';
import '../services/api_service.dart';
import '../models/game_models.dart';
import '../widgets/game_board.dart';
import '../widgets/notifications_panel.dart';
import '../widgets/online_users_panel.dart';
import 'admin_screen.dart';
import 'saved_games_screen.dart';

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
    _requestOnlineUsers();
  }

  Future<void> _requestOnlineUsers() async {
    print('👥 [REQUEST] Waiting for SignalR connection...');
    
    // Wait up to 10 seconds for connection
    for (int i = 0; i < 20; i++) {
      await Future.delayed(const Duration(milliseconds: 500));
      
      if (SignalRService.isConnected) {
        print('✅ [REQUEST] SignalR connected after ${(i + 1) * 500}ms');
        break;
      }
      
      if (i % 4 == 0) {
        print('⏳ [REQUEST] Still waiting for connection... (${(i + 1) * 500}ms)');
      }
    }
    
    print('👥 [REQUEST] Final check - SignalR connected: ${SignalRService.isConnected}');
    
    if (SignalRService.isConnected) {
      print('👥 [REQUEST] Requesting online users from server...');
      await SignalRService.getOnlineUsers();
      print('✅ [REQUEST] Request sent!');
    } else {
      print('❌ [REQUEST] SignalR still not connected after 10 seconds');
      print('❌ [REQUEST] This usually means:');
      print('   - Backend is not running');
      print('   - Network connection issue');
      print('   - Authentication/CORS problem');
      print('   - Ngrok URL expired');
    }
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
        print('👥 [ONLINE_USERS] Event received!');
        print('👥 [ONLINE_USERS] Raw data: $data');
        print('👥 [ONLINE_USERS] Data type: ${data.runtimeType}');
        
        try {
          // Backend sends: { users: [...], userDetails: [...] }
          // SignalR wraps it in array: [{ users: [...], userDetails: [...] }]
          
          dynamic userData = data;
          
          // Check if data is wrapped in an array
          if (data is List && data.isNotEmpty) {
            print('👥 [ONLINE_USERS] Data is List with ${data.length} items');
            userData = data[0];
            print('👥 [ONLINE_USERS] Extracted first item: $userData');
          }
          
          // Now userData should be the object with userDetails
          if (userData is Map) {
            print('👥 [ONLINE_USERS] Data is Map with keys: ${userData.keys}');
            
            final userDetailsList = userData['userDetails'];
            print('👥 [ONLINE_USERS] userDetails value: $userDetailsList');
            print('👥 [ONLINE_USERS] userDetails type: ${userDetailsList.runtimeType}');
            
            if (userDetailsList is List) {
              final userDetails = userDetailsList.map((u) {
                print('👥 [ONLINE_USERS] Processing user: $u');
                return UserDetail.fromJson(u as Map<String, dynamic>);
              }).toList();
              
              print('✅ [ONLINE_USERS] Parsed ${userDetails.length} users');
              for (var user in userDetails) {
                print('✅ [ONLINE_USERS] - ${user.email} (ID: ${user.id})');
              }
              
              gameProvider.setOnlineUserDetails(userDetails);
              print('✅ [ONLINE_USERS] Updated provider');
            } else {
              print('❌ [ONLINE_USERS] userDetails is not a List: $userDetailsList');
            }
          } else {
            print('❌ [ONLINE_USERS] userData is not a Map: $userData');
          }
        } catch (e, stackTrace) {
          print('❌ [ONLINE_USERS] Error processing data: $e');
          print('❌ [ONLINE_USERS] Stack trace: $stackTrace');
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
        print('🎯 [MOVE_EVENT] Raw move applied event received: $data');
        print('🎯 [MOVE_EVENT] Data type: ${data.runtimeType}');
        
        if (data is List && data.isNotEmpty) {
          print('🎯 [MOVE_EVENT] Processing list with ${data.length} items');
          final moveData = data[0];
          print('🎯 [MOVE_EVENT] Move data: $moveData');
          
          final gameId = moveData['gameId'];
          final move = moveData['move'];
          
          print('🎯 [MOVE_EVENT] Game ID from event: $gameId');
          print('🎯 [MOVE_EVENT] Current game ID: ${gameProvider.currentGameId}');
          print('🎯 [MOVE_EVENT] Move data: $move');
          
          if (gameId == gameProvider.currentGameId && move != null) {
            final position = move['position'];
            final sign = move['sign'] ?? move['player'];
            
            print('🎯 [MOVE_EVENT] Extracted position: $position, sign: $sign');
            
            if (position != null && sign != null) {
              print('🎯 [MOVE_EVENT] Calling applyRemoteMove($position, $sign)');
              gameProvider.applyRemoteMove(position, sign);
              print('✅ [MOVE_EVENT] Move applied successfully');
            } else {
              print('❌ [MOVE_EVENT] Position or sign is null');
            }
          } else {
            print('❌ [MOVE_EVENT] Game ID mismatch or move is null');
            if (gameId != gameProvider.currentGameId) {
              print('   - Event gameId: $gameId does not match current: ${gameProvider.currentGameId}');
            }
          }
        } else {
          print('❌ [MOVE_EVENT] Data is not a list or is empty');
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

  void _showInviteDialog([String? prefillEmail]) {
    final emailController = TextEditingController(text: prefillEmail);
    
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

  void _showSaveGameDialog() {
    final nameController = TextEditingController();
    final gameProvider = context.read<GameProvider>();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Save Game'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Game Name',
                hintText: 'My awesome game',
              ),
              autofocus: true,
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
              final name = nameController.text.trim();
              if (name.isEmpty) return;
              
              try {
                print('💾 [SAVE_GAME] Saving game with name: $name');
                
                // Get current user email from auth provider
                final authProvider = context.read<AuthProvider>();
                final userEmail = authProvider.userEmail ?? 'unknown@example.com';
                
                // Format moves as JSON string (backend expects string, not array)
                final movesArray = gameProvider.moveHistory.map((m) => {
                  'position': m.position,
                  'sign': m.player,
                  'player': m.player,
                }).toList();
                
                final movesJson = jsonEncode(movesArray);
                
                print('💾 [SAVE_GAME] Move count: ${gameProvider.moveHistory.length}');
                print('💾 [SAVE_GAME] Current players: ${gameProvider.currentGamePlayers}');
                print('💾 [SAVE_GAME] Moves JSON: $movesJson');
                
                // Backend expects: name, players (string[]), humanPlayer, moves (string), winner (string)
                final gameData = {
                  'name': name,
                  'players': gameProvider.currentGamePlayers ?? [userEmail],
                  'humanPlayer': userEmail,
                  'moves': movesJson, // Send as JSON string
                  'winner': gameProvider.status.type == 'winner' ? gameProvider.status.player : null,
                };
                
                print('💾 [SAVE_GAME] Sending game data: $gameData');
                await ApiService.createGame(gameData);
                
                if (context.mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Game saved successfully!'),
                      backgroundColor: Colors.green,
                    ),
                  );
                }
              } catch (e) {
                print('❌ [SAVE_GAME] Error: $e');
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}')),
                  );
                }
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                border: Border(
                  bottom: BorderSide(
                    color: Theme.of(context).dividerColor,
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tic Tac Toe',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).textTheme.titleLarge?.color,
                            letterSpacing: 0.5,
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
                            
                            // Check if this is a multiplayer game
                            final isMultiplayer = game.currentGamePlayers != null && 
                                                  game.currentGamePlayers!.length >= 2;
                            
                            if (status.type == 'winner') {
                              if (isMultiplayer) {
                                // Show winner's email in multiplayer
                                final winnerIndex = status.player == 'X' ? 0 : 1;
                                final winnerEmail = game.currentGamePlayers![winnerIndex];
                                statusText = 'Winner: $winnerEmail (${status.player})';
                              } else {
                                statusText = 'Winner: ${status.player}';
                              }
                            } else if (status.type == 'draw') {
                              statusText = 'Draw';
                            } else {
                              if (isMultiplayer) {
                                // Show next player's email in multiplayer
                                final nextIndex = status.player == 'X' ? 0 : 1;
                                final nextEmail = game.currentGamePlayers![nextIndex];
                                statusText = 'Next: $nextEmail (${status.player})';
                              } else {
                                statusText = 'Next: ${status.player}';
                              }
                            }
                            
                            return Text(
                              statusText,
                              style: const TextStyle(
                                fontSize: 16,
                                color: Colors.amber,
                                fontWeight: FontWeight.w500,
                              ),
                              textAlign: TextAlign.center,
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
                          print('📨 [ACCEPT] Accepting invite ${invite.id}');
                          final response = await ApiService.respondToInvite(invite.id, 'accept');
                          print('📨 [ACCEPT] API response: $response');
                          
                          game.removeInvite(invite.id);
                          
                          final gameId = response['gameId'];
                          final inviteDeleted = response['inviteDeleted'];
                          print('📨 [ACCEPT] Game created: $gameId, Invite deleted from DB: $inviteDeleted');
                          
                          if (gameId != null) {
                            print('✅ [ACCEPT] Loading game $gameId from server');
                            await _loadGameFromServer(gameId);
                          }
                        } catch (e) {
                          print('❌ [ACCEPT] Error accepting invite: $e');
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error: $e')),
                            );
                          }
                        }
                      },
                      onDecline: (invite) async {
                        try {
                          print('🚫 [DECLINE] Declining invite ${invite.id}');
                          final response = await ApiService.respondToInvite(invite.id, 'decline');
                          print('🚫 [DECLINE] API response: $response');
                          
                          game.removeInvite(invite.id);
                          print('✅ [DECLINE] Successfully declined and removed invite ${invite.id}');
                        } catch (e) {
                          print('❌ [DECLINE] Error declining invite: $e');
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Online users
                  Consumer<GameProvider>(
                    builder: (context, game, _) => OnlineUsersPanel(
                      onlineUsers: game.onlineUserDetails,
                      onInvite: (email) => _showInviteDialog(email),
                      onRefresh: () async {
                        print('🔄 [REFRESH] Manual refresh triggered');
                        await SignalRService.getOnlineUsers();
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Theme toggle
                  Consumer<ThemeProvider>(
                    builder: (context, themeProvider, _) => IconButton(
                      icon: Icon(
                        themeProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode,
                        color: Theme.of(context).iconTheme.color,
                      ),
                      tooltip: themeProvider.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                      onPressed: () => themeProvider.toggleTheme(),
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
                              icon: const Icon(Icons.refresh, size: 22),
                              label: const Text(
                                'New Local Game',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 16,
                                ),
                                elevation: 4,
                                shadowColor: Colors.blue.withOpacity(0.5),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: () => _showInviteDialog(),
                              icon: const Icon(Icons.person_add, size: 22),
                              label: const Text(
                                'Invite Player',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 16,
                                ),
                                elevation: 4,
                                shadowColor: Colors.green.withOpacity(0.5),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                            Consumer<GameProvider>(
                              builder: (context, game, _) => ElevatedButton.icon(
                                onPressed: game.moveHistory.isNotEmpty ? _showSaveGameDialog : null,
                                icon: const Icon(Icons.save, size: 22),
                                label: const Text(
                                  'Save Game',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.orange,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 16,
                                  ),
                                  elevation: 4,
                                  shadowColor: Colors.orange.withOpacity(0.5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const SavedGamesScreen(),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.history, size: 22),
                              label: const Text(
                                'Saved Games',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.purple,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 16,
                                ),
                                elevation: 4,
                                shadowColor: Colors.purple.withOpacity(0.5),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
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
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Theme.of(context).cardColor,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Theme.of(context).dividerColor,
                                  width: 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.05),
                                    blurRadius: 8,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.history,
                                        color: Theme.of(context).primaryColor,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Move History',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: Theme.of(context).textTheme.titleLarge?.color,
                                        ),
                                      ),
                                    ],
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
