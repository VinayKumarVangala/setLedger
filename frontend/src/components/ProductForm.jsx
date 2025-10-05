import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { productService } from '../services/api';

const ProductForm = ({ product, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: product || {
      pricing: { costPrice: 0, sellingPrice: 0, mrp: 0 },
      tax: { gstRate: 18, taxCategory: 'goods' },
      inventory: { currentStock: 0, minStock: 0, unit: 'pcs' },
      supplier: {}
    }
  });

  const costPrice = watch('pricing.costPrice');
  const sellingPrice = watch('pricing.sellingPrice');

  // Auto-calculate margin
  useEffect(() => {
    if (costPrice > 0 && sellingPrice > 0) {
      const margin = ((sellingPrice - costPrice) / costPrice * 100).toFixed(2);
      setValue('pricing.margin', parseFloat(margin));
    }
  }, [costPrice, sellingPrice, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (product) {
        await productService.updateProduct(product.productID, data);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(data);
        toast.success('Product created successfully');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                <input
                  {...register('name', { required: 'Product name is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">SKU *</label>
                <input
                  {...register('sku', { required: 'SKU is required' })}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="food">Food & Beverages</option>
                  <option value="books">Books</option>
                  <option value="home">Home & Garden</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Pricing</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Price *</label>
                <input
                  {...register('pricing.costPrice', { 
                    required: 'Cost price is required',
                    min: { value: 0, message: 'Cost price must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.pricing?.costPrice && <p className="mt-1 text-sm text-red-600">{errors.pricing.costPrice.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Selling Price *</label>
                <input
                  {...register('pricing.sellingPrice', { 
                    required: 'Selling price is required',
                    min: { value: 0, message: 'Selling price must be positive' }
                  })}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.pricing?.sellingPrice && <p className="mt-1 text-sm text-red-600">{errors.pricing.sellingPrice.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">MRP</label>
                <input
                  {...register('pricing.mrp', { min: { value: 0, message: 'MRP must be positive' } })}
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Margin (%)</label>
                <input
                  {...register('pricing.margin')}
                  type="number"
                  step="0.01"
                  readOnly
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Tax Information</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">GST Rate (%) *</label>
                <select
                  {...register('tax.gstRate', { required: 'GST rate is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">HSN Code</label>
                <input
                  {...register('tax.hsnCode')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tax Category</label>
                <select
                  {...register('tax.taxCategory')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="goods">Goods</option>
                  <option value="services">Services</option>
                </select>
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Inventory</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                <input
                  {...register('inventory.currentStock', { min: { value: 0, message: 'Stock must be positive' } })}
                  type="number"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Stock</label>
                <input
                  {...register('inventory.minStock', { min: { value: 0, message: 'Min stock must be positive' } })}
                  type="number"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <select
                  {...register('inventory.unit')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilograms</option>
                  <option value="ltr">Liters</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  {...register('inventory.location')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Supplier Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                <input
                  {...register('supplier.name')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact</label>
                <input
                  {...register('supplier.contact')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  {...register('supplier.email')}
                  type="email"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;