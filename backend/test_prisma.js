import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function test() {
    const fecha = '2026-04-07'
    const fechaDate = new Date(fecha + 'T00:00:00.000Z')
    const registros = [{ infanteId: 1, estado: 'Presente' }]

    try {
        console.log('Fetching infants...')
        const todosLosInfantes = await db.infante.findMany({
            take: 10,
            select: { id: true }
        })
        console.log(`Found ${todosLosInfantes.length} infants`)

        const registrosMap = new Map(registros.map(r => [r.infanteId, r.estado]))

        const ops = todosLosInfantes.map(infante => {
            const estado = registrosMap.get(infante.id) || 'Ausente'
            return db.asistencia.upsert({
                where: {
                    infanteId_fecha: { infanteId: infante.id, fecha: fechaDate }
                },
                update: { estado },
                create: { infanteId: infante.id, fecha: fechaDate, estado }
            })
        })

        console.log('Running transaction...')
        const resultado = await db.$transaction(ops)
        console.log('Success:', resultado.length)
    } catch (e) {
        console.error('FAIL:', e)
    } finally {
        await db.$disconnect()
    }
}

test()
