import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../infantes/domain/models/infante.dart';
import '../../../infantes/presentation/providers/infantes_provider.dart';
import '../providers/asistencia_provider.dart';
import '../../../usuarios/presentation/widgets/user_profile_avatar.dart';

class AsistenciaScreen extends StatefulWidget {
  const AsistenciaScreen({super.key});

  @override
  State<AsistenciaScreen> createState() => _AsistenciaScreenState();
}

class _AsistenciaScreenState extends State<AsistenciaScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _filtroPrograma = 'all';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _cargarDatos();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _cargarDatos() async {
    final infantesProvider = context.read<InfantesProvider>();
    final asistenciaProvider = context.read<AsistenciaProvider>();
    
    await infantesProvider.fetchInfantes(tipoPrograma: _filtroPrograma);
    asistenciaProvider.cargarAsistenciaFecha(infantesProvider.infantes);
  }

  void _cambiarFiltroPrograma(String nuevoFiltro) {
    setState(() {
      _filtroPrograma = nuevoFiltro;
    });
    _cargarDatos();
  }

  void _seleccionarFecha(BuildContext context) async {
    final provider = context.read<AsistenciaProvider>();
    final infantesProvider = context.read<InfantesProvider>();
    
    final currentSelected = DateTime.tryParse(provider.fechaActual) ?? DateTime.now();
    
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: currentSelected,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: AppColors.surface,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final fechaStr = picked.toIso8601String().split('T')[0];
      provider.setFechaActual(fechaStr, infantesProvider.infantes);
    }
  }

  // --- DIÁLOGOS DE PAGO ---

  void _mostrarDialogoAbonoParcial(BuildContext context, int infanteId, String nombre, double tarifa, double pagadoPrevio) {
    final defaultMonto = (pagadoPrevio > 0) ? pagadoPrevio.toStringAsFixed(2) : tarifa.toString();
    final TextEditingController montoCtrl = TextEditingController(text: defaultMonto);
    final provider = context.read<AsistenciaProvider>();
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('½ Abono para $nombre'),
        content: TextField(
          controller: montoCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            labelText: 'Monto a abonar hoy',
            prefixText: '\$ ',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () {
              final monto = double.tryParse(montoCtrl.text);
              if (monto != null && monto > 0) {
                provider.setEstadoInfante(infanteId, 'Pendiente', monto);
                Navigator.pop(ctx);
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  void _mostrarDialogoPagarDeuda(BuildContext context, int infanteId, String nombre, double deudaTotal) {
    final TextEditingController montoCtrl = TextEditingController(text: deudaTotal.toString());
    bool esPagoTotal = true;
    
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setStateDialog) => AlertDialog(
          title: Text('Pagar Deuda - $nombre'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Deuda actual: \$${deudaTotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              Row(
                children: [
                  Radio<bool>(
                    value: true,
                    groupValue: esPagoTotal,
                    onChanged: (val) {
                      setStateDialog(() {
                        esPagoTotal = val!;
                        montoCtrl.text = deudaTotal.toString();
                      });
                    },
                  ),
                  const Text('Total'),
                  Radio<bool>(
                    value: false,
                    groupValue: esPagoTotal,
                    onChanged: (val) {
                      setStateDialog(() {
                        esPagoTotal = val!;
                      });
                    },
                  ),
                  const Text('Parcial'),
                ],
              ),
              if (!esPagoTotal)
                TextField(
                  controller: montoCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Monto a pagar',
                    prefixText: '\$ ',
                    border: OutlineInputBorder(),
                  ),
                ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
            ElevatedButton(
              onPressed: () async {
                final monto = esPagoTotal ? deudaTotal : double.tryParse(montoCtrl.text);
                if (monto != null && monto > 0) {
                  Navigator.pop(ctx);
                  try {
                    await context.read<AsistenciaProvider>().pagarDeuda(infanteId, monto);
                    await context.read<InfantesProvider>().fetchInfantes(tipoPrograma: _filtroPrograma);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pago de deuda exitoso')));
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                    }
                  }
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Procesar Pago', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final asistenciaProvider = context.watch<AsistenciaProvider>();
    final infantesProvider = context.watch<InfantesProvider>();
    final metricas = asistenciaProvider.getMetricas(infantesProvider.infantes);

    final infantesFiltrados = infantesProvider.infantes.where((inf) {
      if (_searchQuery.isEmpty) return true;
      final nombre = '${inf.nombres} ${inf.apellidos}'.toLowerCase();
      final cod = inf.codigo.toLowerCase();
      return nombre.contains(_searchQuery) || cod.contains(_searchQuery);
    }).toList();

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverAppBar(
            expandedHeight: 270,
            floating: true,
            pinned: true,
            backgroundColor: isDark ? const Color(0xFF0F172A) : AppColors.background,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 24, bottom: 16),
              title: Text(
                'Asistencia (${infantesProvider.infantes.length})',
                style: TextStyle(
                  color: isDark ? Colors.white : AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                  letterSpacing: -0.5,
                ),
              ),
              background: Container(
                padding: const EdgeInsets.only(top: 60, right: 24, left: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const UserProfileAvatar(radius: 18),
                        const SizedBox(width: 12),
                        InkWell(
                          onTap: () => _seleccionarFecha(context),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today, size: 16, color: AppColors.primary),
                                const SizedBox(width: 8),
                                Text(
                                  asistenciaProvider.fechaActual,
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // BUSCAR
                    TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Buscar infante...',
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: isDark ? Colors.white10 : Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // FILTRO Y GUARDAR
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white10 : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _filtroPrograma,
                                isExpanded: true,
                                icon: const Icon(Icons.arrow_drop_down),
                                onChanged: (val) {
                                  if (val != null) _cambiarFiltroPrograma(val);
                                },
                                items: const [
                                  DropdownMenuItem(value: 'all', child: Text('Todos (Filtro)', overflow: TextOverflow.ellipsis)),
                                  DropdownMenuItem(value: 'Comedor', child: Text('Comedor', overflow: TextOverflow.ellipsis)),
                                  DropdownMenuItem(value: 'Ministerio', child: Text('Ministerio', overflow: TextOverflow.ellipsis)),
                                  DropdownMenuItem(value: 'Ambos', child: Text('Ambos', overflow: TextOverflow.ellipsis)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: asistenciaProvider.isSaving
                              ? null
                              : () async {
                                  final exito = await asistenciaProvider.guardarAsistencia(infantesProvider.infantes);
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(exito ? 'Asistencia guardada con éxito' : 'Error al guardar'),
                                        backgroundColor: exito ? AppColors.primary : Colors.red,
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          icon: asistenciaProvider.isSaving 
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.save, size: 20),
                          label: Text(
                            asistenciaProvider.isSaving ? 'Guardando...' : 'Guardar',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Métricas Horizontales
          SliverToBoxAdapter(
            child: SizedBox(
              height: 125,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  Builder(
                    builder: (context) {
                      final presentes = metricas['presentesCount'] ?? 0;
                      final total = metricas['totalCount'] ?? 1;
                      final int porcentaje = total > 0 ? ((presentes / total) * 100).round() : 0;
                      return _MetricCard(
                        title: 'Asistencia Hoy',
                        value: '$presentes / $total',
                        subtitle: '$porcentaje% sobre el total ($total)',
                        color: Colors.blueAccent,
                        icon: Icons.groups,
                        isDark: isDark,
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                  _MetricCard(
                    title: 'Recaudado Hoy',
                    value: '\$${metricas['recaudado'].toStringAsFixed(2)}',
                    subtitle: '${metricas['pagaronCount']} pagos',
                    color: Colors.green,
                    icon: Icons.account_balance_wallet,
                    isDark: isDark,
                  ),
                  const SizedBox(width: 12),
                  _MetricCard(
                    title: 'Deuda Hoy',
                    value: '\$${metricas['debiendo'].toStringAsFixed(2)}',
                    subtitle: '${metricas['debenCount']} deudas',
                    color: Colors.redAccent,
                    icon: Icons.money_off,
                    isDark: isDark,
                  ),
                  const SizedBox(width: 12),
                  _MetricCard(
                    title: 'Total Deuda',
                    value: '\$${metricas['deudaTotalSistema'].toStringAsFixed(2)}',
                    subtitle: 'Histórico',
                    color: Colors.deepPurple,
                    icon: Icons.warning_amber_rounded,
                    isDark: isDark,
                  ),
                ],
              ),
            ),
          ),
          
          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // Lista de Infantes
          if (infantesProvider.isLoading || asistenciaProvider.isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
            )
          else if (infantesFiltrados.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Text(
                  'No se encontraron infantes',
                  style: TextStyle(color: isDark ? Colors.white54 : AppColors.textSecondary),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final infante = infantesFiltrados[index];
                    final estadoActual = asistenciaProvider.estados[infante.id] ?? 'Ausente';
                    
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white, // Siempre blanco
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.textPrimary.withOpacity(isDark ? 0.2 : 0.04),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          )
                        ],
                      ),
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          // Si es pantalla grande (tablet), usamos fila horizontal, si no, columna
                          final isTablet = constraints.maxWidth > 600;
                          
                          final childInfo = Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: AppColors.primary.withOpacity(0.15),
                                child: Text(
                                  infante.codigo.isNotEmpty ? infante.codigo.substring(0, 2).toUpperCase() : 'NN',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${infante.nombres} ${infante.apellidos}'.trim(),
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87, // Fijo oscuro
                                      ),
                                    ),
                                    Text(
                                      'Cód: ${infante.codigo} • Tarifa: \$${infante.tarifaDiaria}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.black54, // Fijo oscuro
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );

                          final extraInfo = Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              // Programa y Estatus Mensual/Semanal
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: Colors.orange),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      infante.grupo ?? 'Sin grupo',
                                      style: const TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  if (infante.pagoMesActivo || infante.pagoSemanaActivo)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4.0),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: infante.pagoMesActivo ? Colors.green : Colors.blue,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          infante.pagoMesActivo ? 'MES ACTIVO' : 'SEM ACTIVO',
                                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              // Deuda
                              InkWell(
                                onTap: infante.deudaTotal > 0 ? () => _mostrarDialogoPagarDeuda(context, infante.id, infante.nombres, infante.deudaTotal) : null,
                                borderRadius: BorderRadius.circular(8),
                                child: Padding(
                                  padding: const EdgeInsets.all(4.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('DEUDA', style: TextStyle(fontSize: 10, color: Colors.black54, fontWeight: FontWeight.bold)),
                                      Row(
                                        children: [
                                          Text(
                                            '\$${infante.deudaTotal.toStringAsFixed(2)}',
                                            style: TextStyle(
                                              fontSize: 14, 
                                              fontWeight: FontWeight.bold, 
                                              color: infante.deudaTotal > 0 ? Colors.red : Colors.green
                                            ),
                                          ),
                                          if (infante.deudaTotal > 0)
                                            const Padding(
                                              padding: EdgeInsets.only(left: 4.0),
                                              child: Icon(Icons.payment, size: 14, color: Colors.red),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          );

                          final statusSelector = SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _StatusChip(label: 'MES', stateValue: 'Mes', currentState: estadoActual, infanteId: infante.id, color: Colors.green),
                                _StatusChip(label: 'SEM', stateValue: 'Semana', currentState: estadoActual, infanteId: infante.id, color: Colors.blue),
                                _StatusChip(label: '\$${infante.tarifaDiaria}', stateValue: 'PagoDia', currentState: estadoActual, infanteId: infante.id, color: AppColors.primary),
                                _StatusChip(label: 'P', stateValue: 'Pendiente', currentState: estadoActual, infanteId: infante.id, color: Colors.red),
                                _StatusChip(label: 'S', stateValue: 'Punto', currentState: estadoActual, infanteId: infante.id, color: Colors.purple),
                                _StatusChip(label: 'F', stateValue: 'Ausente', currentState: estadoActual, infanteId: infante.id, color: Colors.grey),
                                // Botón Abono
                                Builder(
                                  builder: (context) {
                                    final pagado = asistenciaProvider.montosPagados[infante.id] ?? 0.0;
                                    final abonoText = (estadoActual == 'Pendiente' && pagado > 0) 
                                        ? '½ \$${pagado.toStringAsFixed(2)}' 
                                        : '½ Abono';
                                    return Padding(
                                      padding: const EdgeInsets.only(left: 8.0),
                                      child: OutlinedButton(
                                        onPressed: () => _mostrarDialogoAbonoParcial(context, infante.id, infante.nombres, double.tryParse(infante.tarifaDiaria) ?? 0.60, pagado),
                                        style: OutlinedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          minimumSize: Size.zero,
                                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                          side: const BorderSide(color: Colors.amber),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                        child: Text(abonoText, style: const TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.bold)),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          );

                          if (isTablet) {
                            return Row(
                              children: [
                                Expanded(flex: 3, child: childInfo),
                                Expanded(flex: 2, child: extraInfo),
                                Expanded(flex: 4, child: statusSelector),
                              ],
                            );
                          } else {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                childInfo,
                                const SizedBox(height: 12),
                                extraInfo,
                                const SizedBox(height: 12),
                                statusSelector,
                              ],
                            );
                          }
                        },
                      ),
                    );
                  },
                  childCount: infantesFiltrados.length,
                ),
              ),
            ),
            
          const SliverToBoxAdapter(child: SizedBox(height: 80)), // Padding para el FAB
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: asistenciaProvider.isSaving
            ? null
            : () async {
                final exito = await asistenciaProvider.guardarAsistencia(infantesProvider.infantes);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(exito ? 'Asistencia guardada con éxito' : 'Error al guardar'),
                      backgroundColor: exito ? AppColors.primary : Colors.red,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
        backgroundColor: AppColors.primary,
        icon: asistenciaProvider.isSaving 
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : const Icon(Icons.save, color: Colors.white),
        label: Text(
          asistenciaProvider.isSaving ? 'Guardando...' : 'Guardar',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final Color color;
  final IconData icon;
  final bool isDark;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
    required this.icon,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.15 : 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Icon(icon, size: 14, color: color),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white54 : AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final String stateValue;
  final String currentState;
  final int infanteId;
  final Color color;

  const _StatusChip({
    required this.label,
    required this.stateValue,
    required this.currentState,
    required this.infanteId,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = stateValue == currentState;
    final asistenciaProvider = context.read<AsistenciaProvider>();
    final infantesProvider = context.read<InfantesProvider>();

    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: InkWell(
        onTap: () {
          final infante = infantesProvider.infantes.firstWhere((e) => e.id == infanteId);
          final tarifa = double.tryParse(infante.tarifaDiaria) ?? 0.60;
          asistenciaProvider.setEstadoInfante(infanteId, stateValue, tarifa);
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? color : color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? color : Colors.transparent,
              width: 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
