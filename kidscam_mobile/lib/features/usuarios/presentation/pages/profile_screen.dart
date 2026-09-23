import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/pages/login_page.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  
  Map<String, dynamic>? _profileData;
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isEditing = false;
  String? _error;

  final _nombresCtrl = TextEditingController();
  final _apellidosCtrl = TextEditingController();
  final _cedulaCtrl = TextEditingController();
  final _telefonoCtrl = TextEditingController();
  final _direccionCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _profesionCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  
  XFile? _newImage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchProfile();
    });
  }
  
  @override
  void dispose() {
    _nombresCtrl.dispose();
    _apellidosCtrl.dispose();
    _cedulaCtrl.dispose();
    _telefonoCtrl.dispose();
    _direccionCtrl.dispose();
    _emailCtrl.dispose();
    _profesionCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    final auth = context.read<AuthProvider>();
    final user = auth.currentUser;
    if (user == null || auth.token == null) {
      setState(() {
        _error = 'Usuario no autenticado';
        _isLoading = false;
      });
      return;
    }

    try {
      final apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1';
      final dio = Dio(BaseOptions(
        baseUrl: apiUrl,
        headers: {'Authorization': 'Bearer ${auth.token}'},
      ));

      final response = await dio.get('/usuarios/${user.id}');
      final data = response.data['data'] ?? response.data;
      
      if (mounted) {
        setState(() {
          _profileData = data;
          _isLoading = false;
          _populateForm();
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Error al cargar el perfil';
          _isLoading = false;
        });
      }
    }
  }

  void _populateForm() {
    if (_profileData == null) return;
    final persona = _profileData!['persona'] ?? {};
    final tutor = persona['tutor'] ?? {};
    
    _nombresCtrl.text = persona['nombres'] ?? '';
    _apellidosCtrl.text = persona['apellidos'] ?? '';
    _cedulaCtrl.text = persona['cedula'] ?? '';
    _telefonoCtrl.text = persona['telefono1'] ?? '';
    _direccionCtrl.text = persona['direccion'] ?? '';
    _emailCtrl.text = _profileData!['email'] ?? '';
    _profesionCtrl.text = tutor['profesion'] ?? '';
    _passwordCtrl.text = '';
    _confirmPasswordCtrl.text = '';
    _newImage = null;
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() => _newImage = picked);
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_passwordCtrl.text.isNotEmpty && _passwordCtrl.text != _confirmPasswordCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Las contraseñas no coinciden')));
      return;
    }

    setState(() => _isSaving = true);
    
    final auth = context.read<AuthProvider>();
    final user = auth.currentUser;
    final apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1';
    final dio = Dio(BaseOptions(
      baseUrl: apiUrl,
      headers: {'Authorization': 'Bearer ${auth.token}'},
    ));

    try {
      final updateData = {
        "email": _emailCtrl.text.trim(),
        "profesion": _profesionCtrl.text.trim().isNotEmpty ? _profesionCtrl.text.trim() : null,
        "persona": {
          "nombres": _nombresCtrl.text.trim(),
          "apellidos": _apellidosCtrl.text.trim(),
          "cedula": _cedulaCtrl.text.trim(),
          "telefono1": _telefonoCtrl.text.trim(),
          "direccion": _direccionCtrl.text.trim(),
        }
      };
      
      if (_passwordCtrl.text.isNotEmpty) {
        updateData["password"] = _passwordCtrl.text;
      }

      await dio.put('/usuarios/${user!.id}', data: updateData);

      if (_newImage != null) {
        final fileName = _newImage!.path.split('/').last;
        final formData = FormData.fromMap({
          "foto": await MultipartFile.fromFile(_newImage!.path, filename: fileName),
        });
        await dio.post('/usuarios/${user.id}/foto', data: formData);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Perfil actualizado')));
        setState(() => _isEditing = false);
        await auth.reloadUser();
        await _fetchProfile();
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['error'] ?? 'Error al guardar';
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
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

  Widget _buildTextField(String label, TextEditingController controller, bool isDark, {bool required = false, bool isPassword = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: TextFormField(
        controller: controller,
        obscureText: isPassword,
        style: TextStyle(color: isDark ? Colors.white : AppColors.textPrimary),
        validator: required ? (value) => value == null || value.trim().isEmpty ? 'Requerido' : null : null,
        decoration: InputDecoration(
          labelText: required ? '$label *' : label,
          labelStyle: TextStyle(color: isDark ? Colors.white54 : AppColors.textSecondary),
          filled: true,
          fillColor: isDark ? AppColors.surfaceVariant : Colors.grey.shade100,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String title, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value.isNotEmpty ? value : 'No especificado',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: isDark ? Colors.white : AppColors.textPrimary),
        title: Text(
          _isEditing ? 'Editar Perfil' : 'Mi Perfil',
          style: TextStyle(
            color: isDark ? Colors.white : AppColors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          if (!_isLoading && _error == null)
            IconButton(
              icon: Icon(_isEditing ? Icons.close : Icons.edit, color: AppColors.primary),
              onPressed: () {
                setState(() {
                  _isEditing = !_isEditing;
                  if (!_isEditing) _populateForm(); // Reset changes
                });
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : _buildProfileContent(isDark, authProvider),
    );
  }

  Widget _buildProfileContent(bool isDark, AuthProvider authProvider) {
    final persona = _profileData?['persona'] ?? {};
    final tutor = persona['tutor'] ?? {};
    
    final fotoPath = tutor['fotografia'];
    
    ImageProvider? imageProvider;
    if (_newImage != null) {
      imageProvider = FileImage(File(_newImage!.path));
    } else if (fotoPath != null && fotoPath.toString().isNotEmpty) {
      imageProvider = NetworkImage(_getFullImageUrl(fotoPath, authProvider.token));
    } else {
      imageProvider = const NetworkImage('https://i.pravatar.cc/150');
    }

    final nombres = persona['nombres'] ?? '';
    final apellidos = persona['apellidos'] ?? '';
    final nombreCompleto = '$nombres $apellidos'.trim();
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            GestureDetector(
              onTap: _isEditing ? _pickImage : null,
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 60,
                    backgroundColor: AppColors.primary.withOpacity(0.1),
                    backgroundImage: imageProvider,
                  ),
                  if (_isEditing)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            if (!_isEditing) ...[
              Text(
                nombreCompleto.isNotEmpty ? nombreCompleto : (_profileData?['username'] ?? 'Usuario'),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  (_profileData?['rol'] ?? '').toString().toUpperCase(),
                  style: const TextStyle(
                    fontWeight: FontWeight.w700, 
                    color: AppColors.primary,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              
              // Data Cards (View Mode)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surface : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildInfoRow(Icons.badge, 'Cédula', persona['cedula'] ?? '', isDark),
                    const Divider(),
                    _buildInfoRow(Icons.email, 'Email', _profileData?['email'] ?? '', isDark),
                    const Divider(),
                    _buildInfoRow(Icons.phone, 'Teléfono', persona['telefono1'] ?? '', isDark),
                    const Divider(),
                    _buildInfoRow(Icons.location_on, 'Dirección', persona['direccion'] ?? '', isDark),
                    const Divider(),
                    _buildInfoRow(Icons.work, 'Profesión', tutor['profesion'] ?? '', isDark),
                  ],
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Logout Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red.shade50,
                    foregroundColor: Colors.red,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  icon: const Icon(Icons.logout),
                  label: const Text('Cerrar Sesión', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  onPressed: () async {
                    await authProvider.logout();
                    if (mounted) {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const LoginPage()),
                        (route) => false,
                      );
                    }
                  },
                ),
              ),
            ] else ...[
              // Edit Form
              _buildTextField('Nombres', _nombresCtrl, isDark, required: true),
              _buildTextField('Apellidos', _apellidosCtrl, isDark, required: true),
              _buildTextField('Cédula', _cedulaCtrl, isDark),
              _buildTextField('Teléfono', _telefonoCtrl, isDark),
              _buildTextField('Dirección', _direccionCtrl, isDark),
              _buildTextField('Email', _emailCtrl, isDark, required: true),
              _buildTextField('Profesión', _profesionCtrl, isDark),
              
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('Cambiar Contraseña (Opcional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              const SizedBox(height: 16),
              _buildTextField('Nueva Contraseña', _passwordCtrl, isDark, isPassword: true),
              _buildTextField('Confirmar Contraseña', _confirmPasswordCtrl, isDark, isPassword: true),
              
              const SizedBox(height: 32),
              
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isSaving 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Guardar Cambios', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
