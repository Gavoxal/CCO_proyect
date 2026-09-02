import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando migración de tarifa a $0.60 y montoPagado en asistencias...');

    try {
        // 1. Actualizar default y valores existentes de tarifaDiaria
        console.log('1. Actualizando tarifaDiaria de infantes a $0.60...');
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE \`infantes\` ALTER COLUMN \`tarifaDiaria\` SET DEFAULT 0.60;`);
        } catch (e) {
            console.log('   (Aviso al alterar default, continuando...):', e.message);
        }
        const updatedInfantes = await prisma.$executeRawUnsafe(`UPDATE \`infantes\` SET \`tarifaDiaria\` = 0.60 WHERE \`tarifaDiaria\` = 0.50;`);
        console.log(`   ✅ Infantes actualizados de $0.50 a $0.60: ${updatedInfantes}`);

        // 2. Verificar y agregar columna montoPagado
        console.log('2. Verificando columna montoPagado en tabla asistencias...');
        const checkColumn = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'asistencias' 
              AND COLUMN_NAME = 'montoPagado';
        `);

        const count = Number(checkColumn[0]?.count || 0);
        if (count === 0) {
            console.log('   Agregando columna montoPagado a asistencias...');
            await prisma.$executeRawUnsafe(`
                ALTER TABLE \`asistencias\` 
                ADD COLUMN \`montoPagado\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER \`estado\`;
            `);
            console.log('   ✅ Columna montoPagado creada exitosamente.');
        } else {
            console.log('   ℹ️ La columna montoPagado ya existe en la tabla asistencias.');
        }

        // 3. Inicializar montoPagado para registros históricos de PagoDia
        console.log('3. Sincronizando registros históricos de PagoDia...');
        const updatedPagos = await prisma.$executeRawUnsafe(`
            UPDATE \`asistencias\` a
            JOIN \`infantes\` i ON a.\`infanteId\` = i.\`id\`
            SET a.\`montoPagado\` = i.\`tarifaDiaria\`
            WHERE a.\`estado\` = 'PagoDia' AND (a.\`montoPagado\` IS NULL OR a.\`montoPagado\` = 0.00);
        `);
        console.log(`   ✅ Registros históricos de PagoDia actualizados: ${updatedPagos}`);

        console.log('\n🎉 ¡Migración completada con éxito!');
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
