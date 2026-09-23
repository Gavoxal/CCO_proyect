import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../../core/theme/app_colors.dart';
import '../providers/infantes_provider.dart';
import '../../domain/models/infante.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import 'infante_detail_screen.dart';
import 'infante_form_screen.dart';
import '../../../usuarios/presentation/pages/profile_screen.dart';
import '../../../usuarios/presentation/widgets/user_profile_avatar.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.currentUser;
    
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: AppColors.background.withOpacity(0.9),
            floating: true,
            pinned: true,
            elevation: 0,
            title: Row(
              children: [
                Icon(Icons.camera_alt_rounded, color: AppColors.primary, size: 28),
                const SizedBox(width: 8),
                Text(
                  'KidsCam',
                  style: TextStyle(
                    fontSize: 22, 
                    fontWeight: FontWeight.w800, 
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                const Spacer(),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.person_add, color: AppColors.primary),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const InfanteFormScreen(),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                const UserProfileAvatar(radius: 18),
              ],
            ),
          ),
          
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Field
                  Container(
                    height: 56,
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surface : AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: TextField(
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                        style: TextStyle(color: isDark ? Colors.white : AppColors.textPrimary),
                        decoration: InputDecoration(
                          hintText: 'Buscar infante...',
                          hintStyle: TextStyle(
                            color: isDark ? Colors.white54 : AppColors.textSecondary,
                            fontWeight: FontWeight.w400,
                          ),
                          prefixIcon: Icon(Icons.search, color: isDark ? Colors.white70 : AppColors.textSecondary),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Infantes',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                      letterSpacing: -0.5,
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
                  child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                );
              }
              if (provider.error != null) {
                return SliverFillRemaining(
                  child: Center(child: Text('Error: ${provider.error}')),
                );
              }
              
              final infantes = provider.infantes;
              final patrocinados = infantes.where((i) => i.esPatrocinado).length;
              final conFoto = infantes.where((i) => i.fotoUrl != null && i.fotoUrl!.isNotEmpty).length;

              return SliverMainAxisGroup(
                slivers: [
                  // Metrics
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                      child: Row(
                        children: [
                          Expanded(child: _buildMetric(isDark, 'Total', infantes.length.toString(), Icons.groups)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildMetric(isDark, 'Patrocinados', patrocinados.toString(), Icons.volunteer_activism, color: Colors.orange)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildMetric(isDark, 'Con Foto', conFoto.toString(), Icons.camera_alt, color: Colors.green)),
                        ],
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 16)),
                  
                  if (infantes.isEmpty)
                    const SliverFillRemaining(
                      child: Center(child: Text('No hay infantes registrados con ese criterio.')),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final infante = infantes[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 16.0),
                              child: _buildInfanteCard(context, infante, isDark),
                            );
                          },
                          childCount: infantes.length,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
    );
  }

  Widget _buildMetric(bool isDark, String title, String value, IconData icon, {Color color = AppColors.primary}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white10 : color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white70 : AppColors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfanteCard(BuildContext context, Infante infante, bool isDark) {
    final token = context.read<AuthProvider>().token;
    final imageUrl = _getFullImageUrl(infante.fotoUrl, token);
    
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => InfanteDetailScreen(infante: infante),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surface : Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.textPrimary.withOpacity(isDark ? 0.2 : 0.04),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(shape: BoxShape.circle),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(32),
                child: imageUrl.isNotEmpty
                    ? Image.network(imageUrl, fit: BoxFit.cover, errorBuilder: (_,__,___) => _buildInitials(infante.nombres))
                    : _buildInitials(infante.nombres),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${infante.nombres} ${infante.apellidos}',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        'Código: ${infante.codigo}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                      Text(
                        '• ${infante.edad} años',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? Colors.white54 : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          infante.grupo ?? 'Sin programa',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ),
                      if (infante.esPatrocinado)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'Patrocinado',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.orange),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: isDark ? Colors.white24 : AppColors.surfaceVariant, size: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildInitials(String nombres) {
    String initials = "IM";
    if (nombres.isNotEmpty) {
      initials = nombres.substring(0, 1).toUpperCase();
    }
    return Container(
      color: AppColors.primary.withOpacity(0.1),
      child: Center(
        child: Text(
          initials,
          style: const TextStyle(
            fontWeight: FontWeight.w700, 
            color: AppColors.primary,
            fontSize: 24,
          ),
        ),
      ),
    );
  }
}
