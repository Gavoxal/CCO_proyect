import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/models/infante.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/infantes_provider.dart';
import 'infante_form_screen.dart';

class InfanteDetailScreen extends StatefulWidget {
  final Infante infante;

  const InfanteDetailScreen({super.key, required this.infante});

  @override
  State<InfanteDetailScreen> createState() => _InfanteDetailScreenState();
}

class _InfanteDetailScreenState extends State<InfanteDetailScreen> {
  late Infante _infante;
  bool _isUploadingPhoto = false;

  @override
  void initState() {
    super.initState();
    _infante = widget.infante;
  }

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

  void _openGoogleMaps(String address) {
    final query = Uri.encodeComponent(address);
    _launchURL(
      'geo:0,0?q=$query', 
      fallbackUrl: 'https://www.google.com/maps/search/?api=1&query=$query'
    );
  }

  Future<void> _pickAndUploadImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.camera);
    
    if (image != null) {
      setState(() => _isUploadingPhoto = true);
      try {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('token');
        final apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1';
        
        final dio = Dio();
        if (token != null) {
          dio.options.headers['Authorization'] = 'Bearer $token';
        }

        String fileName = image.path.split('/').last;
        FormData formData = FormData.fromMap({
          "foto": await MultipartFile.fromFile(image.path, filename: fileName),
        });

        final response = await dio.post('$apiUrl/infantes/${_infante.id}/foto', data: formData);
        
        if (response.statusCode == 200) {
          final responseData = response.data['data'] ?? response.data;
          final newFotoUrl = responseData['fotografia'];
          
          if (mounted) {
            setState(() {
              _infante = _infante.copyWith(fotoUrl: newFotoUrl);
            });
            context.read<InfantesProvider>().fetchInfantes(); // Refresh list in background
            
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Foto actualizada correctamente'), backgroundColor: AppColors.primary),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Error al actualizar foto'), backgroundColor: Colors.red),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isUploadingPhoto = false);
        }
      }
    }
  }

  void _launchURL(String url, {String? fallbackUrl}) async {
    try {
      final uri = Uri.parse(url);
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched && fallbackUrl != null) {
        await launchUrl(Uri.parse(fallbackUrl), mode: LaunchMode.externalApplication);
      } else if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No se pudo abrir el enlace')));
      }
    } catch (e) {
      if (fallbackUrl != null) {
        try {
          await launchUrl(Uri.parse(fallbackUrl), mode: LaunchMode.externalApplication);
        } catch (_) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No se pudo abrir el enlace')));
        }
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No se pudo abrir el enlace')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final token = context.read<AuthProvider>().token;
    final imageUrl = _getFullImageUrl(_infante.fotoUrl, token);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: AppColors.background.withOpacity(0.9),
            floating: true,
            pinned: true,
            elevation: 0,
            leading: IconButton(
              icon: Icon(Icons.arrow_back, color: isDark ? Colors.white : AppColors.textPrimary),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.edit, color: AppColors.primary),
                onPressed: () {
                  // Navigate to Edit Screen
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => InfanteFormScreen(infante: _infante)),
                  );
                },
              ),
              const SizedBox(width: 8),
            ],
          ),
          
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 16),
                // Cabecera: Foto + Nombre
                Center(
                  child: Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary.withOpacity(0.1),
                          border: Border.all(color: AppColors.primary.withOpacity(0.3), width: 4),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(70),
                          child: imageUrl.isNotEmpty
                              ? Image.network(imageUrl, fit: BoxFit.cover, errorBuilder: (_,__,___) => Icon(Icons.person, size: 80, color: AppColors.primary))
                              : Icon(Icons.person, size: 80, color: AppColors.primary),
                        ),
                      ),
                      if (_isUploadingPhoto)
                        Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.black45),
                          child: const Center(child: CircularProgressIndicator(color: Colors.white)),
                        )
                      else
                        GestureDetector(
                          onTap: _pickAndUploadImage,
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.background, width: 3),
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  '${_infante.nombres} ${_infante.apellidos}',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'Código: ${_infante.codigo}',
                        style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (_infante.esPatrocinado)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Patrocinado',
                          style: TextStyle(fontWeight: FontWeight.w700, color: Colors.orange),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
          
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _buildSectionCard(
                  isDark,
                  title: 'Información Personal',
                  icon: Icons.person,
                  children: [
                    _buildInfoRow(isDark, Icons.cake, 'Edad', '${_infante.edad} años (${_infante.fechaNacimiento ?? "No registra"})'),
                    _buildInfoRow(isDark, Icons.badge, 'Cédula', _infante.cedula ?? 'No registra'),
                    _buildInfoRow(
                      isDark, 
                      Icons.home, 
                      'Dirección', 
                      _infante.direccion ?? 'No registra',
                      actionIcon: Icons.map,
                      onAction: _infante.direccion != null && _infante.direccion!.isNotEmpty ? () => _openGoogleMaps(_infante.direccion!) : null,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildSectionCard(
                  isDark,
                  title: 'Información Médica y Programa',
                  icon: Icons.medical_services,
                  children: [
                    _buildInfoRow(isDark, Icons.group, 'Programa', _infante.grupo ?? 'No asignado'),
                    if (_infante.esPatrocinado)
                      _buildInfoRow(isDark, Icons.volunteer_activism, 'Fuente Patrocinio', _infante.fuentePatrocinio ?? 'No registra'),
                    _buildInfoRow(
                      isDark, 
                      Icons.warning_amber_rounded, 
                      'Alergias', 
                      _infante.alergias ?? 'Ninguna',
                      isAlert: _infante.alergias != null && _infante.alergias!.isNotEmpty && _infante.alergias!.toLowerCase() != 'ninguna',
                    ),
                    _buildInfoRow(
                      isDark, 
                      Icons.coronavirus, 
                      'Enfermedades', 
                      _infante.enfermedades ?? 'Ninguna',
                      isAlert: _infante.enfermedades != null && _infante.enfermedades!.isNotEmpty && _infante.enfermedades!.toLowerCase() != 'ninguna',
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildSectionCard(
                  isDark,
                  title: 'Representante Legal',
                  icon: Icons.family_restroom,
                  children: [
                    _buildInfoRow(isDark, Icons.person_outline, 'Nombre', '${_infante.tutorNombres ?? ""} ${_infante.tutorApellidos ?? ""}'.trim()),
                    _buildInfoRow(
                      isDark, 
                      Icons.phone, 
                      'Teléfono', 
                      _infante.tutorTelefono ?? 'No registra',
                      actionIcon: Icons.call,
                      onAction: _infante.tutorTelefono != null ? () => _launchURL('tel:${_infante.tutorTelefono}') : null,
                    ),
                    _buildInfoRow(
                      isDark, 
                      Icons.chat, 
                      'WhatsApp', 
                      _infante.tutorTelefono ?? 'No registra',
                      actionIcon: Icons.open_in_new,
                      onAction: _infante.tutorTelefono != null ? () => _launchURL('https://wa.me/593${_infante.tutorTelefono?.replaceFirst(RegExp(r'^0'), '')}') : null,
                    ),
                  ],
                ),
                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionCard(bool isDark, {required String title, required IconData icon, required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surface : Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(bool isDark, IconData icon, String label, String value, {bool isAlert = false, IconData? actionIcon, VoidCallback? onAction}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: isAlert ? Colors.red : (isDark ? Colors.white54 : AppColors.textSecondary)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isAlert ? Colors.red : (isDark ? Colors.white54 : AppColors.textSecondary),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value.isEmpty ? 'No registra' : value,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: isAlert ? FontWeight.w700 : FontWeight.w500,
                    color: isAlert ? Colors.red : (isDark ? Colors.white : AppColors.textPrimary),
                  ),
                ),
              ],
            ),
          ),
          if (actionIcon != null && onAction != null)
            IconButton(
              icon: Icon(actionIcon, color: AppColors.primary),
              onPressed: onAction,
            ),
        ],
      ),
    );
  }
}
