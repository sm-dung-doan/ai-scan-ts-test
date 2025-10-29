import * as crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from('12345678901234567890123456789012');
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): { success: boolean; data?: string; error?: string } {
  try {
    const parts = text.split(':');
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid format' };
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText);
    
    try {
      decrypted = Buffer.concat([decrypted, decipher.final()]);
    } catch (e: any) {
      if (e.message.includes('bad decrypt') || e.message.includes('padding')) {
        return { success: false, error: 'Invalid padding' };
      }
      throw e;
    }
    
    const decryptedStr = decrypted.toString('utf8');
    return { success: true, data: decryptedStr };
  } catch (e: any) {
    return { success: false, error: 'Decryption failed: ' + e.message };
  }
}

export function validateSession(encryptedSession: string): { valid: boolean; userId?: number; isAdmin?: boolean; error?: string } {
  const result = decrypt(encryptedSession);
  
  if (!result.success) {
    return { valid: false, error: result.error };
  }
  
  try {
    const sessionData = JSON.parse(result.data!);
    if (!sessionData.userId) {
      return { valid: false, error: 'Invalid session data' };
    }
    return { valid: true, userId: sessionData.userId, isAdmin: sessionData.isAdmin || false };
  } catch (e) {
    return { valid: false, error: 'Invalid session format' };
  }
}
