import { api } from './api';

export const taxService = {
  async calculateTax(invoiceLines, customerState = null) {
    try {
      const response = await api.post('/tax/calculate', {
        invoiceLines,
        customerState
      });
      return response.data.data;
    } catch (error) {
      console.error('Tax calculation failed:', error);
      throw error;
    }
  },
  
  async getTaxRates() {
    try {
      const response = await api.get('/tax/rates');
      return response.data.data;
    } catch (error) {
      console.error('Failed to load tax rates:', error);
      return [
        { code: 'GST_0', rate: 0, display: 'Exempt' },
        { code: 'GST_5', rate: 5, display: '5%' },
        { code: 'GST_12', rate: 12, display: '12%' },
        { code: 'GST_18', rate: 18, display: '18%' },
        { code: 'GST_28', rate: 28, display: '28%' }
      ];
    }
  },
  
  async validateGSTNumber(gstNumber) {
    try {
      const response = await api.post('/tax/validate-gst', { gstNumber });
      return response.data.data;
    } catch (error) {
      console.error('GST validation failed:', error);
      return { valid: false };
    }
  },
  
  async checkTaxExemptions(invoiceData) {
    try {
      const response = await api.post('/tax/exemptions', invoiceData);
      return response.data.data;
    } catch (error) {
      console.error('Tax exemption check failed:', error);
      return { exempt: false };
    }
  },
  
  // Client-side tax calculation for offline mode
  calculateGSTOffline(baseAmount, gstRate, isInclusive = false) {
    const roundToNearestPaisa = (amount) => Math.round(amount * 100) / 100;
    
    if (gstRate === 0) {
      return {
        baseAmount: roundToNearestPaisa(baseAmount),
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        totalAmount: roundToNearestPaisa(baseAmount)
      };
    }
    
    let taxableAmount, totalTax;
    
    if (isInclusive) {
      taxableAmount = baseAmount / (1 + gstRate / 100);
      totalTax = baseAmount - taxableAmount;
    } else {
      taxableAmount = baseAmount;
      totalTax = (baseAmount * gstRate) / 100;
    }
    
    const cgst = roundToNearestPaisa(totalTax / 2);
    const sgst = roundToNearestPaisa(totalTax / 2);
    
    return {
      baseAmount: roundToNearestPaisa(taxableAmount),
      cgst,
      sgst,
      igst: 0,
      totalTax: roundToNearestPaisa(totalTax),
      totalAmount: roundToNearestPaisa(taxableAmount + totalTax)
    };
  }
};