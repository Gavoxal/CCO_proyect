/**
 * Middleware factory para autorización por roles.
 * Uso: { preHandler: [requireRoles('admin', 'director')] }
 */
export const requireRoles = (...roles) => {
    return async function (request, reply) {
        try {
            await request.jwtVerify()
        } catch {
            return reply.status(401).send({ error: 'Token inválido o expirado' })
        }

        if (!roles.includes(request.user.rol)) {
            return reply.status(403).send({
                error: 'Acceso denegado',
                message: `Este endpoint requiere uno de los siguientes roles: ${roles.join(', ')}`
            })
        }
    }
}

// Roles predefinidos para reutilizar en rutas
export const ROLES = {
    // Control total del sistema (admin, director, protección)
    SUPER_ADMINS: ['admin', 'director', 'proteccion'],

    // Pueden leer, crear y editar cualquier registro
    ESCRITURA: ['admin', 'director', 'proteccion', 'secretaria'],

    // Todos los usuarios autenticados
    TODOS: ['admin', 'director', 'proteccion', 'secretaria', 'tutor_especial', 'tutor'],

    // Gestión de inventario de materiales
    INVENTARIO: ['admin', 'director', 'proteccion', 'secretaria', 'tutor_especial'],

    // Pueden VER los reportes de incidentes
    INCIDENTES_VER: ['admin', 'director', 'proteccion', 'secretaria'],

    // Pueden CREAR reportes de incidentes (todos)
    INCIDENTES_CREAR: ['admin', 'director', 'proteccion', 'secretaria', 'tutor_especial', 'tutor'],
}
