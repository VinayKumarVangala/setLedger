// Form validation utilities

export const validatePerishableProduct = (data) => {
  const errors = {};
  
  if (data.isPerishable) {
    // Required fields for perishable products
    if (!data.mfdDate) {
      errors.mfdDate = 'Manufacturing date is required for perishable products';
    }
    
    if (!data.expiryDate) {
      errors.expiryDate = 'Expiry date is required for perishable products';
    }
    
    // Date validations
    if (data.mfdDate && data.expiryDate) {
      const mfdDate = new Date(data.mfdDate);
      const expiryDate = new Date(data.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (mfdDate > today) {
        errors.mfdDate = 'Manufacturing date cannot be in the future';
      }
      
      if (expiryDate <= mfdDate) {
        errors.expiryDate = 'Expiry date must be after manufacturing date';
      }
      
      if (expiryDate <= today) {
        errors.expiryDate = 'Product is already expired';
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return { status: 'expired', message: 'Expired', color: 'red' };
  } else if (diffDays <= 3) {
    return { status: 'critical', message: `Expires in ${diffDays} days`, color: 'red' };
  } else if (diffDays <= 7) {
    return { status: 'warning', message: `Expires in ${diffDays} days`, color: 'yellow' };
  } else if (diffDays <= 30) {
    return { status: 'caution', message: `Expires in ${diffDays} days`, color: 'blue' };
  }
  
  return { status: 'good', message: `Expires in ${diffDays} days`, color: 'green' };
};

export const validateProductForm = (data) => {
  const errors = {};
  
  // Basic validations
  if (!data.name?.trim()) {
    errors.name = 'Product name is required';
  }
  
  if (!data.price || data.price <= 0) {
    errors.price = 'Price must be greater than 0';
  }
  
  if (data.stock < 0) {
    errors.stock = 'Stock cannot be negative';
  }
  
  // Perishable product validations
  const perishableValidation = validatePerishableProduct(data);
  if (!perishableValidation.isValid) {
    Object.assign(errors, perishableValidation.errors);
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};