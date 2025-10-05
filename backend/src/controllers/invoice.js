const { Invoice, Product, Transaction } = require('../models');
const QRCode = require('qrcode');
const jsPDF = require('jspdf');
const stockService = require('../services/stockService');
const accountingService = require('../services/accountingService');

// Auto-calculate invoice totals
const calculateInvoiceTotals = (items) => {
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  const calculatedItems = items.map(item => {
    const itemTotal = item.quantity * item.unitPrice;
    const discountAmount = (itemTotal * item.discount) / 100;
    const taxableAmount = itemTotal - discountAmount;
    const taxAmount = (taxableAmount * item.taxRate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    subtotal += itemTotal;
    totalDiscount += discountAmount;
    totalTax += taxAmount;

    return {
      ...item,
      taxAmount,
      totalAmount
    };
  });

  return {
    items: calculatedItems,
    totals: {
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal: subtotal - totalDiscount + totalTax
    }
  };
};

// Generate invoice QR code with payment metadata
const generateInvoiceQR = async (invoice) => {
  const qrData = {
    invoiceId: invoice.invoiceID,
    amount: invoice.totals.grandTotal,
    customer: invoice.customer.name,
    dueDate: invoice.payment.dueDate,
    orgId: invoice.orgID
  };
  
  return await QRCode.toDataURL(JSON.stringify(qrData));
};

// Generate PDF invoice
const generateInvoicePDF = async (invoice, organization) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(organization.name, 20, 30);
  doc.setFontSize(12);
  doc.text(`GSTIN: ${organization.gstin || 'N/A'}`, 20, 40);
  doc.text(`${organization.address.street}, ${organization.address.city}`, 20, 50);
  
  // Invoice details
  doc.setFontSize(16);
  doc.text('INVOICE', 150, 30);
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 40);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 150, 50);
  doc.text(`Due: ${new Date(invoice.payment.dueDate).toLocaleDateString()}`, 150, 60);
  
  // Customer details
  doc.text('Bill To:', 20, 80);
  doc.text(invoice.customer.name, 20, 90);
  if (invoice.customer.address) doc.text(invoice.customer.address, 20, 100);
  if (invoice.customer.gstin) doc.text(`GSTIN: ${invoice.customer.gstin}`, 20, 110);
  
  // Items table
  let yPos = 130;
  doc.text('Item', 20, yPos);
  doc.text('Qty', 80, yPos);
  doc.text('Rate', 100, yPos);
  doc.text('Tax%', 120, yPos);
  doc.text('Amount', 150, yPos);
  
  yPos += 10;
  invoice.items.forEach(item => {
    doc.text(item.productName, 20, yPos);
    doc.text(item.quantity.toString(), 80, yPos);
    doc.text(item.unitPrice.toString(), 100, yPos);
    doc.text(item.taxRate.toString(), 120, yPos);
    doc.text(item.totalAmount.toFixed(2), 150, yPos);
    yPos += 10;
  });
  
  // Totals
  yPos += 10;
  doc.text(`Subtotal: ₹${invoice.totals.subtotal.toFixed(2)}`, 120, yPos);
  doc.text(`Tax: ₹${invoice.totals.totalTax.toFixed(2)}`, 120, yPos + 10);
  doc.text(`Discount: ₹${invoice.totals.totalDiscount.toFixed(2)}`, 120, yPos + 20);
  doc.setFontSize(12);
  doc.text(`Total: ₹${invoice.totals.grandTotal.toFixed(2)}`, 120, yPos + 35);
  
  // QR Code
  const qrCode = await generateInvoiceQR(invoice);
  doc.addImage(qrCode, 'PNG', 20, yPos + 20, 30, 30);
  
  return doc.output('arraybuffer');
};

// Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { customer, items, payment, notes } = req.body;

    // Calculate totals
    const calculated = calculateInvoiceTotals(items);
    
    // Generate invoice number
    const count = await Invoice.countDocuments({ orgID });
    const invoiceNumber = `INV-${Date.now()}-${count + 1}`;
    
    const invoice = new Invoice({
      invoiceID: `${orgID}_${Date.now()}`,
      orgID,
      invoiceNumber,
      customer,
      items: calculated.items,
      totals: calculated.totals,
      payment: {
        ...payment,
        dueDate: payment.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      notes,
      createdBy: req.user.userID,
      updatedBy: req.user.userID
    });

    await invoice.save();

    // Create transaction record
    const transaction = new Transaction({
      transactionID: `${orgID}_TXN_${Date.now()}`,
      orgID,
      type: 'income',
      category: 'sales',
      amount: calculated.totals.grandTotal,
      description: `Invoice ${invoiceNumber}`,
      reference: { type: 'invoice', id: invoice.invoiceID, number: invoiceNumber },
      date: new Date(),
      createdBy: req.user.userID,
      updatedBy: req.user.userID
    });

    await transaction.save();

    // Update stock automatically
    const stockUpdates = await stockService.updateStockOnSale(
      orgID, 
      calculated.items.map(item => ({ ...item, invoiceID: invoice.invoiceID })), 
      req.user.userID
    );
    
    // Create journal entry for the sale
    const journalEntry = await accountingService.createSaleEntry(orgID, invoice, req.user.userID);

    res.status(201).json({
      success: true,
      data: { ...invoice.toObject(), stockUpdates, journalEntry: journalEntry.entryNumber },
      message: 'Invoice created, stock updated, and journal entry posted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating invoice',
      error: error.message
    });
  }
};

// Get invoices
exports.getInvoices = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { page = 1, limit = 10, status, customer } = req.query;

    const filter = { orgID };
    if (status) filter.status = status;
    if (customer) filter['customer.name'] = new RegExp(customer, 'i');

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

// Get single invoice
exports.getInvoice = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { id } = req.params;

    const invoice = await Invoice.findOne({ invoiceID: id, orgID });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

// Generate PDF
exports.generatePDF = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { id } = req.params;

    const invoice = await Invoice.findOne({ invoiceID: id, orgID });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Get organization details (mock for now)
    const organization = {
      name: 'Your Company Name',
      gstin: 'GSTIN123456789',
      address: {
        street: '123 Business St',
        city: 'Business City'
      }
    };

    const pdfBuffer = await generateInvoicePDF(invoice, organization);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
};

// Update payment status
exports.updatePayment = async (req, res) => {
  try {
    const { orgID } = req.user;
    const { id } = req.params;
    const { status, paidAmount, method } = req.body;

    const invoice = await Invoice.findOneAndUpdate(
      { invoiceID: id, orgID },
      {
        'payment.status': status,
        'payment.paidAmount': paidAmount,
        'payment.method': method,
        updatedBy: req.user.userID
      },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message
    });
  }
};