class AsistenciaModel {
  final int? id;
  final int infanteId;
  final String fecha;
  final String estado;
  final double? montoPagado;

  AsistenciaModel({
    this.id,
    required this.infanteId,
    required this.fecha,
    required this.estado,
    this.montoPagado,
  });

  factory AsistenciaModel.fromJson(Map<String, dynamic> json) {
    return AsistenciaModel(
      id: json['id'],
      infanteId: json['infanteId'],
      fecha: json['fecha'] ?? '',
      estado: json['estado'] ?? 'Ausente',
      montoPagado: json['montoPagado'] != null ? double.tryParse(json['montoPagado'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'infanteId': infanteId,
      'fecha': fecha,
      'estado': estado,
      if (montoPagado != null) 'montoPagado': montoPagado,
    };
  }
}
