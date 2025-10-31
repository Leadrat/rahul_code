import 'package:flutter/material.dart';
import '../models/game_models.dart';

class OnlineUsersPanel extends StatelessWidget {
  final List<UserDetail> onlineUsers;
  final Function(String email) onInvite;
  final VoidCallback? onRefresh;

  const OnlineUsersPanel({
    super.key,
    required this.onlineUsers,
    required this.onInvite,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (onlineUsers.isEmpty) {
      return IconButton(
        icon: Stack(
          children: [
            const Icon(Icons.people_outline, color: Colors.white),
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  color: Colors.grey,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(
                  minWidth: 12,
                  minHeight: 12,
                ),
                child: const Text(
                  '0',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No users online')),
          );
        },
      );
    }

    return PopupMenuButton<int>(
      icon: Stack(
        children: [
          const Icon(Icons.people, color: Colors.white),
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(
                color: Colors.green,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(
                minWidth: 16,
                minHeight: 16,
              ),
              child: Text(
                '${onlineUsers.length}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
      itemBuilder: (context) => <PopupMenuEntry<int>>[
        PopupMenuItem<int>(
          value: -1,
          enabled: false,
          child: Row(
            children: [
              Text(
                'Online Users (${onlineUsers.length})',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              if (onRefresh != null)
                IconButton(
                  icon: const Icon(Icons.refresh, size: 18),
                  onPressed: () {
                    Navigator.pop(context);
                    onRefresh!();
                  },
                  tooltip: 'Refresh',
                ),
            ],
          ),
        ),
        const PopupMenuDivider(),
        ...onlineUsers.asMap().entries.map((entry) {
          final user = entry.value;
          return PopupMenuItem<int>(
            value: entry.key,
            enabled: false,
            child: Container(
              width: 250,
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      user.email,
                      style: const TextStyle(fontSize: 14),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.person_add, size: 20),
                    color: Colors.blue,
                    onPressed: () {
                      Navigator.pop(context);
                      onInvite(user.email);
                    },
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
