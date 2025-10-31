import 'package:flutter/foundation.dart';
import 'package:jwt_decode/jwt_decode.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthProvider with ChangeNotifier {
  String? _token;
  String? _userEmail;
  bool _isAdmin = false;
  
  AuthProvider(String? initialToken) {
    if (initialToken != null) {
      _token = initialToken;
      _extractUserInfo(initialToken);
      _checkAdminStatus();
    }
  }
  
  bool get isAuthenticated => _token != null;
  String? get userEmail => _userEmail;
  bool get isAdmin => _isAdmin;
  
  void _extractUserInfo(String token) {
    try {
      final payload = Jwt.parseJwt(token);
      _userEmail = payload['email'] ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
    } catch (e) {
      print('Error parsing JWT: $e');
    }
  }
  
  Future<void> _checkAdminStatus() async {
    try {
      final user = await ApiService.getCurrentUser();
      _isAdmin = user['isAdmin'] ?? false;
      notifyListeners();
    } catch (e) {
      _isAdmin = false;
    }
  }
  
  Future<void> login(String email, String password) async {
    final response = await ApiService.login(email, password);
    _token = response['token'];
    
    if (_token != null) {
      await StorageService.saveToken(_token!);
      _extractUserInfo(_token!);
      await _checkAdminStatus();
      notifyListeners();
    }
  }
  
  Future<void> register(String email, String password) async {
    await ApiService.register(email, password);
  }
  
  Future<void> logout() async {
    _token = null;
    _userEmail = null;
    _isAdmin = false;
    await StorageService.removeToken();
    notifyListeners();
  }
}
