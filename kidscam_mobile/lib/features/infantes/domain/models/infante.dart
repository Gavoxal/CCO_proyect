class Infante {
  final int id;
  final String codigo;
  final String nombres;
  final String apellidos;
  final String? grupo;
  final String? fotoUrl;

  Infante({
    required this.id,
    required this.codigo,
    required this.nombres,
    required this.apellidos,
    this.grupo,
    this.fotoUrl,
  });

  factory Infante.fromJson(Map<String, dynamic> json) {
    return Infante(
      id: json['id'],
      codigo: json['codigo'] ?? 'S/C',
      nombres: json['persona']?['nombres'] ?? json['nombres'] ?? 'Sin nombre',
      apellidos: json['persona']?['apellidos'] ?? json['apellidos'] ?? '',
      grupo: json['tipoPrograma'] ?? json['grupo'],
      fotoUrl: json['fotografia'] ?? json['fotoUrl'],
    );
  }
}
