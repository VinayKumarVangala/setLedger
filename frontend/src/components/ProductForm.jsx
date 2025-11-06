import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, AlertTriangle } from 'lucide-react';

const ProductForm = ({ product, onSubmit, onCancel }) => {
  const [isPerishable, setIsPerishable] = useState(product?.isPerishable || false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors
  } = useForm({
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      price: product?.price || '',
      stock: product?.stock || 0,
      isPerishable: product?.isPerishable || false,
      mfdDate: product?.mfdDate ? new Date(product.mfdDate).toISOString().split('T')[0] : '',
      expiryDate: product?.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : ''
    }
  });

  const watchedIsPerishable = watch('isPerishable');
  const watchedMfdDate = watch('mfdDate');
  const watchedExpiryDate = watch('expiryDate');

  // Custom validation for perishable products
  const validatePerishableDates = (data) => {
    clearErrors(['mfdDate', 'expiryDate']);
    
    if (data.isPerishable) {
      if (!data.mfdDate) {
        setError('mfdDate', {
          type: 'required',
          message: 'Manufacturing date is required for perishable products'
        });
        return false;
      }
      
      if (!data.expiryDate) {
        setError('expiryDate', {
          type: 'required',
          message: 'Expiry date is required for perishable products'
        });
        return false;
      }
      
      const mfdDate = new Date(data.mfdDate);
      const expiryDate = new Date(data.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (mfdDate > today) {
        setError('mfdDate', {
          type: 'validate',
          message: 'Manufacturing date cannot be in the future'
        });
        return false;
      }
      
      if (expiryDate <= mfdDate) {
        setError('expiryDate', {
          type: 'validate',
          message: 'Expiry date must be after manufacturing date'
        });
        return false;
      }
      
      if (expiryDate <= today) {
        setError('expiryDate', {
          type: 'validate',
          message: 'Product is already expired'
        });
        return false;
      }
    }
    
    return true;
  };

  const onFormSubmit = (data) => {
    if (validatePerishableDates(data)) {
      // Clean up dates for non-perishable products
      if (!data.isPerishable) {
        data.mfdDate = null;
        data.expiryDate = null;
      }
      onSubmit(data);
    }
  };

  const getDaysUntilExpiry = () => {
    if (!watchedExpiryDate) return null;
    const expiryDate = new Date(watchedExpiryDate);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryWarning = () => {
    const daysUntilExpiry = getDaysUntilExpiry();
    if (daysUntilExpiry === null) return null;
    
    if (daysUntilExpiry <= 0) {
      return { type: 'error', message: 'Product is expired' };
    } else if (daysUntilExpiry <= 7) {
      return { type: 'warning', message: `Expires in ${daysUntilExpiry} days` };
    } else if (daysUntilExpiry <= 30) {
      return { type: 'info', message: `Expires in ${daysUntilExpiry} days` };
    }
    return null;
  };

  const expiryWarning = getExpiryWarning();

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Name *
        </label>
        <input
          {...register('name', { required: 'Product name is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU
          </label>
          <input
            {...register('sku')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price *
          </label>
          <input
            type="number"
            step="0.01"
            {...register('price', { 
              required: 'Price is required',
              min: { value: 0, message: 'Price must be positive' }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Initial Stock
        </label>
        <input
          type="number"
          {...register('stock', { 
            min: { value: 0, message: 'Stock cannot be negative' }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.stock && (
          <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register('isPerishable')}
            onChange={(e) => setIsPerishable(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Perishable Product
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Check if this product has manufacturing and expiry dates
        </p>
      </div>

      {/* Conditional MFD/Expiry fields */}
      {watchedIsPerishable && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Perishable Product Dates
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturing Date *
              </label>
              <input
                type="date"
                {...register('mfdDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.mfdDate && (
                <p className="mt-1 text-sm text-red-600">{errors.mfdDate.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                {...register('expiryDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.expiryDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expiryDate.message}</p>
              )}
            </div>
          </div>

          {/* Expiry warning */}
          {expiryWarning && (
            <div className={`mt-3 p-2 rounded-md flex items-center space-x-2 ${
              expiryWarning.type === 'error' ? 'bg-red-50 text-red-700' :
              expiryWarning.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{expiryWarning.message}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;