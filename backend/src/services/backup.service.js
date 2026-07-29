import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Servicio encargado de gestionar los respaldos del sistema.
 */
export class BackupService {
    constructor() {
        this.backupDir = path.resolve(process.cwd(), 'backups');
        this.dbBackupDir = path.join(this.backupDir, 'database');
        this.filesBackupDir = path.join(this.backupDir, 'uploads');
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir);
        if (!fs.existsSync(this.dbBackupDir)) fs.mkdirSync(this.dbBackupDir, { recursive: true });
        if (!fs.existsSync(this.filesBackupDir)) fs.mkdirSync(this.filesBackupDir, { recursive: true });
    }

    /**
     * Parsea la URL de la base de datos para obtener credenciales de MySQL.
     */
    getDatabaseConfig() {
        const url = process.env.DATABASE_URL;
        if (!url) throw new Error('DATABASE_URL no definida en .env');

        // Formato esperado: mysql://user:pass@host:port/database
        const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
        const match = url.match(regex);

        if (!match) throw new Error('Formato de DATABASE_URL no soportado para respaldos');

        return {
            user: match[1],
            password: match[2],
            host: match[3],
            port: match[4],
            database: match[5]
        };
    }

    /**
     * Crea un respaldo de la base de datos MySQL.
     */
    async createDatabaseBackup() {
        const config = this.getDatabaseConfig();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${config.database}-${timestamp}.sql`;
        const filePath = path.join(this.dbBackupDir, fileName);

        const dumpPath = process.env.MYSQLDUMP_PATH || 'mysqldump';
        // NOTA: Requiere que 'mysqldump' esté en el PATH o se defina MYSQLDUMP_PATH en .env
        const command = `"${dumpPath}" -h ${config.host} -P ${config.port} -u ${config.user} -p${config.password} ${config.database} > "${filePath}"`;

        try {
            console.log(`[Backup] Iniciando respaldo de BD: ${fileName}...`);
            await execPromise(command);
            console.log(`[Backup] Respaldo de BD completado con éxito: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('[Backup] Error al crear respaldo de BD:', error);
            throw error;
        }
    }

    /**
     * Crea un archivo comprimido de la carpeta de subidas.
     */
    async createFilesBackup() {
        const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `uploads-backup-${timestamp}.tar.gz`;
        const filePath = path.join(this.filesBackupDir, fileName);

        if (!fs.existsSync(uploadDir)) {
            console.warn(`[Backup] Directorio de subidas no encontrado: ${uploadDir}`);
            return null;
        }

        // Usamos 'tar' que viene por defecto en Windows 10/11 y Linux
        const command = `tar -czvf "${filePath}" -C "${path.dirname(uploadDir)}" "${path.basename(uploadDir)}"`;

        try {
            console.log(`[Backup] Iniciando respaldo de archivos: ${fileName}...`);
            await execPromise(command);
            console.log(`[Backup] Respaldo de archivos completado: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('[Backup] Error al crear respaldo de archivos:', error);
            throw error;
        }
    }

    /**
     * Ejecuta el proceso completo de respaldo.
     */
    async runFullBackup() {
        console.log('--- INICIANDO PROCESO DE RESPALDO TOTAL ---');
        try {
            const dbPath = await this.createDatabaseBackup();
            const filesPath = await this.createFilesBackup();
            console.log('--- PROCESO DE RESPALDO FINALIZADO CON ÉXITO ---');
            return { dbPath, filesPath };
        } catch (error) {
            console.error('--- ERROR EN EL PROCESO DE RESPALDO ---');
            throw error;
        }
    }
}

export const backupService = new BackupService();
