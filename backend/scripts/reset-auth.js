import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Iniciando reseteo de credenciales...')

    // 1. Resetear contraseña de 'admin'
    const adminPassword = await bcrypt.hash('Admin2026!', 12)
    
    // Verificamos si existe el usuario admin
    const existingAdmin = await prisma.usuario.findUnique({
        where: { username: 'admin' }
    })

    if (existingAdmin) {
        await prisma.usuario.update({
            where: { username: 'admin' },
            data: {
                password: adminPassword,
                activo: true
            }
        })
        console.log('✅ Contraseña de "admin" actualizada a: Admin2026!')
    } else {
        console.log('⚠️ Usuario "admin" no encontrado. Creándolo...')
        // Crear persona para admin si no existe
        const adminPersona = await prisma.persona.upsert({
            where: { cedula: '1100000001' },
            update: {},
            create: {
                nombres: 'Administrador',
                apellidos: 'Principal',
                cedula: '1100000001',
                email: 'admin@cco.org'
            }
        })

        await prisma.usuario.create({
            data: {
                username: 'admin',
                email: 'admin@cco.org',
                password: adminPassword,
                rol: 'admin',
                activo: true,
                personaId: adminPersona.id
            }
        })
        console.log('✅ Usuario "admin" creado con contraseña: Admin2026!')
    }

    // 2. Crear usuario de respaldo 'admin_vias'
    const backupPassword = await bcrypt.hash('Vias2026!', 12)
    
    const backupPersona = await prisma.persona.upsert({
        where: { cedula: '1100000005' },
        update: {},
        create: {
            nombres: 'Admin',
            apellidos: 'Vias',
            cedula: '1100000005',
            email: 'vias@cco.org'
        }
    })

    await prisma.usuario.upsert({
        where: { username: 'admin_vias' },
        update: {
            password: backupPassword,
            activo: true
        },
        create: {
            username: 'admin_vias',
            email: 'vias@cco.org',
            password: backupPassword,
            rol: 'admin',
            activo: true,
            personaId: backupPersona.id
        }
    })
    console.log('✅ Usuario "admin_vias" (repaldo) listo con contraseña: Vias2026!')

    console.log('\n✨ Proceso completado exitosamente.')
}

main()
    .catch(e => {
        console.error('❌ Error durante el reseteo:', e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
