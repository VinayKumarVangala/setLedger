const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.sensitiveFields = [
      'password', 'totpSecret', 'fcmToken', 'gstin', 'phone', 'email',
      'customerGSTIN', 'customerPhone', 'customerEmail', 'bankAccount'
    ];
  }

  encrypt(text) {
    if (!text) return text;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('setLedger', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData === 'string') return encryptedData;
    
    try {
      const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
      decipher.setAAD(Buffer.from('setLedger', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  encryptObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const encrypted = { ...obj };
    
    for (const field of this.sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    }
    
    // Handle nested objects
    for (const key in encrypted) {
      if (typeof encrypted[key] === 'object' && encrypted[key] !== null) {
        encrypted[key] = this.encryptObject(encrypted[key]);
      }
    }
    
    return encrypted;
  }

  decryptObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const decrypted = { ...obj };
    
    for (const field of this.sensitiveFields) {
      if (decrypted[field]) {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    }
    
    // Handle nested objects
    for (const key in decrypted) {
      if (typeof decrypted[key] === 'object' && decrypted[key] !== null) {
        decrypted[key] = this.decryptObject(decrypted[key]);
      }
    }
    
    return decrypted;
  }

  hashSensitiveData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

module.exports = new EncryptionService();