import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../domain/models/user.dart';

class AuthRepository {
  final Dio _dio;

  AuthRepository() : _dio = Dio(BaseOptions(
    baseUrl: dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1',
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
  ));

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      // Se asume que el backend envuelve la respuesta en "data" si usa ok()
      // dependendiendo del utils/response.js. Si no, response.data directo.
      final resData = response.data['data'] ?? response.data;
      
      final token = resData['token'];
      final user = User.fromJson(resData['usuario']);
      
      return {'success': true, 'token': token, 'user': user};
    } on DioException catch (e) {
      String message = 'Error de conexión';
      if (e.response != null) {
        // Asumiendo que badRequest retorna { error: ... } o { message: ... }
        message = e.response?.data['error'] ?? e.response?.data['message'] ?? 'Credenciales inválidas';
      }
      return {'success': false, 'message': message};
    } catch (e) {
      return {'success': false, 'message': 'Ocurrió un error inesperado'};
    }
  }
}
