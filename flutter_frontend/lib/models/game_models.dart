class Move {
  final String player;
  final int position;
  final DateTime timestamp;
  final int moveNumber;
  final String? commentary;
  
  Move({
    required this.player,
    required this.position,
    required this.timestamp,
    required this.moveNumber,
    this.commentary,
  });
}

class GameStatus {
  final String type; // 'winner', 'draw', 'next'
  final String? player;
  final List<int>? line;
  
  GameStatus({
    required this.type,
    this.player,
    this.line,
  });
}

class Invite {
  final int id;
  final int fromUserId;
  final String fromUserEmail;
  final String toEmail;
  final int? toUserId;
  final int? gameId;
  final String status;
  final String? message;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final bool? senderOnline;
  
  Invite({
    required this.id,
    required this.fromUserId,
    required this.fromUserEmail,
    required this.toEmail,
    this.toUserId,
    this.gameId,
    required this.status,
    this.message,
    this.expiresAt,
    required this.createdAt,
    this.senderOnline,
  });
  
  factory Invite.fromJson(Map<String, dynamic> json) {
    return Invite(
      id: json['id'],
      fromUserId: json['from_user_id'] ?? json['fromUserId'],
      fromUserEmail: json['from_user_email'] ?? json['fromUserEmail'] ?? '',
      toEmail: json['to_email'] ?? json['toEmail'] ?? '',
      toUserId: json['toUserId'],
      gameId: json['gameId'],
      status: json['status'] ?? 'pending',
      message: json['message'],
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
      createdAt: DateTime.parse(json['createdAt']),
      senderOnline: json['senderOnline'],
    );
  }
}

class UserDetail {
  final String id;
  final String email;
  
  UserDetail({required this.id, required this.email});
  
  factory UserDetail.fromJson(Map<String, dynamic> json) {
    return UserDetail(
      id: json['id'].toString(),
      email: json['email'],
    );
  }
}
