import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Probando listar infantes...')
    try {
        const infantes = await prisma.infante.findMany({
            take: 500,
            include: {
                persona: true,
                tutor: { include: { persona: true } },
                visitas: { take: 1, orderBy: { fecha: 'desc' } }
            },
            orderBy: [{ persona: { apellidos: 'asc' } }]
        })
        console.log(`✅ Se encontraron ${infantes.length} infantes sin errores.`)
    } catch (err) {
        console.error('❌ Error al listar infantes:', err)
    }

    console.log('🔍 Probando listar notificaciones...')
    try {
        const notificaciones = await prisma.notificacion.findMany({
            include: { usuario: true }
        })
        console.log(`✅ Se encontraron ${notificaciones.length} notificaciones sin errores.`)
    } catch (err) {
        console.error('❌ Error al listar notificaciones:', err)
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
