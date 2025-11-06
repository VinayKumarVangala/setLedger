const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const QRCode = require('qrcode');
const { generateQRToken } = require('./qr');

class QRPDFGenerator {
  static async generateQRLabel(productData, options = {}) {
    const { width = 200, height = 150, format = 'A4' } = options;
    
    // Generate signed QR token
    const qrToken = generateQRToken(productData.id, productData.orgUUID);
    
    // Create QR code SVG
    const qrSVG = await QRCode.toString(qrToken, {
      type: 'svg',
      width: 120,
      margin: 1
    });
    
    // Create PDF document
    const doc = new PDFDocument({ size: format, margin: 20 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Add QR code SVG
      SVGtoPDF(doc, qrSVG, 40, 30, { width: 120, height: 120 });
      
      // Add product info
      doc.fontSize(12).text(productData.name, 40, 160, { width: 120, align: 'center' });
      doc.fontSize(10).text(`SKU: ${productData.sku}`, 40, 180, { width: 120, align: 'center' });
      doc.fontSize(10).text(`₹${productData.price}`, 40, 195, { width: 120, align: 'center' });
      
      if (productData.expiryDate) {
        doc.fontSize(8).text(`Exp: ${new Date(productData.expiryDate).toLocaleDateString()}`, 40, 210, { width: 120, align: 'center' });
      }
      
      doc.end();
    });
  }
  
  static async generateBulkQRLabels(products, options = {}) {
    const { labelsPerRow = 3, labelsPerPage = 15 } = options;
    const doc = new PDFDocument({ size: 'A4', margin: 20 });
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise(async (resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      let currentLabel = 0;
      
      for (const product of products) {
        const qrToken = generateQRToken(product.id, product.orgUUID);
        const qrSVG = await QRCode.toString(qrToken, {
          type: 'svg',
          width: 80,
          margin: 1
        });
        
        const row = Math.floor(currentLabel / labelsPerRow);
        const col = currentLabel % labelsPerRow;
        
        const x = 40 + col * 180;
        const y = 40 + row * 120;
        
        // Add new page if needed
        if (currentLabel > 0 && currentLabel % labelsPerPage === 0) {
          doc.addPage();
        }
        
        // Add QR code and product info
        SVGtoPDF(doc, qrSVG, x, y, { width: 80, height: 80 });
        doc.fontSize(10).text(product.name, x, y + 85, { width: 160, align: 'center' });
        doc.fontSize(8).text(`₹${product.price}`, x, y + 100, { width: 160, align: 'center' });
        
        currentLabel++;
      }
      
      doc.end();
    });
  }
}

module.exports = { QRPDFGenerator };