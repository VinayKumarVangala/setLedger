const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TaxEngine {
  static GST_RATES = {
    EXEMPT: 0,
    GST_0: 0,
    GST_5: 5,
    GST_12: 12,
    GST_18: 18,
    GST_28: 28
  };
  
  static roundToNearestPaisa(amount) {
    // Indian legal standard: round to nearest paisa (0.01)
    return Math.round(amount * 100) / 100;
  }
  
  static calculateGST(baseAmount, gstRate, isInclusive = false) {
    if (gstRate === 0) {
      return {
        baseAmount: this.roundToNearestPaisa(baseAmount),
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        totalAmount: this.roundToNearestPaisa(baseAmount)
      };
    }
    
    let taxableAmount, totalTax, cgst, sgst, igst;
    
    if (isInclusive) {
      // Tax inclusive: extract tax from total
      taxableAmount = baseAmount / (1 + gstRate / 100);
      totalTax = baseAmount - taxableAmount;
    } else {
      // Tax exclusive: add tax to base
      taxableAmount = baseAmount;
      totalTax = (baseAmount * gstRate) / 100;
    }
    
    // For intra-state: CGST + SGST (split equally)
    // For inter-state: IGST (full rate)
    cgst = this.roundToNearestPaisa(totalTax / 2);
    sgst = this.roundToNearestPaisa(totalTax / 2);
    igst = this.roundToNearestPaisa(totalTax);
    
    return {
      baseAmount: this.roundToNearestPaisa(taxableAmount),
      cgst,
      sgst,
      igst: 0, // Default to intra-state
      totalTax: this.roundToNearestPaisa(totalTax),
      totalAmount: this.roundToNearestPaisa(taxableAmount + totalTax)
    };
  }
  
  static async calculateInvoiceTax(orgId, invoiceLines, customerState = null) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true }
    });
    
    const orgState = org?.settings?.state || 'DEFAULT';
    const isInterState = customerState && customerState !== orgState;
    
    let totalBaseAmount = 0;
    let totalTaxAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    const lineCalculations = [];
    
    for (const line of invoiceLines) {
      const product = await prisma.product.findUnique({
        where: { id: line.productId },
        select: { 
          gstRate: true, 
          isGSTInclusive: true,
          exemptFromGST: true,
          hsnCode: true
        }
      });
      
      if (!product) continue;
      
      const lineAmount = line.quantity * line.price;
      let gstRate = product.exemptFromGST ? 0 : (product.gstRate || 18);
      
      const taxCalc = this.calculateGST(
        lineAmount, 
        gstRate, 
        product.isGSTInclusive || false
      );
      
      // Adjust for inter-state vs intra-state
      if (isInterState && gstRate > 0) {
        taxCalc.cgst = 0;
        taxCalc.sgst = 0;
        taxCalc.igst = taxCalc.totalTax;
      }
      
      totalBaseAmount += taxCalc.baseAmount;
      totalTaxAmount += taxCalc.totalTax;
      totalCGST += taxCalc.cgst;
      totalSGST += taxCalc.sgst;
      totalIGST += taxCalc.igst;
      
      lineCalculations.push({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.price,
        lineAmount,
        gstRate,
        hsnCode: product.hsnCode,
        isGSTInclusive: product.isGSTInclusive,
        exemptFromGST: product.exemptFromGST,
        ...taxCalc
      });
    }
    
    return {
      totalBaseAmount: this.roundToNearestPaisa(totalBaseAmount),
      totalTaxAmount: this.roundToNearestPaisa(totalTaxAmount),
      totalCGST: this.roundToNearestPaisa(totalCGST),
      totalSGST: this.roundToNearestPaisa(totalSGST),
      totalIGST: this.roundToNearestPaisa(totalIGST),
      grandTotal: this.roundToNearestPaisa(totalBaseAmount + totalTaxAmount),
      isInterState,
      lineCalculations
    };
  }
  
  static async getTaxRates() {
    return Object.entries(this.GST_RATES).map(([key, value]) => ({
      code: key,
      rate: value,
      display: value === 0 ? 'Exempt' : `${value}%`
    }));
  }
  
  static validateGSTNumber(gstNumber) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }
  
  static async applyTaxExemptions(orgId, invoiceData) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { settings: true }
    });
    
    const exemptions = org?.settings?.taxExemptions || [];
    
    // Apply exemptions based on customer type, product category, etc.
    for (const exemption of exemptions) {
      if (exemption.type === 'CUSTOMER_TYPE' && 
          invoiceData.customerType === exemption.value) {
        return { exempt: true, reason: exemption.reason };
      }
      
      if (exemption.type === 'INVOICE_AMOUNT' && 
          invoiceData.total <= exemption.threshold) {
        return { exempt: true, reason: exemption.reason };
      }
    }
    
    return { exempt: false };
  }
}

module.exports = { TaxEngine };