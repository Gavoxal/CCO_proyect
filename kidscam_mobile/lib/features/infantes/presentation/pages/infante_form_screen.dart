import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/models/infante.dart';
import '../providers/infantes_provider.dart';

class InfanteFormScreen extends StatefulWidget {
  final Infante? infante;

  const InfanteFormScreen({super.key, this.infante});

  @override
  State<InfanteFormScreen> createState() => _InfanteFormScreenState();
}

class _InfanteFormScreenState extends State<InfanteFormScreen> {
  final _formKey = GlobalKey<FormState>();
  
  bool _isLoading = false;
  
  // Controllers
  final _nombresCtrl = TextEditingController();
  final _apellidosCtrl = TextEditingController();
  final _cedulaCtrl = TextEditingController();
  final _fechaNacCtrl = TextEditingController();
  final _telefonoCtrl = TextEditingController();
  final _direccionCtrl = TextEditingController();
  final _ubicacionGpsCtrl = TextEditingController();
  final _codigoCtrl = TextEditingController();
  final _enfermedadesCtrl = TextEditingController();
  final _alergiasCtrl = TextEditingController();
  final _fuentePatrocinioCtrl = TextEditingController();
  
  String _tipoPrograma = 'Comedor';
  bool _esPatrocinado = false;

  @override
  void initState() {
    super.initState();
    if (widget.infante != null) {
      final i = widget.infante!;
      _nombresCtrl.text = i.nombres;
      _apellidosCtrl.text = i.apellidos;
      _cedulaCtrl.text = i.cedula ?? '';
      _fechaNacCtrl.text = i.fechaNacimiento ?? '';
      _telefonoCtrl.text = i.telefono1 ?? '';
      _direccionCtrl.text = i.direccion ?? '';
      _ubicacionGpsCtrl.text = i.ubicacionGps ?? '';
      _codigoCtrl.text = i.codigo;
      _enfermedadesCtrl.text = i.enfermedades ?? '';
      _alergiasCtrl.text = i.alergias ?? '';
      _fuentePatrocinioCtrl.text = i.fuentePatrocinio ?? '';
      
      _tipoPrograma = i.grupo ?? 'Comedor';
      if (!['Comedor', 'Ministerio', 'Ambos'].contains(_tipoPrograma)) {
        _tipoPrograma = 'Comedor';
      }
      _esPatrocinado = i.esPatrocinado;
    } else {
      final random = Random();
      final num = 10000 + random.nextInt(90000);
      _codigoCtrl.text = 'EC0802$num';
    }
  }

