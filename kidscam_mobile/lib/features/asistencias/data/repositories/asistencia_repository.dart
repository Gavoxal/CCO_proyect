import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/asistencia_model.dart';

class AsistenciaRepository {
  late final Dio _dio;

  AsistenciaRepository() {
    _dio = Dio(BaseOptions(
      baseUrl: dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));

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

  Future<List<AsistenciaModel>> getAsistenciaByFecha(String fecha) async {
    try {
      final response = await _dio.get('/asistencia', queryParameters: {'fecha': fecha, 'limit': 1000});
      final data = response.data['data'] ?? response.data;
      if (data is List) {
        return data.map((e) => AsistenciaModel.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Error al cargar asistencia de la fecha');
    }
  }

  Future<void> registrarBulk(String fecha, List<Map<String, dynamic>> registros) async {
    try {
      await _dio.post('/asistencia/bulk', data: {
        'fecha': fecha,
        'registros': registros,
      });
    } catch (e) {
      throw Exception('Error al registrar asistencia');
    }
  }

  Future<void> pagarDeuda(int infanteId, double? monto) async {
    try {
      final data = monto != null ? {'monto': monto} : {};
      await _dio.patch('/asistencia/pagar-deuda/$infanteId', data: data);
    } catch (e) {
      throw Exception('Error al pagar deuda');
    }
  }
}
