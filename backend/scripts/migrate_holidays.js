import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FERIADOS_ECUADOR = [
    { titulo: '🇪🇨 Año Nuevo', fechaInicio: new Date(2026, 0, 1, 0, 0, 0), fechaFin: new Date(2026, 0, 1, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Día de Año Nuevo.' },
    { titulo: '🎭 Carnaval (Lunes)', fechaInicio: new Date(2026, 1, 16, 0, 0, 0), fechaFin: new Date(2026, 1, 16, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Lunes de Carnaval.' },
    { titulo: '🎭 Carnaval (Martes)', fechaInicio: new Date(2026, 1, 17, 0, 0, 0), fechaFin: new Date(2026, 1, 17, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Martes de Carnaval.' },
    { titulo: '✝️ Viernes Santo', fechaInicio: new Date(2026, 3, 3, 0, 0, 0), fechaFin: new Date(2026, 3, 3, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Viernes Santo.' },
    { titulo: '👷 Día del Trabajo', fechaInicio: new Date(2026, 4, 1, 0, 0, 0), fechaFin: new Date(2026, 4, 1, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Día Internacional del Trabajo.' },
    { titulo: '⚔️ Batalla de Pichincha', fechaInicio: new Date(2026, 4, 24, 0, 0, 0), fechaFin: new Date(2026, 4, 24, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Batalla de Pichincha (1822).' },
    { titulo: '🇪🇨 Primer Grito de Independencia', fechaInicio: new Date(2026, 7, 10, 0, 0, 0), fechaFin: new Date(2026, 7, 10, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Primer Grito de Independencia de Quito (1809).' },
    { titulo: '🇪🇨 Independencia de Guayaquil', fechaInicio: new Date(2026, 9, 9, 0, 0, 0), fechaFin: new Date(2026, 9, 9, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Independencia de Guayaquil (1820).' },
    { titulo: '💀 Día de los Difuntos', fechaInicio: new Date(2026, 10, 2, 0, 0, 0), fechaFin: new Date(2026, 10, 2, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Día de los Difuntos.' },
    { titulo: '🇪🇨 Independencia de Cuenca', fechaInicio: new Date(2026, 10, 3, 0, 0, 0), fechaFin: new Date(2026, 10, 3, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Independencia de Cuenca (1820).' },
    { titulo: '🎄 Navidad', fechaInicio: new Date(2026, 11, 25, 0, 0, 0), fechaFin: new Date(2026, 11, 25, 23, 59, 59), tipo: 'Feriado', descripcion: 'Feriado nacional — Navidad.' },
];

async function main() {
    console.log('Migrando feriados...');
    for (const h of FERIADOS_ECUADOR) {
        // Verificar si existe antes de crear para evitar duplicados si se corre dos veces
        const existe = await prisma.evento.findFirst({
            where: { titulo: h.titulo, fechaInicio: h.fechaInicio }
        });
        
        if (!existe) {
            await prisma.evento.create({
                data: {
                    ...h,
                    notificar: false
                }
            });
            console.log(`- Creado: ${h.titulo}`);
        } else {
            console.log(`- Ya existe: ${h.titulo}`);
        }
    }
    console.log('Finalizado.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
