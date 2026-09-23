import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/repositories/auth_repository.dart';
import '../../domain/models/user.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthProvider with ChangeNotifier {
  final AuthRepository _authRepository = AuthRepository();
  
  User? _currentUser;
  bool _isLoading = false;
  String? _token;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _token != null;
  String? get token => _token;

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    notifyListeners();

    final result = await _authRepository.login(username, password);

    _isLoading = false;

    if (result['success']) {
      _currentUser = result['user'];
      _token = result['token'];
      
      // Guardar token en SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', _token!);
      
      notifyListeners();
      return true;
    } else {
      notifyListeners();
      throw Exception(result['message']);
    }
  }

  Future<void> reloadUser() async {
    if (_currentUser == null || _token == null) return;
    try {
      final dio = Dio(BaseOptions(
        baseUrl: dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1',
        headers: {'Authorization': 'Bearer $_token'},
      ));
      final response = await dio.get('/usuarios/${_currentUser!.id}');
      final data = response.data['data'] ?? response.data;
      
      // Extraer foto de la respuesta
      final persona = data['persona'] ?? {};
      final tutor = persona['tutor'] ?? {};
      final fotoPath = tutor['fotografia'];

      _currentUser = User(
        id: _currentUser!.id,
        username: data['username'] ?? _currentUser!.username,
        nombre: '${persona['nombres'] ?? ''} ${persona['apellidos'] ?? ''}'.trim(),
        rol: data['rol'] ?? _currentUser!.rol,
        fotoUrl: fotoPath,
      );
      notifyListeners();
    } catch (e) {
      // Ignorar error si no se pudo recargar, mantiene el anterior
    }
  }

  Future<void> logout() async {
    _currentUser = null;
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    notifyListeners();
  }
}
