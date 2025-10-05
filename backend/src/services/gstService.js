const axios = require('axios');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

class GSTService {
  constructor() {
    this.gstApiUrl = 'https://sheet.gstincheck.co.in/check';
    this.apiKey = process.env.GST_API_KEY;
  }

  async validateGSTIN(gstin) {
    try {
      const response = await axios.get(`${this.gstApiUrl}/${gstin}`);
      return {
        valid: response.data.flag,
        data: response.data.data || null
      };
    } catch (error) {
      console.error('GST validation error:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  async generateGSTR1(orgId, memberId, month, year) {
    const userId = `${orgId}_${memberId}`;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const invoices = await Invoice.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
      gstRate: { $gt: 0 }
    }).populate('items.productId');

    const b2bInvoices = invoices.filter(inv => inv.customerGSTIN);
    const b2cInvoices = invoices.filter(inv => !inv.customerGSTIN);

    return {
      period: `${month}/${year}`,
      b2b: this.formatB2BData(b2bInvoices),
      b2cs: this.formatB2CData(b2cInvoices),
      summary: this.calculateGSTR1Summary(invoices)
    };
  }

  async generateGSTR3B(orgId, memberId, month, year) {
    const userId = `${orgId}_${memberId}`;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [outwardInvoices, inwardInvoices] = await Promise.all([
      Invoice.find({
        userId,
        createdAt: { $gte: startDate, $lte: endDate },
        type: 'sale'
      }),
      Invoice.find({
        userId,
        createdAt: { $gte: startDate, $lte: endDate },
        type: 'purchase'
      })
    ]);

    const outwardSupplies = this.calculateOutwardSupplies(outwardInvoices);
    const inwardSupplies = this.calculateInwardSupplies(inwardInvoices);
    const itc = this.calculateITC(inwardInvoices);

    return {
      period: `${month}/${year}`,
      outwardSupplies,
      inwardSupplies,
      itc,
      taxPayable: this.calculateTaxPayable(outwardSupplies, itc),
      summary: this.calculateGSTR3BSummary(outwardSupplies, inwardSupplies, itc)
    };
  }

  formatB2BData(invoices) {
    const b2bData = {};
    
    invoices.forEach(invoice => {
      const gstin = invoice.customerGSTIN;
      if (!b2bData[gstin]) {
        b2bData[gstin] = {
          ctin: gstin,
          inv: []
        };
      }

      b2bData[gstin].inv.push({
        inum: invoice.invoiceNumber,
        idt: invoice.createdAt.toISOString().split('T')[0],
        val: invoice.total,
        pos: invoice.placeOfSupply || '07',
        rchrg: 'N',
        inv_typ: 'R',
        itms: this.formatInvoiceItems(invoice.items)
      });
    });

    return Object.values(b2bData);
  }

  formatB2CData(invoices) {
    const b2cData = {};
    
    invoices.forEach(invoice => {
      const key = `${invoice.placeOfSupply || '07'}_${invoice.gstRate}`;
      if (!b2cData[key]) {
        b2cData[key] = {
          pos: invoice.placeOfSupply || '07',
          sply_ty: 'INTRA',
          rt: invoice.gstRate,
          typ: 'OE',
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0
        };
      }

      b2cData[key].txval += invoice.subtotal;
      b2cData[key].iamt += invoice.igst || 0;
      b2cData[key].camt += invoice.cgst || 0;
      b2cData[key].samt += invoice.sgst || 0;
    });

    return Object.values(b2cData);
  }

  formatInvoiceItems(items) {
    const itemsData = {};
    
    items.forEach(item => {
      const key = item.gstRate || 18;
      if (!itemsData[key]) {
        itemsData[key] = {
          rt: key,
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0
        };
      }

      itemsData[key].txval += item.amount;
      itemsData[key].iamt += item.igst || 0;
      itemsData[key].camt += item.cgst || 0;
      itemsData[key].samt += item.sgst || 0;
    });

    return Object.values(itemsData);
  }

  calculateOutwardSupplies(invoices) {
    let taxableValue = 0;
    let igst = 0, cgst = 0, sgst = 0, cess = 0;

    invoices.forEach(invoice => {
      taxableValue += invoice.subtotal || 0;
      igst += invoice.igst || 0;
      cgst += invoice.cgst || 0;
      sgst += invoice.sgst || 0;
      cess += invoice.cess || 0;
    });

    return { taxableValue, igst, cgst, sgst, cess };
  }

  calculateInwardSupplies(invoices) {
    return this.calculateOutwardSupplies(invoices);
  }

  calculateITC(invoices) {
    let itcAvailed = 0;
    let itcReversed = 0;

    invoices.forEach(invoice => {
      itcAvailed += (invoice.igst || 0) + (invoice.cgst || 0) + (invoice.sgst || 0);
    });

    return { itcAvailed, itcReversed, netItc: itcAvailed - itcReversed };
  }

  calculateTaxPayable(outwardSupplies, itc) {
    const grossTax = outwardSupplies.igst + outwardSupplies.cgst + outwardSupplies.sgst;
    const netTax = grossTax - itc.netItc;
    
    return {
      grossTax,
      itcUtilized: itc.netItc,
      netTaxPayable: Math.max(0, netTax),
      cashPayable: Math.max(0, netTax)
    };
  }

  calculateGSTR1Summary(invoices) {
    const totalInvoices = invoices.length;
    const totalTaxableValue = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
    const totalTax = invoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0);

    return { totalInvoices, totalTaxableValue, totalTax };
  }

  calculateGSTR3BSummary(outward, inward, itc) {
    return {
      totalOutwardSupplies: outward.taxableValue,
      totalInwardSupplies: inward.taxableValue,
      totalItc: itc.itcAvailed,
      netTaxLiability: outward.igst + outward.cgst + outward.sgst - itc.netItc
    };
  }
}

module.exports = new GSTService();