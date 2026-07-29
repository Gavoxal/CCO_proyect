import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { encryptionService } from '../src/services/encryption.service.js';

const prisma = new PrismaClient();

async function migrate() {
    console.log('--- INICIANDO MIGRACIÓN DE ENCRIPTACIÓN ---');
    
    try {
        // 1. Migrar Personas
        const personas = await prisma.persona.findMany();
        console.log(`Encontradas ${personas.length} personas.`);

        for (const persona of personas) {
            const updates = {};
            
            // Solo encriptar si no está ya en formato encriptado (iv:authTag:data)
            if (persona.cedula && !persona.cedula.includes(':')) {
                updates.cedula = encryptionService.encrypt(persona.cedula);
                updates.cedulaHash = encryptionService.generateBlindIndex(persona.cedula);
            } else if (persona.cedula && !persona.cedulaHash) {
                // Si ya está encriptada pero falta el hash (caso raro), intentamos recuperar hash si es posible o el dato desencriptado
                const plain = encryptionService.decrypt(persona.cedula);
                updates.cedulaHash = encryptionService.generateBlindIndex(plain);
            }

            if (persona.telefono1 && !persona.telefono1.includes(':')) {
                updates.telefono1 = encryptionService.encrypt(persona.telefono1);
            }
            if (persona.telefono2 && !persona.telefono2.includes(':')) {
                updates.telefono2 = encryptionService.encrypt(persona.telefono2);
            }
            if (persona.direccion && !persona.direccion.includes(':')) {
                updates.direccion = encryptionService.encrypt(persona.direccion);
            }
            if (persona.ubicacionGps && !persona.ubicacionGps.includes(':')) {
                updates.ubicacionGps = encryptionService.encrypt(persona.ubicacionGps);
            }

            if (Object.keys(updates).length > 0) {
                await prisma.persona.update({
                    where: { id: persona.id },
                    data: updates
                });
                console.log(`[Persona ID ${persona.id}] Datos encriptados correctamente.`);
            }
        }

        // 2. Migrar Infantes
        const infantes = await prisma.infante.findMany();
        console.log(`\nEncontrados ${infantes.length} infantes.`);

        for (const infante of infantes) {
            const updates = {};
            
            if (infante.enfermedades && !infante.enfermedades.includes(':')) {
                updates.enfermedades = encryptionService.encrypt(infante.enfermedades);
            }
            if (infante.alergias && !infante.alergias.includes(':')) {
                updates.alergias = encryptionService.encrypt(infante.alergias);
            }

            if (Object.keys(updates).length > 0) {
                await prisma.infante.update({
                    where: { id: infante.id },
                    data: updates
                });
                console.log(`[Infante ID ${infante.id}] Datos médicos encriptados correctamente.`);
            }
        }

        console.log('\n✅ MIGRACIÓN FINALIZADA CON ÉXITO.');
    } catch (error) {
        console.error('\n❌ ERROR DURANTE LA MIGRACIÓN:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
