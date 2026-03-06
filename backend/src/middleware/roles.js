/**
 * Middleware factory para autorización por roles.
 * Uso: { preHandler: requireRoles('admin', 'director') }
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
    SOLO_ADMINS: ['admin', 'director'],
    ESCRITURA: ['admin', 'director', 'secretaria'],
    TUTORES: ['admin', 'director', 'secretaria', 'tutor_especial', 'tutor'],
    TODOS: ['admin', 'director', 'secretaria', 'tutor_especial', 'tutor']
}
