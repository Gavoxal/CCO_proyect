class User {
  final int id;
  final String username;
  final String rol;
  final String nombre;
  final String? fotoUrl;

  User({
    required this.id,
    required this.username,
    required this.rol,
    required this.nombre,
    this.fotoUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      rol: json['rol'],
      nombre: json['nombre'],
      fotoUrl: json['fotoUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'rol': rol,
      'nombre': nombre,
      'fotoUrl': fotoUrl,
    };
  }
}
