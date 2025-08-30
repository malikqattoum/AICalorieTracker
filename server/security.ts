import crypto from 'crypto';
import { ENCRYPTION_KEY } from './config';

// HIPAA-compliant data encryption
export function encryptPHI(text: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + authTag.toString('hex');
}

export function decryptPHI(text: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const [ivHex, encryptedHex, authTagHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// Audit logging
export function createAuditLog(userId: number, action: string, entity: string) {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT] ${timestamp} - User ${userId} ${action} ${entity}`);
  // In production, write to secure audit log storage
}