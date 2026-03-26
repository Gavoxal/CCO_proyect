import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
})

async function prismaPlugin(fastify) {
    await prisma.$connect()
    fastify.decorate('db', prisma)

    fastify.addHook('onClose', async () => {
        await prisma.$disconnect()
    })
}

export default fp(prismaPlugin, { name: 'prisma' })
export { prismaPlugin, prisma }
