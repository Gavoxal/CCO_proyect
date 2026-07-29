import crypto from 'crypto';

/**
 * Servicio de Encriptación para datos sensibles (AES-256-GCM).
 * Incluye soporte para Blind Index (Hasing para búsquedas).
 */
export class EncryptionService {
    constructor() {
        const key = process.env.ENCRYPTION_KEY;
        const salt = process.env.ENCRYPTION_SALT || 'default-salt-cco-kidscam';

        if (!key || key.length !== 64) {
            // En desarrollo generamos una si no existe, pero advertimos
            if (process.env.NODE_ENV === 'production') {
                throw new Error('ENCRYPTION_KEY de 32 bytes (64 caracteres hex) es requerida en producción');
            }
            this.key = Buffer.from('f3f225df87621c565f425f171887e2b1704e6c98f58693c66041c2c3666504a3', 'hex');
        } else {
            this.key = Buffer.from(key, 'hex');
        }

        this.algorithm = 'aes-256-gcm';
        this.salt = salt;
    }

    /**
     * Encripta una cadena de texto.
     * Retorna un formato: iv:authTag:encryptedData
     */
    encrypt(text) {
        if (!text) return text;
        
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag().toString('hex');
        
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * Desencripta una cadena generada por el método encrypt.
     */
    decrypt(encryptedText) {
        if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

        try {
            const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');
            
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('[Encryption] Error al desencriptar:', error.message);
            // Si falla la desencriptación, podría ser que el dato no está encriptado (migración pendiente)
            return encryptedText;
        }
    }

    /**
     * Genera un Blind Index (Hash) para búsquedas exactas sobre datos encriptados.
     */
    generateBlindIndex(text) {
        if (!text) return null;
        return crypto
            .createHmac('sha256', this.salt)
            .update(text.toString().trim())
            .digest('hex');
    }
}

export const encryptionService = new EncryptionService();
