class Infante {
  final int id;
  final String codigo;
  final String nombres;
  final String apellidos;
  final String? cedula;
  final String? fechaNacimiento;
  final String? telefono1;
  final String? telefono2;
  final String? email;
  final String? direccion;
  final String? ubicacionGps;

  final String? grupo; // tipoPrograma
  final String? fotoUrl;
  final String tarifaDiaria;
  final double deudaTotal;
  final bool pagoMesActivo;
  final bool pagoSemanaActivo;

  final bool esPatrocinado;
  final String? fuentePatrocinio;
  final String? enfermedades;
  final String? alergias;

  // Tutor Info
  final String? tutorNombres;
  final String? tutorApellidos;
  final String? tutorTelefono;

  Infante({
    required this.id,
    required this.codigo,
    required this.nombres,
    required this.apellidos,
    this.cedula,
    this.fechaNacimiento,
    this.telefono1,
    this.telefono2,
    this.email,
    this.direccion,
    this.ubicacionGps,
    this.grupo,
    this.fotoUrl,
    this.tarifaDiaria = '0.60',
    this.deudaTotal = 0.0,
    this.pagoMesActivo = false,
    this.pagoSemanaActivo = false,
    this.esPatrocinado = false,
    this.fuentePatrocinio,
    this.enfermedades,
    this.alergias,
    this.tutorNombres,
    this.tutorApellidos,
    this.tutorTelefono,
  });

  int get edad {
    if (fechaNacimiento == null || fechaNacimiento!.isEmpty) return 0;
    try {
      final dob = DateTime.parse(fechaNacimiento!);
      final now = DateTime.now();
      int age = now.year - dob.year;
      if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
        age--;
      }
      return age;
    } catch (_) {
      return 0;
    }
  }

  factory Infante.fromJson(Map<String, dynamic> json) {
    final persona = json['persona'] ?? {};
    final tutor = json['tutor'] ?? {};
    final tutorPersona = tutor['persona'] ?? {};

    return Infante(
      id: json['id'],
      codigo: json['codigo'] ?? 'S/C',
      nombres: persona['nombres'] ?? json['nombres'] ?? 'Sin nombre',
      apellidos: persona['apellidos'] ?? json['apellidos'] ?? '',
      cedula: persona['cedula'],
      fechaNacimiento: persona['fechaNacimiento']?.toString().split('T')[0],
      telefono1: persona['telefono1'],
      telefono2: persona['telefono2'],
      email: persona['email'],
      direccion: persona['direccion'],
      ubicacionGps: persona['ubicacionGps'],
      grupo: json['tipoPrograma'] ?? json['grupo'],
      fotoUrl: json['fotografia'] ?? json['fotoUrl'],
      tarifaDiaria: json['tarifaDiaria']?.toString() ?? '0.60',
      deudaTotal: json['deudaTotal'] != null ? double.tryParse(json['deudaTotal'].toString()) ?? 0.0 : 0.0,
      pagoMesActivo: json['pagoMesActivo'] == true || json['pagoMesActivo'] == 1 || json['pagoMesActivo'] == 'true' || json['pagoMesActivo'] == '1',
      pagoSemanaActivo: json['pagoSemanaActivo'] == true || json['pagoSemanaActivo'] == 1 || json['pagoSemanaActivo'] == 'true' || json['pagoSemanaActivo'] == '1',
      esPatrocinado: json['esPatrocinado'] == true || json['esPatrocinado'] == 1 || json['esPatrocinado'] == 'true' || json['esPatrocinado'] == '1',
      fuentePatrocinio: json['fuentePatrocinio'],
      enfermedades: json['enfermedades'],
      alergias: json['alergias'],
      tutorNombres: tutorPersona['nombres'],
      tutorApellidos: tutorPersona['apellidos'],
      tutorTelefono: tutorPersona['telefono1'] ?? tutorPersona['telefono2'],
    );
  }

  Infante copyWith({
    String? fotoUrl,
    String? nombres,
    String? apellidos,
    String? cedula,
    String? fechaNacimiento,
    String? telefono1,
    String? telefono2,
    String? email,
    String? direccion,
    String? ubicacionGps,
    String? grupo,
    String? tarifaDiaria,
    double? deudaTotal,
    bool? pagoMesActivo,
    bool? pagoSemanaActivo,
    bool? esPatrocinado,
    String? fuentePatrocinio,
    String? enfermedades,
    String? alergias,
    String? tutorNombres,
    String? tutorApellidos,
    String? tutorTelefono,
  }) {
    return Infante(
      id: id,
      codigo: codigo,
      nombres: nombres ?? this.nombres,
      apellidos: apellidos ?? this.apellidos,
      cedula: cedula ?? this.cedula,
      fechaNacimiento: fechaNacimiento ?? this.fechaNacimiento,
      telefono1: telefono1 ?? this.telefono1,
      telefono2: telefono2 ?? this.telefono2,
      email: email ?? this.email,
      direccion: direccion ?? this.direccion,
      ubicacionGps: ubicacionGps ?? this.ubicacionGps,
      grupo: grupo ?? this.grupo,
      fotoUrl: fotoUrl ?? this.fotoUrl,
      tarifaDiaria: tarifaDiaria ?? this.tarifaDiaria,
      deudaTotal: deudaTotal ?? this.deudaTotal,
      pagoMesActivo: pagoMesActivo ?? this.pagoMesActivo,
      pagoSemanaActivo: pagoSemanaActivo ?? this.pagoSemanaActivo,
      esPatrocinado: esPatrocinado ?? this.esPatrocinado,
      fuentePatrocinio: fuentePatrocinio ?? this.fuentePatrocinio,
      enfermedades: enfermedades ?? this.enfermedades,
      alergias: alergias ?? this.alergias,
      tutorNombres: tutorNombres ?? this.tutorNombres,
      tutorApellidos: tutorApellidos ?? this.tutorApellidos,
      tutorTelefono: tutorTelefono ?? this.tutorTelefono,
    );
  }
}
