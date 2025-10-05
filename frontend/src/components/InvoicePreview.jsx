import React from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const InvoicePreview = ({ invoice, organization, onClose }) => {
  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(organization?.name || 'Your Company', 20, 30);
    doc.setFontSize(12);
    doc.text(`GSTIN: ${organization?.gstin || 'N/A'}`, 20, 40);
    
    // Invoice details
    doc.setFontSize(16);
    doc.text('INVOICE', 150, 30);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 40);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 150, 50);
    
    // Customer details
    doc.text('Bill To:', 20, 80);
    doc.text(invoice.customer.name, 20, 90);
    if (invoice.customer.address) doc.text(invoice.customer.address, 20, 100);
    
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
    doc.text(`Total: ₹${invoice.totals.grandTotal.toFixed(2)}`, 120, yPos + 20);
    
    // Generate QR code
    const qrData = {
      invoiceId: invoice.invoiceID,
      amount: invoice.totals.grandTotal,
      customer: invoice.customer.name
    };
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
      doc.addImage(qrCodeDataURL, 'PNG', 20, yPos + 10, 30, 30);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
    
    // Download PDF
    doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Invoice Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invoice Preview */}
        <div className="border rounded-lg p-8 bg-white">
          {/* Header */}
          <div className="flex justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">{organization?.name || 'Your Company'}</h1>
              <p className="text-gray-600">GSTIN: {organization?.gstin || 'N/A'}</p>
              <p className="text-gray-600">{organization?.address?.street}</p>
              <p className="text-gray-600">{organization?.address?.city}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">INVOICE</h2>
              <p>Invoice #: {invoice.invoiceNumber}</p>
              <p>Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p>Due: {new Date(invoice.payment.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Customer Details */}
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <p className="font-medium">{invoice.customer.name}</p>
            {invoice.customer.email && <p className="text-gray-600">{invoice.customer.email}</p>}
            {invoice.customer.phone && <p className="text-gray-600">{invoice.customer.phone}</p>}
            {invoice.customer.address && <p className="text-gray-600">{invoice.customer.address}</p>}
            {invoice.customer.gstin && <p className="text-gray-600">GSTIN: {invoice.customer.gstin}</p>}
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-2">Item</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Rate</th>
                  <th className="text-right py-2">Discount</th>
                  <th className="text-right py-2">Tax%</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.productName}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-2">{item.discount}%</td>
                    <td className="text-right py-2">{item.taxRate}%</td>
                    <td className="text-right py-2">₹{item.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span>₹{invoice.totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Discount:</span>
                <span>₹{invoice.totals.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Tax:</span>
                <span>₹{invoice.totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 font-bold text-lg">
                <span>Total:</span>
                <span>₹{invoice.totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-2">Payment Terms:</h4>
              <p>Method: {invoice.payment.method}</p>
              <p>Terms: {invoice.payment.terms}</p>
            </div>
            {invoice.notes && (
              <div>
                <h4 className="font-semibold mb-2">Notes:</h4>
                <p className="text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={generatePDF}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;