  @override
  void dispose() {
    _nombresCtrl.dispose();
    _apellidosCtrl.dispose();
    _cedulaCtrl.dispose();
    _fechaNacCtrl.dispose();
    _telefonoCtrl.dispose();
    _direccionCtrl.dispose();
    _ubicacionGpsCtrl.dispose();
    _codigoCtrl.dispose();
    _enfermedadesCtrl.dispose();
    _alergiasCtrl.dispose();
    _fuentePatrocinioCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 5)),
      firstDate: DateTime(1990),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: Theme.of(context).brightness == Brightness.dark ? AppColors.surface : Colors.white,
              onSurface: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _fechaNacCtrl.text = picked.toIso8601String().split('T')[0];
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    setState(() => _isLoading = true);

    try {
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Servicio de ubicación deshabilitado')));
        return;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Permiso de ubicación denegado')));
          return;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Permisos de ubicación denegados permanentemente')));
        return;
      } 

      Position position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
      setState(() {
        _ubicacionGpsCtrl.text = '${position.latitude}, ${position.longitude}';
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error obteniendo ubicación')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      final apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1';
      
      final dio = Dio(BaseOptions(
        headers: token != null ? {'Authorization': 'Bearer $token'} : null,
      ));

      final payload = {
        "codigo": _codigoCtrl.text.trim(),
        "tipoPrograma": _tipoPrograma,
        "esPatrocinado": _esPatrocinado,
        "fuentePatrocinio": _fuentePatrocinioCtrl.text.trim(),
        "enfermedades": _enfermedadesCtrl.text.trim(),
        "alergias": _alergiasCtrl.text.trim(),
        "persona": {
          "nombres": _nombresCtrl.text.trim(),
          "apellidos": _apellidosCtrl.text.trim(),
          "cedula": _cedulaCtrl.text.trim(),
          "fechaNacimiento": _fechaNacCtrl.text.isNotEmpty ? "${_fechaNacCtrl.text}T12:00:00.000Z" : null,
          "telefono1": _telefonoCtrl.text.trim(),
          "direccion": _direccionCtrl.text.trim(),
          "ubicacionGps": _ubicacionGpsCtrl.text.trim(),
        }
      };

      if (widget.infante == null) {
        // Crear
        await dio.post('$apiUrl/infantes', data: payload);
      } else {
        // Actualizar
        await dio.put('$apiUrl/infantes/${widget.infante!.id}', data: payload);
      }
      
      if (mounted) {
        // Actualizar lista
        context.read<InfantesProvider>().fetchInfantes();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.infante == null ? 'Infante creado con éxito' : 'Infante actualizado'),
            backgroundColor: AppColors.primary,
          )
        );
        Navigator.pop(context); // Volver
        if (widget.infante != null) {
          Navigator.pop(context); // Volver de la vista de detalle para refrescar
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al guardar: $e'), backgroundColor: Colors.red)
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isEditing = widget.infante != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: isDark ? Colors.white : AppColors.textPrimary),
        title: Text(
          isEditing ? 'Editar Infante' : 'Nuevo Infante',
          style: TextStyle(
            color: isDark ? Colors.white : AppColors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionTitle('Datos Personales', Icons.person, isDark),
                const SizedBox(height: 16),
                _buildTextField('Nombres', _nombresCtrl, isDark, required: true),
                const SizedBox(height: 16),
                _buildTextField('Apellidos', _apellidosCtrl, isDark, required: true),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildTextField('Cédula', _cedulaCtrl, isDark, isNumber: true, required: true)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _selectDate(context),
                        child: AbsorbPointer(
                          child: _buildTextField('Nacimiento', _fechaNacCtrl, isDark, icon: Icons.calendar_today),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildTextField('Teléfono', _telefonoCtrl, isDark, isNumber: true, required: true)),
                    const SizedBox(width: 16),
                    Expanded(child: _buildTextField('Código', _codigoCtrl, isDark, required: true, readOnly: true)),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField('Dirección (Referencia)', _direccionCtrl, isDark),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: _buildTextField('Ubicación GPS', _ubicacionGpsCtrl, isDark),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.my_location, color: Colors.white),
                        tooltip: 'Obtener mi ubicación actual',
                        onPressed: _getCurrentLocation,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 32),
                _buildSectionTitle('Programa y Médicos', Icons.medical_services, isDark),
                const SizedBox(height: 16),
                
                // Tipo Programa Dropdown
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? Colors.transparent : Colors.grey.shade300),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _tipoPrograma,
                      isExpanded: true,
                      dropdownColor: isDark ? AppColors.surface : Colors.white,
                      items: ['Comedor', 'Ministerio', 'Ambos'].map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value, style: TextStyle(color: isDark ? Colors.white : AppColors.textPrimary)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _tipoPrograma = val);
                      },
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? Colors.transparent : Colors.grey.shade300),
                  ),
                  child: CheckboxListTile(
                    title: Text('Es Patrocinado', style: TextStyle(color: isDark ? Colors.white : AppColors.textPrimary, fontWeight: FontWeight.w600)),
                    value: _esPatrocinado,
                    activeColor: AppColors.primary,
                    onChanged: (val) {
                      setState(() => _esPatrocinado = val ?? false);
                    },
                  ),
                ),
                if (_esPatrocinado) ...[
                  const SizedBox(height: 16),
                  _buildTextField('Fuente de Patrocinio (Ej: Padrino, Institución)', _fuentePatrocinioCtrl, isDark),
                ],

                const SizedBox(height: 16),
                _buildTextField('Alergias', _alergiasCtrl, isDark, maxLines: 2),
                const SizedBox(height: 16),
                _buildTextField('Enfermedades', _enfermedadesCtrl, isDark, maxLines: 2),

                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    onPressed: _guardar,
                    child: const Text(
                      'Guardar Infante',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
                const SizedBox(height: 48),
              ],
            ),
          ),
        ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon, bool isDark) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, bool isDark, {bool required = false, bool isNumber = false, int maxLines = 1, IconData? icon, bool readOnly = false}) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      maxLines: maxLines,
      style: TextStyle(color: isDark ? Colors.white : AppColors.textPrimary),
      validator: required ? (value) {
        if (value == null || value.trim().isEmpty) return 'Campo requerido';
        return null;
      } : null,
      decoration: InputDecoration(
        labelText: required ? '$label *' : label,
        labelStyle: TextStyle(color: isDark ? Colors.white54 : AppColors.textSecondary),
        filled: true,
        fillColor: isDark ? Colors.white10 : Colors.white,
        suffixIcon: icon != null ? Icon(icon, color: isDark ? Colors.white54 : AppColors.textSecondary) : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: isDark ? Colors.transparent : Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: isDark ? Colors.transparent : Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
    );
  }
}
