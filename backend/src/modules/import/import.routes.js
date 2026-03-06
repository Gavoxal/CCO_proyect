import { requireRoles, ROLES } from '../../middleware/roles.js'
import { importarInfantes, importarRegalos } from './import.controller.js'

export default async function importRoutes(fastify) {
    const escritura = { preHandler: [requireRoles(...ROLES.ESCRITURA)] }

    // POST /import/infantes  — sube Excel/CSV de infantes
    fastify.post('/infantes', escritura, importarInfantes)
    // POST /import/regalos   — sube Excel/CSV de estado de regalos/kits
    fastify.post('/regalos', escritura, importarRegalos)
}
