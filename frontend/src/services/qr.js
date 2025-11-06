// QR code service for generating and validating signed tokens

class QRService {
  async generateQR(type, id) {
    try {
      const response = await fetch('/api/v1/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ type, id })
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data.token;
      } else {
        throw new Error(data.error.message);
      }
    } catch (error) {
      console.error('QR generation failed:', error);
      throw error;
    }
  }

  async validateQR(token) {
    try {
      const response = await fetch('/api/v1/qr/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error.message);
      }
    } catch (error) {
      console.error('QR validation failed:', error);
      throw error;
    }
  }

  getAccessToken() {
    // Get from auth context or localStorage
    return localStorage.getItem('accessToken');
  }

  // Generate QR code for product
  async generateProductQR(productId) {
    return await this.generateQR('product', productId);
  }

  // Generate QR code for invoice
  async generateInvoiceQR(invoiceId) {
    return await this.generateQR('invoice', invoiceId);
  }

  // Validate scanned QR code
  async scanQR(qrData) {
    return await this.validateQR(qrData);
  }
}

export default new QRService();