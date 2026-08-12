class User {
  final int id;
  final String username;
  final String rol;
  final String nombre;

  User({
    required this.id,
    required this.username,
    required this.rol,
    required this.nombre,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      username: json['username'],
      rol: json['rol'],
      nombre: json['nombre'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'rol': rol,
      'nombre': nombre,
    };
  }
}
