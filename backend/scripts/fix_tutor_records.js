import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando corrección de perfiles de tutor ---');
    
    // Roles que deben tener un perfil de tutor
    const tutorRoles = ['tutor', 'tutor_especial', 'proteccion'];
    
    const usuarios = await prisma.usuario.findMany({
        where: {
            rol: { in: tutorRoles },
            activo: true,
            personaId: { not: null }
        },
        include: {
            persona: {
                include: { tutor: true }
             }
        }
    });
    
    console.log(`Encontrados ${usuarios.length} usuarios con roles de tutor/protección.`);
    
    let creados = 0;
    for (const u of usuarios) {
        if (!u.persona.tutor) {
            console.log(`CREANDO perfil de tutor para: ${u.username} (${u.rol})`);
            await prisma.tutor.create({
                data: {
                    personaId: u.personaId,
                    codigo: `TUT-${Date.now().toString().slice(-6)}-${u.id}`,
                    profesion: 'Asignado automáticamente',
                }
            });
            creados++;
        } else {
            console.log(`Perfil de tutor ya existe para: ${u.username}`);
        }
    }
    
    console.log(`--- Proceso completado. Perfiles creados: ${creados} ---`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
