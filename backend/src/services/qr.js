const crypto = require('crypto');

class QRTokenService {
  constructor() {
    this.secret = process.env.QR_HMAC_SECRET || 'your-qr-secret-key';
  }

  // Generate compact signed token
  generateToken(id, orgUUID, type = 'product') {
    const payload = `${id}:${orgUUID}:${type}:${Date.now()}`;
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(payload);
    const signature = hmac.digest('hex').substring(0, 16); // First 16 chars
    
    return `${Buffer.from(payload).toString('base64')}.${signature}`;
  }

  // Validate and decode token
  validateToken(token) {
    try {
      const [encodedPayload, signature] = token.split('.');
      if (!encodedPayload || !signature) {
        throw new Error('Invalid token format');
      }

      const payload = Buffer.from(encodedPayload, 'base64').toString('utf8');
      
      // Verify HMAC signature
      const hmac = crypto.createHmac('sha256', this.secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex').substring(0, 16);
      
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      const [id, orgUUID, type, timestamp] = payload.split(':');
      
      // Check token age (24 hours max)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 24 * 60 * 60 * 1000) {
        throw new Error('Token expired');
      }

      return { id, orgUUID, type, timestamp: parseInt(timestamp) };
    } catch (error) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  // Generate QR data for products
  generateProductQR(product) {
    return this.generateToken(product.id, product.organizationId, 'product');
  }

  // Generate QR data for invoices
  generateInvoiceQR(invoice) {
    return this.generateToken(invoice.id, invoice.organizationId, 'invoice');
  }
}

module.exports = new QRTokenService();