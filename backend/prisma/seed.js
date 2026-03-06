import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Ejecutando seed de base de datos...')

    // ── Usuario administrador ──────────────────────────────────────────
    const adminPassword = await bcrypt.hash('Admin2026!', 12)

    const adminPersona = await prisma.persona.upsert({
        where: { cedula: '1100000001' },
        update: {},
        create: {
            nombres: 'Administrador',
            apellidos: 'Principal',
            cedula: '1100000001',
            telefono1: '0990000001',
            email: 'admin@cco.org'
        }
    })

    await prisma.usuario.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@cco.org',
            password: adminPassword,
            rol: 'admin',
            activo: true,
            personaId: adminPersona.id
        }
    })

    // ── Usuario Secretaría ──────────────────────────────────────────
    const sarPass = await bcrypt.hash('Secretaria2026!', 12)

    const sarPersona = await prisma.persona.upsert({
        where: { cedula: '1100000002' },
        update: {},
        create: {
            nombres: 'Sara',
            apellidos: 'Secretaria',
            cedula: '1100000002',
            telefono1: '0990000002',
            email: 'secretaria@cco.org'
        }
    })

    await prisma.usuario.upsert({
        where: { username: 'secretaria' },
        update: {},
        create: {
            username: 'secretaria',
            email: 'secretaria@cco.org',
            password: sarPass,
            rol: 'secretaria',
            activo: true,
            personaId: sarPersona.id
        }
    })

    // ── Tutor de ejemplo ────────────────────────────────────────────
    const tutorPersona = await prisma.persona.upsert({
        where: { cedula: '1100000003' },
        update: {},
        create: {
            nombres: 'Tutor',
            apellidos: 'Ejemplo',
            cedula: '1100000003',
            telefono1: '0990000003',
            email: 'tutor@cco.org'
        }
    })

    const tutor = await prisma.tutor.upsert({
        where: { codigo: 'TUT-001' },
        update: {},
        create: {
            codigo: 'TUT-001',
            profesion: 'Educador',
            personaId: tutorPersona.id
        }
    })

    const tutorPass = await bcrypt.hash('Tutor2026!', 12)
    await prisma.usuario.upsert({
        where: { username: 'tutor1' },
        update: {},
        create: {
            username: 'tutor1',
            email: 'tutor@cco.org',
            password: tutorPass,
            rol: 'tutor',
            activo: true,
            personaId: tutorPersona.id
        }
    })

    // ── Material de inventario de ejemplo ──────────────────────────
    await prisma.inventarioMaterial.upsert({
        where: { codigo: 'MAT-001' },
        update: {},
        create: {
            codigo: 'MAT-001',
            nombreMaterial: 'Hojas de papel bond (resma)',
            cantidadDisponible: 10,
            stockMinimo: 3,
            fechaUltimaActualizacion: new Date(),
            fuenteRecurso: 'Compassion',
            categoria: 'Papelería'
        }
    })

    console.log('✅ Seed ejecutado exitosamente.')
    console.log('')
    console.log('Credenciales de acceso:')
    console.log('  Admin:      admin       / Admin2026!')
    console.log('  Secretaría: secretaria  / Secretaria2026!')
    console.log('  Tutor:      tutor1      / Tutor2026!')
}

main()
    .catch(e => { console.error('Error en seed:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
