import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

class ApiService {
  static const String baseUrl = 'https://bc63c715d5f7.ngrok-free.app/api';
  
  static Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    final headers = {'Content-Type': 'application/json'};
    
    if (includeAuth) {
      final token = await StorageService.getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    
    return headers;
  }
  
  // Auth APIs
  static Future<Map<String, dynamic>> login(String email, String password) async {
    print('🔐 [API] Attempting login to: $baseUrl/auth/login');
    print('🔐 [API] Email: $email');
    
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: await _getHeaders(includeAuth: false),
        body: jsonEncode({'email': email, 'password': password}),
      );
      
      print('🔐 [API] Login response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        print('✅ [API] Login successful');
        return jsonDecode(response.body);
      } else {
        print('❌ [API] Login failed: ${response.body}');
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Login failed');
      }
    } catch (e) {
      print('❌ [API] Login error: $e');
      rethrow;
    }
  }
  
  static Future<Map<String, dynamic>> register(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: await _getHeaders(includeAuth: false),
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Registration failed');
    }
  }
  
  static Future<Map<String, dynamic>> getCurrentUser() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to get user info');
    }
  }
  
  // Game APIs
  static Future<List<dynamic>> getUserGames() async {
    final response = await http.get(
      Uri.parse('$baseUrl/games'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }
  
  static Future<Map<String, dynamic>> getGame(int gameId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/games/$gameId'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to get game');
    }
  }
  
  static Future<Map<String, dynamic>> createGame(Map<String, dynamic> gameData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/games'),
      headers: await _getHeaders(),
      body: jsonEncode(gameData),
    );
    
    if (response.statusCode == 201 || response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create game');
    }
  }
  
  // Invite APIs
  static Future<List<dynamic>> getInvites() async {
    final response = await http.get(
      Uri.parse('$baseUrl/invites'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }
  
  static Future<Map<String, dynamic>> createInvite(String toEmail, {String? message}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/invites'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'toEmail': toEmail,
        'message': message ?? 'Let\'s play Tic Tac Toe!',
      }),
    );
    
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to create invite');
    }
  }
  
  static Future<Map<String, dynamic>> respondToInvite(int inviteId, String response) async {
    final httpResponse = await http.post(
      Uri.parse('$baseUrl/invites/$inviteId/respond'),
      headers: await _getHeaders(),
      body: jsonEncode({'response': response}),
    );
    
    if (httpResponse.statusCode == 200) {
      return jsonDecode(httpResponse.body);
    } else {
      final error = jsonDecode(httpResponse.body);
      throw Exception(error['message'] ?? 'Failed to respond to invite');
    }
  }
  
  // Admin APIs
  static Future<List<dynamic>> getAdminPlayers() async {
    final response = await http.get(
      Uri.parse('$baseUrl/admin/players'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }
  
  static Future<List<dynamic>> getAdminGames() async {
    final response = await http.get(
      Uri.parse('$baseUrl/admin/games'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }
  
  static Future<List<dynamic>> getPlayerGames(int playerId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/admin/players/$playerId/games'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }
  
  static Future<void> deleteGame(int gameId) async {
    await http.delete(
      Uri.parse('$baseUrl/admin/games/$gameId'),
      headers: await _getHeaders(),
    );
  }
}
