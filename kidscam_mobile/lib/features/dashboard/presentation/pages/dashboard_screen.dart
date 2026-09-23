import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../usuarios/presentation/widgets/user_profile_avatar.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadStats();
    });
  }

  Future<void> _loadStats() async {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.token != null) {
      await context.read<DashboardProvider>().fetchStats(authProvider.token!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dashboardProvider = context.watch<DashboardProvider>();

    return Scaffold(
      backgroundColor: Colors.transparent, // Background from MainScreen
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            floating: true,
            pinned: true,
            backgroundColor: Theme.of(context).scaffoldBackgroundColor,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              title: Text(
                'Inicio',
                style: TextStyle(
                  color: isDark ? Colors.white : AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 24,
                  letterSpacing: -0.5,
                ),
              ),
              background: Container(
                padding: const EdgeInsets.only(top: 60, right: 24, left: 24),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    UserProfileAvatar(radius: 18),
                  ],
                ),
              ),
            ),
          ),
          
          if (dashboardProvider.isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
            )
          else if (dashboardProvider.error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 48),
                    const SizedBox(height: 16),
                    Text(dashboardProvider.error!, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _loadStats,
                      child: const Text('Reintentar'),
                    ),
                  ],
                ),
              ),
            )
          else if (dashboardProvider.stats != null)
            SliverPadding(
              padding: const EdgeInsets.only(left: 24, right: 24, bottom: 100),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  _buildSectionTitle('MINISTERIO', isDark),
                  const SizedBox(height: 16),
                  _buildMinisterioStats(dashboardProvider.stats!, isDark),
                  
                  const SizedBox(height: 32),
                  _buildSectionTitle('CUMPLEAÑOS DEL MES', isDark),
                  const SizedBox(height: 16),
                  _buildCumpleanos(dashboardProvider.stats!['cumplesMes'] as List, isDark),

                  const SizedBox(height: 32),
                  _buildSectionTitle('INVENTARIO', isDark),
                  const SizedBox(height: 16),
                  _buildInventarioStats(dashboardProvider.stats!, isDark),
                ]),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, bool isDark) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.2,
        color: isDark ? Colors.grey[500] : Colors.grey[400],
      ),
    );
  }

  Widget _buildMinisterioStats(Map<String, dynamic> stats, bool isDark) {
    final infantes = stats['infantes'];
    final asistencia = stats['asistencia'];
    final visitas = stats['visitas'];
    
    final aColor = (asistencia['pct'] >= 80) 
        ? Colors.green 
        : (asistencia['pct'] >= 60) ? Colors.orange : Colors.red;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: StatCard(
                title: 'Total Infantes',
                value: '${infantes['total']}',
                subtitle: '${infantes['patrocinados']} patroc.',
                icon: Icons.people_alt,
                color: const Color(0xFF6B2D5C), // CCO Violeta
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: StatCard(
                title: 'Asistencia',
                value: '${asistencia['pct']}%',
                subtitle: 'Este mes',
                icon: Icons.assignment_turned_in,
                color: aColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: StatCard(
                title: 'Visitas',
                value: '${visitas['realizadas']}',
                subtitle: 'Realizadas',
                icon: Icons.check_circle,
                color: Colors.green,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: StatCard(
                title: 'Sin Visita',
                value: '${visitas['sinVisita']}',
                subtitle: 'Requieren atención',
                icon: Icons.warning_amber,
                color: (visitas['sinVisita'] > 0) ? Colors.red : Colors.green,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCumpleanos(List cumples, bool isDark) {
    if (cumples.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Center(
          child: Text('No hay cumpleaños este mes'),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[900] : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: cumples.length,
        separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.withValues(alpha: 0.2)),
        itemBuilder: (context, index) {
          final c = cumples[index];
          return ListTile(
            leading: CircleAvatar(
              backgroundColor: const Color(0xFFF4C430), // CCO Amarillo
              foregroundColor: Colors.white,
              child: Text('${c['edad']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
            title: Text(c['nombre'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            subtitle: Text(c['fecha'], style: const TextStyle(fontSize: 12)),
          );
        },
      ),
    );
  }

  Widget _buildInventarioStats(Map<String, dynamic> stats, bool isDark) {
    final inv = stats['inventario'];
    return Row(
      children: [
        Expanded(
          child: StatCard(
            title: 'Materiales',
            value: '${inv['matTotal']}',
            subtitle: 'Registrados',
            icon: Icons.inventory_2,
            color: const Color(0xFF004E89), // CCO Azul
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: StatCard(
            title: 'Stock Crítico',
            value: '${inv['alertaCount']}',
            subtitle: 'Bajo mínimo',
            icon: Icons.warning_amber,
            color: (inv['alertaCount'] > 0) ? Colors.orange : Colors.green,
          ),
        ),
      ],
    );
  }
}
