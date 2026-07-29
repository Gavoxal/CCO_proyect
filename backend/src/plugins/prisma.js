import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import { encryptionService } from '../services/encryption.service.js'

const basePrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
})

/**
 * Extensión de Prisma para manejar encriptación automática de campos sensibles.
 */
const prisma = basePrisma.$extends({
    query: {
        persona: {
            async create({ args, query }) {
                if (args.data.cedula) {
                    args.data.cedulaHash = encryptionService.generateBlindIndex(args.data.cedula);
                    args.data.cedula = encryptionService.encrypt(args.data.cedula);
                }
                if (args.data.telefono1) args.data.telefono1 = encryptionService.encrypt(args.data.telefono1);
                if (args.data.telefono2) args.data.telefono2 = encryptionService.encrypt(args.data.telefono2);
                if (args.data.direccion) args.data.direccion = encryptionService.encrypt(args.data.direccion);
                if (args.data.ubicacionGps) args.data.ubicacionGps = encryptionService.encrypt(args.data.ubicacionGps);
                return query(args);
            },
            async update({ args, query }) {
                if (args.data.cedula && typeof args.data.cedula === 'string') {
                    args.data.cedulaHash = encryptionService.generateBlindIndex(args.data.cedula);
                    args.data.cedula = encryptionService.encrypt(args.data.cedula);
                }
                if (args.data.telefono1 && typeof args.data.telefono1 === 'string') {
                    args.data.telefono1 = encryptionService.encrypt(args.data.telefono1);
                }
                if (args.data.telefono2 && typeof args.data.telefono2 === 'string') {
                    args.data.telefono2 = encryptionService.encrypt(args.data.telefono2);
                }
                if (args.data.direccion && typeof args.data.direccion === 'string') {
                    args.data.direccion = encryptionService.encrypt(args.data.direccion);
                }
                if (args.data.ubicacionGps && typeof args.data.ubicacionGps === 'string') {
                    args.data.ubicacionGps = encryptionService.encrypt(args.data.ubicacionGps);
                }
                return query(args);
            }
        },
        infante: {
            async create({ args, query }) {
                if (args.data.enfermedades) args.data.enfermedades = encryptionService.encrypt(args.data.enfermedades);
                if (args.data.alergias) args.data.alergias = encryptionService.encrypt(args.data.alergias);
                return query(args);
            },
            async update({ args, query }) {
                if (args.data.enfermedades && typeof args.data.enfermedades === 'string') {
                    args.data.enfermedades = encryptionService.encrypt(args.data.enfermedades);
                }
                if (args.data.alergias && typeof args.data.alergias === 'string') {
                    args.data.alergias = encryptionService.encrypt(args.data.alergias);
                }
                return query(args);
            }
        }
    },
    result: {
        persona: {
            cedula: {
                needs: { cedula: true },
                compute(persona) { return encryptionService.decrypt(persona.cedula); }
            },
            telefono1: {
                needs: { telefono1: true },
                compute(persona) { return encryptionService.decrypt(persona.telefono1); }
            },
            telefono2: {
                needs: { telefono2: true },
                compute(persona) { return encryptionService.decrypt(persona.telefono2); }
            },
            direccion: {
                needs: { direccion: true },
                compute(persona) { return encryptionService.decrypt(persona.direccion); }
            },
            ubicacionGps: {
                needs: { ubicacionGps: true },
                compute(persona) { return encryptionService.decrypt(persona.ubicacionGps); }
            }
        },
        infante: {
            enfermedades: {
                needs: { enfermedades: true },
                compute(infante) { return encryptionService.decrypt(infante.enfermedades); }
            },
            alergias: {
                needs: { alergias: true },
                compute(infante) { return encryptionService.decrypt(infante.alergias); }
            }
        }
    }
});

async function prismaPlugin(fastify) {
    await basePrisma.$connect()
    fastify.decorate('db', prisma)

    fastify.addHook('onClose', async () => {
        await basePrisma.$disconnect()
    })
}

export default fp(prismaPlugin, { name: 'prisma' })
export { prismaPlugin, prisma }
