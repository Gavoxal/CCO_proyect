import cron from 'node-cron';
import { backupService } from '../services/backup.service.js';

/**
 * Inicia la tarea programada para respaldos mensuales.
 */
export function startBackupCron() {
    // Programado para el segundo 0, minuto 0, hora 0, día 1 de cada mes
    // Cron: '0 0 1 * *'
    cron.schedule('0 0 1 * *', async () => {
        console.log('[Cron] Ejecutando respaldo mensual programado...');
        try {
            await backupService.runFullBackup();
            console.log('[Cron] Respaldo mensual finalizado correctamente.');
        } catch (error) {
            console.error('[Cron] Error en la ejecución del respaldo mensual:', error);
        }
    });

    console.log('📅 Tarea de respaldos mensuales programada (1ro de cada mes a las 00:00)');
}
