import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../pages/profile_screen.dart';

class UserProfileAvatar extends StatelessWidget {
  final double radius;

  const UserProfileAvatar({super.key, this.radius = 20});

  String _getFullImageUrl(String? path, String? token) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    
    final apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1';
    final uri = Uri.parse(apiUrl);
    final baseUrl = '${uri.scheme}://${uri.host}${uri.hasPort ? ':${uri.port}' : ''}';
    final fullUrl = '$baseUrl$path';
    
    if (token != null) {
      final separator = fullUrl.contains('?') ? '&' : '?';
      return '$fullUrl${separator}token=$token';
    }
    return fullUrl;
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.currentUser;

    if (user == null) {
      return const SizedBox.shrink();
    }

    ImageProvider? imageProvider;
    if (user.fotoUrl != null && user.fotoUrl!.isNotEmpty) {
      imageProvider = NetworkImage(_getFullImageUrl(user.fotoUrl, authProvider.token));
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const ProfileScreen()),
        );
      },
      child: CircleAvatar(
        radius: radius,
        backgroundColor: AppColors.primary.withOpacity(0.1),
        backgroundImage: imageProvider,
        child: imageProvider == null 
            ? Icon(Icons.person, color: AppColors.primary, size: radius * 1.2)
            : null,
      ),
    );
  }
}
