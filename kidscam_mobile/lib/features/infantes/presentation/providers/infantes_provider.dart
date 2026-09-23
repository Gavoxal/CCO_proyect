import 'package:flutter/material.dart';
import '../../data/repositories/infantes_repository.dart';
import '../../domain/models/infante.dart';

class InfantesProvider with ChangeNotifier {
  final InfantesRepository _repository = InfantesRepository();
  
  List<Infante> _infantes = [];
  bool _isLoading = false;
  String? _error;

  List<Infante> get infantes => _infantes;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchInfantes({String? query, String? tipoPrograma}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _infantes = await _repository.getInfantes(buscar: query, tipoPrograma: tipoPrograma);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }
}
