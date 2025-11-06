import React, { useState } from 'react';
import { Plus, Minus, QrCode, Calculator } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import QRScanner from './QRScanner';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const InvoiceForm = ({ onSubmit, onCancel }) => {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMethod, setInputMethod] = useState('manual');
  
  const { register, control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      customerName: '',
      customerMobile: '',
      lines: [{ productId: '', quantity: 1, price: 0, total: 0 }],
      subtotal: 0,
      taxAmount: 0,
      discount: 0,
      total: 0
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });
  
  const watchedLines = watch('lines');
  const watchedDiscount = watch('discount');
  const watchedTaxAmount = watch('taxAmount');
  
  // Calculate totals
  React.useEffect(() => {
    const subtotal = watchedLines.reduce((sum, line) => {
      const lineTotal = (line.quantity || 0) * (line.price || 0);
      setValue(`lines.${watchedLines.indexOf(line)}.total`, lineTotal);
      return sum + lineTotal;
    }, 0);
    
    const discount = watchedDiscount || 0;
    const taxAmount = watchedTaxAmount || 0;
    const total = subtotal - discount + taxAmount;
    
    setValue('subtotal', subtotal);
    setValue('total', total);
  }, [watchedLines, watchedDiscount, watchedTaxAmount, setValue]);
  
  const handleQRScan = async (qrData) => {
    try {
      // Validate QR and get product info
      const response = await api.post('/qr/validate', { token: qrData });
      const product = response.data.product;
      
      // Add product to invoice lines
      const newLine = {
        productId: product.id,
        quantity: 1,
        price: product.price,
        total: product.price
      };
      
      append(newLine);
      setInputMethod('qr_scan');
      setShowQRScanner(false);
      toast.success(`Added ${product.name} to invoice`);
    } catch (error) {
      toast.error('Invalid QR code or product not found');
    }
  };
  
  const submitInvoice = async (data) => {
    setIsSubmitting(true);
    
    try {
      const invoiceData = {
        ...data,
        inputMethod,
        lines: data.lines.filter(line => line.productId && line.quantity > 0)
      };
      
      const endpoint = inputMethod === 'qr_scan' ? '/invoices/qr-scan' : '/invoices';
      const response = await api.post(endpoint, invoiceData);
      
      toast.success('Invoice created successfully');
      onSubmit?.(response.data.data);
      reset();
    } catch (error) {
      toast.error('Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Create Invoice</h2>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            inputMethod === 'qr_scan' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {inputMethod === 'qr_scan' ? 'QR Scan' : 'Manual'}
          </span>
          
          <button
            type="button"
            onClick={() => setShowQRScanner(true)}
            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <QrCode className="w-4 h-4" />
            Scan QR
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(submitInvoice)} className="space-y-6">
        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              {...register('customerName', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter customer name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              {...register('customerMobile')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter mobile number"
            />
          </div>
        </div>
        
        {/* Invoice Lines */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Items</h3>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1, price: 0, total: 0 })}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    {...register(`lines.${index}.productId`, { required: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select product</option>
                    {/* Product options would be loaded from API */}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register(`lines.${index}.quantity`, { required: true, min: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`lines.${index}.price`, { required: true, min: 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`lines.${index}.total`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                
                <div className="col-span-2">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Minus className="w-4 h-4 mx-auto" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Totals */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('discount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('taxAmount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount
              </label>
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  step="0.01"
                  {...register('total')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-medium"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default InvoiceForm;