import * as crypto from 'crypto';

export class EncryptionUtil {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly IV_LENGTH = 12;
    private static readonly AUTH_TAG_LENGTH = 16;

    // In a real app, this should be loaded from environment variables
    // and strictly kept secret.
    // For this demo, we'll use a hardcoded key if env is missing, BUT THIS IS NOT SECURE FOR PRODUCTION.
    private static getKey(): Buffer {
        const key = process.env.ENCRYPTION_KEY || 'default-insecure-key-32-chars!!';
        return crypto.scryptSync(key, 'salt', 32);
    }

    static encrypt(text: string): string {
        const iv = crypto.randomBytes(this.IV_LENGTH);
        const key = this.getKey();
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }

    static decrypt(text: string): string {
        const parts = text.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format');
        }

        const [ivHex, authTagHex, encryptedHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const key = this.getKey();

        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString('utf8');
    }
}
