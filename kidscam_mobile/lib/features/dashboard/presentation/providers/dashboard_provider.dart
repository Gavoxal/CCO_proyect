import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DashboardProvider with ChangeNotifier {
  Map<String, dynamic>? _stats;
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchStats(String token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1';
      final dio = Dio(BaseOptions(
        baseUrl: apiUrl,
        headers: {'Authorization': 'Bearer $token'},
      ));

      final response = await dio.get('/dashboard/stats');
      _stats = response.data['data'] ?? response.data;
    } catch (e) {
      _error = 'Error al cargar estadísticas';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
