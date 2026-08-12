import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/infantes_provider.dart';
import '../../domain/models/infante.dart';

class InfantesScreen extends StatefulWidget {
  const InfantesScreen({super.key});

  @override
  State<InfantesScreen> createState() => _InfantesScreenState();
}

class _InfantesScreenState extends State<InfantesScreen> {
  Timer? _debounce;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InfantesProvider>().fetchInfantes();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      context.read<InfantesProvider>().fetchInfantes(query: query);
    });
  }

  String _getFullImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    
    // Asume que API_URL es algo como https://dominio.com/api/v1
    final apiUrl = dotenv.env['API_URL'] ?? 'http://localhost:3000/api/v1';
    final uri = Uri.parse(apiUrl);
    final baseUrl = '${uri.scheme}://${uri.host}${uri.hasPort ? ':${uri.port}' : ''}';
    return '$baseUrl$path';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: isDark ? AppColors.paperDark.withOpacity(0.8) : AppColors.paperLight.withOpacity(0.8),
            floating: true,
            pinned: true,
            elevation: 0,
            flexibleSpace: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(color: Colors.transparent),
              ),
            ),
            title: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.camera_enhance, color: AppColors.naranja),
                  onPressed: () {},
                ),
                const Spacer(),
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [AppColors.azul, AppColors.violeta],
                  ).createShader(bounds),
                  child: const Text(
                    'KidsCam',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
                const Spacer(),
                const CircleAvatar(
                  radius: 16,
                  backgroundImage: NetworkImage('https://i.pravatar.cc/100'),
                ),
              ],
            ),
          ),
          
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 56,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.black26 : Colors.white60,
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: isDark ? Colors.black54 : Colors.grey.shade300,
                          offset: const Offset(2, 2),
                          blurRadius: 4,
                        ),
                        BoxShadow(
                          color: isDark ? Colors.white10 : Colors.white,
                          offset: const Offset(-2, -2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Center(
                      child: TextField(
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                        decoration: InputDecoration(
                          hintText: 'Buscar infante (nombre o código)...',
                          hintStyle: TextStyle(color: isDark ? Colors.white54 : Colors.black38),
                          prefixIcon: Icon(Icons.search, color: isDark ? Colors.white70 : Colors.black54),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Infantes',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: AppColors.naranja,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          
          Consumer<InfantesProvider>(
            builder: (context, provider, child) {
              if (provider.isLoading) {
                return const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator(color: AppColors.naranja)),
                );
              }
              if (provider.error != null) {
                return SliverFillRemaining(
                  child: Center(child: Text('Error: ${provider.error}')),
                );
              }
              if (provider.infantes.isEmpty) {
                return const SliverFillRemaining(
                  child: Center(child: Text('No hay infantes registrados con ese criterio.')),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final infante = provider.infantes[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: _buildInfanteCard(infante, isDark),
                      );
                    },
                    childCount: provider.infantes.length,
                  ),
                ),
              );
            },
          ),
          
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
    );
  }

  Widget _buildInfanteCard(Infante infante, bool isDark) {
    final imageUrl = _getFullImageUrl(infante.fotoUrl);
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withOpacity(isDark ? 0.1 : 0.4),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 16,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 8)
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: imageUrl.isNotEmpty
                  ? Image.network(imageUrl, fit: BoxFit.cover, errorBuilder: (_,__,___) => _buildInitials(infante.nombres))
                  : _buildInitials(infante.nombres),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${infante.nombres} ${infante.apellidos}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  'Código: ${infante.codigo}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.naranja,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  infante.grupo ?? 'Sin programa asignado',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.more_vert, color: AppColors.naranja.withOpacity(0.8)),
            onPressed: () {},
            style: IconButton.styleFrom(
              backgroundColor: AppColors.naranja.withOpacity(0.1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInitials(String nombres) {
    String initials = "IM";
    if (nombres.isNotEmpty) {
      initials = nombres.substring(0, 1).toUpperCase();
    }
    return Container(
      color: AppColors.azul.withOpacity(0.2),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.azul),
        ),
      ),
    );
  }
}
