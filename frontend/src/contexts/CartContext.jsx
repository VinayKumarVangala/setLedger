import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.productId === action.payload.productId);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload.productId)
      };
    
    case 'CLEAR_CART':
      return { ...state, items: [] };
    
    case 'SET_CUSTOMER':
      return { ...state, customer: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    customer: null,
    loading: false,
    error: null
  });

  const validateStock = async (productId, requestedQuantity) => {
    try {
      const response = await api.get(`/stock/available/${productId}`);
      const availableStock = response.data.data.availableStock;
      
      if (availableStock < requestedQuantity) {
        throw new Error(`Only ${availableStock} units available`);
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  const addItem = async (product, quantity = 1) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const currentItem = state.items.find(item => item.productId === product.id);
      const totalQuantity = (currentItem?.quantity || 0) + quantity;
      
      await validateStock(product.id, totalQuantity);
      
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          gstRate: product.gstRate || 18,
          isGSTInclusive: product.isGSTInclusive || false,
          exemptFromGST: product.exemptFromGST || false,
          hsnCode: product.hsnCode
        }
      });
      
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await validateStock(productId, quantity);
      
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { productId, quantity }
      });
    } catch (error) {
      toast.error(error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeItem = (productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success('Cart cleared');
  };

  const setCustomer = (customer) => {
    dispatch({ type: 'SET_CUSTOMER', payload: customer });
  };

  const scanQRCode = async (qrToken) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await api.post('/qr/validate', { token: qrToken });
      const product = response.data.product;
      
      await addItem(product, 1);
    } catch (error) {
      toast.error('Invalid QR code or product not found');
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Calculate totals
  const totals = React.useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    
    state.items.forEach(item => {
      const lineAmount = item.quantity * item.price;
      
      if (item.exemptFromGST) {
        subtotal += lineAmount;
      } else {
        let taxableAmount, taxAmount;
        
        if (item.isGSTInclusive) {
          taxableAmount = lineAmount / (1 + item.gstRate / 100);
          taxAmount = lineAmount - taxableAmount;
        } else {
          taxableAmount = lineAmount;
          taxAmount = (lineAmount * item.gstRate) / 100;
        }
        
        subtotal += taxableAmount;
        totalTax += taxAmount;
      }
    });
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      total: Math.round((subtotal + totalTax) * 100) / 100,
      itemCount: state.items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [state.items]);

  const value = {
    ...state,
    totals,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setCustomer,
    scanQRCode
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};