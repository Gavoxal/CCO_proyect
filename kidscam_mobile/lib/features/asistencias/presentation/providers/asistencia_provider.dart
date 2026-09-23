import 'package:flutter/material.dart';
import '../../data/repositories/asistencia_repository.dart';
import '../../../infantes/domain/models/infante.dart';

class AsistenciaProvider with ChangeNotifier {
  final AsistenciaRepository _repository = AsistenciaRepository();
  
  bool _isLoading = false;
  bool _isSaving = false;
  
  bool get isLoading => _isLoading;
  bool get isSaving => _isSaving;

  // Estado local para la toma de asistencia
  // key: infanteId, value: estado
  Map<int, String> _estados = {};
  Map<int, double> _montosPagados = {};
  String _fechaActual = DateTime.now().toIso8601String().split('T')[0];

  Map<int, String> get estados => _estados;
  Map<int, double> get montosPagados => _montosPagados;
  String get fechaActual => _fechaActual;

  void setFechaActual(String fecha, List<Infante> infantes) {
    _fechaActual = fecha;
    cargarAsistenciaFecha(infantes);
  }

  Future<void> cargarAsistenciaFecha(List<Infante> infantes) async {
    _isLoading = true;
    notifyListeners();

    try {
      final registros = await _repository.getAsistenciaByFecha(_fechaActual);
      
      _estados.clear();
      _montosPagados.clear();

      // Inicializar por defecto en 'Ausente' y monto 0
      for (var inf in infantes) {
        _estados[inf.id] = 'Ausente';
        _montosPagados[inf.id] = 0.0;
      }

      // Sobrescribir con lo que viene del backend
      for (var reg in registros) {
        _estados[reg.infanteId] = reg.estado;
        
        final tarifa = _getTarifaDiaria(infantes, reg.infanteId);
        final pagado = reg.montoPagado ?? (reg.estado == 'PagoDia' ? tarifa : 0.0);
        _montosPagados[reg.infanteId] = pagado;
      }
    } catch (e) {
      debugPrint("Error cargando asistencia: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setEstadoInfante(int infanteId, String nuevoEstado, double tarifa) {
    _estados[infanteId] = nuevoEstado;
    
    if (nuevoEstado == 'PagoDia') {
      _montosPagados[infanteId] = tarifa;
    } else if (nuevoEstado == 'Mes') {
      _montosPagados[infanteId] = tarifa * 10;
    } else if (nuevoEstado == 'Semana') {
      _montosPagados[infanteId] = tarifa * 3;
    } else if (nuevoEstado == 'Pendiente') {
      final prev = _montosPagados[infanteId] ?? 0.0;
      _montosPagados[infanteId] = (prev > 0 && prev < tarifa) ? prev : 0.0;
    } else {
      _montosPagados[infanteId] = 0.0;
    }
    
    notifyListeners();
  }

  Future<bool> guardarAsistencia(List<Infante> infantes) async {
    _isSaving = true;
    notifyListeners();

    try {
      final payload = _estados.entries.map((entry) {
        final infId = entry.key;
        final st = entry.value;
        final tarifa = _getTarifaDiaria(infantes, infId);
        
        double monto = _montosPagados[infId] ?? 0.0;
        if (st == 'PagoDia' && monto == 0.0) {
          monto = tarifa;
        } else if (st == 'Mes') {
          monto = tarifa * 10;
        } else if (st == 'Semana') {
          monto = tarifa * 3;
        } else if (st != 'PagoDia' && st != 'Pendiente') {
          monto = 0.0;
        }

        return {
          'infanteId': infId,
          'estado': st,
          'montoPagado': monto,
        };
      }).toList();

      await _repository.registrarBulk(_fechaActual, payload);
      _isSaving = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint("Error guardando asistencia: $e");
      _isSaving = false;
      notifyListeners();
      return false;
    }
  }

  double _getTarifaDiaria(List<Infante> infantes, int infanteId) {
    try {
      final inf = infantes.firstWhere((element) => element.id == infanteId);
      return double.tryParse(inf.tarifaDiaria) ?? 0.60;
    } catch (_) {
      return 0.60;
    }
  }

  // Métricas
  Map<String, dynamic> getMetricas(List<Infante> infantes) {
    double recaudado = 0;
    double debiendo = 0;
    int pagaronCount = 0;
    int debenCount = 0;
    double deudaTotalSistema = 0;
    int infantesConDeudaCount = 0;
    int presentesCount = 0;
    int totalCount = infantes.length;

    for (var inf in infantes) {
      final tarifa = double.tryParse(inf.tarifaDiaria) ?? 0.60;
      final st = _estados[inf.id] ?? 'Ausente';
      final pagado = _montosPagados[inf.id] ?? 0.0;
      
      if (st != 'Ausente') {
        presentesCount++;
      }

      if (st == 'PagoDia') {
        recaudado += tarifa;
        pagaronCount++;
      } else if (st == 'Mes') {
        recaudado += (tarifa * 10);
        pagaronCount++;
      } else if (st == 'Semana') {
        recaudado += (tarifa * 3);
        pagaronCount++;
      } else if (st == 'Pendiente') {
        if (pagado > 0) {
          recaudado += pagado;
          pagaronCount++;
        }
        final deudaHoy = (tarifa - pagado > 0) ? (tarifa - pagado) : 0.0;
        debiendo += deudaHoy;
        if (deudaHoy > 0) debenCount++;
      }

      if (inf.deudaTotal > 0) {
        deudaTotalSistema += inf.deudaTotal;
        infantesConDeudaCount++;
      }
    }

    return {
      'recaudado': recaudado,
      'debiendo': debiendo,
      'pagaronCount': pagaronCount,
      'debenCount': debenCount,
      'deudaTotalSistema': deudaTotalSistema,
      'infantesConDeudaCount': infantesConDeudaCount,
      'presentesCount': presentesCount,
      'totalCount': totalCount,
    };
  }

  Future<void> pagarDeuda(int infanteId, double monto) async {
    _isSaving = true;
    notifyListeners();
    try {
      await _repository.pagarDeuda(infanteId, monto);
      _isSaving = false;
      notifyListeners();
    } catch (e) {
      _isSaving = false;
      notifyListeners();
      rethrow;
    }
  }
}
