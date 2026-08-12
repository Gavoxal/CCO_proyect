import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/models/infante.dart';

class InfantesRepository {
  late final Dio _dio;

  InfantesRepository() {
    _dio = Dio(BaseOptions(
      baseUrl: dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));

    // Interceptor para agregar token a peticiones
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }

  Future<List<Infante>> getInfantes({String? buscar}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (buscar != null && buscar.isNotEmpty) {
        queryParams['buscar'] = buscar;
      }
      
      final response = await _dio.get('/infantes', queryParameters: queryParams);
      final data = response.data['data'] ?? response.data;
      if (data is List) {
        return data.map((e) => Infante.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Error al cargar infantes');
    }
  }
}
