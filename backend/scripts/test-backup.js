import 'dotenv/config';
import { backupService } from '../src/services/backup.service.js';

async function testBackup() {
    console.log('--- TEST DE RESPALDO MANUAL ---');
    try {
        const results = await backupService.runFullBackup();
        console.log('\n✅ Prueba completada con éxito.');
        console.log('Archivo BD:', results.dbPath);
        console.log('Archivo Archivos:', results.filesPath);
        
        console.log('\nPor favor, verifica que los archivos existan en la carpeta "backend/backups/".');
    } catch (error) {
        console.error('\n❌ La prueba falló.');
        console.error('Error:', error.message);
        console.log('\nConsejo: Asegúrate de que "mysqldump" y "tar" estén instalados y en el PATH de tu sistema.');
    }
}

testBackup();
