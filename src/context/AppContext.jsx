import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { storage } from '../storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('stocktrack_theme_v1') || 'light');
  const [products, setProducts] = useState(() => storage.getProducts());
  const [transactions, setTransactions] = useState(() => storage.getTransactions());
  const [operator, setOperator] = useState(() => storage.getOperator());
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  
  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stocktrack_theme_v1', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);
  
  // Selected product shortcut for navigating to Receive / Deliver from inventory
  const [preselectedProductId, setPreselectedProductId] = useState(null);

  // Sync state changes across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'stocktrack_products_v1') {
        setProducts(storage.getProducts());
      }
      if (e.key === 'stocktrack_transactions_v1') {
        setTransactions(storage.getTransactions());
      }
      if (e.key === 'stocktrack_current_operator_v1') {
        setOperator(storage.getOperator());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const triggerCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4f46e5', '#10b981', '#06b6d4', '#f59e0b']
      });
    } catch {
      // fallback safe
    }
  }, []);

  const updateOperator = useCallback((name) => {
    const trimmed = name.trim() || 'Store Operator';
    storage.setOperator(trimmed);
    setOperator(trimmed);
    showToast(`Operator switched to "${trimmed}"`, 'info');
  }, [showToast]);

  const addProduct = useCallback((productData) => {
    const name = productData.name.trim();
    if (!name) return { success: false, error: 'Product name is required.' };

    const newProd = {
      id: 'prod-' + Date.now(),
      name,
      code: (productData.code || '').trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: productData.category || 'General Supplies',
      unit: productData.unit || 'pieces',
      stock: Math.max(0, parseInt(productData.initialStock, 10) || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [newProd, ...products];
    storage.setProducts(updated);
    setProducts(updated);

    // If initial stock was given > 0, log an initial receiving transaction
    if (newProd.stock > 0) {
      const initialTx = {
        id: 'tx-' + Date.now(),
        productId: newProd.id,
        productName: newProd.name,
        unit: newProd.unit,
        type: 'RECEIVED',
        quantity: newProd.stock,
        prevBalance: 0,
        newBalance: newProd.stock,
        party: 'Opening Stock Balance',
        refNumber: 'INIT-BAL',
        notes: 'Initial stock entered upon product creation',
        operator,
        timestamp: new Date().toISOString(),
        reversed: false
      };
      const updatedTxs = [initialTx, ...transactions];
      storage.setTransactions(updatedTxs);
      setTransactions(updatedTxs);
    }

    showToast(`Product "${newProd.name}" added successfully!`);
    return { success: true, product: newProd };
  }, [products, transactions, operator, showToast]);

  const updateProduct = useCallback((id, updates) => {
    const target = products.find((p) => p.id === id);
    if (!target) return { success: false, error: 'Product not found.' };

    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    storage.setProducts(updated);
    setProducts(updated);
    showToast('Product updated successfully!');
    return { success: true };
  }, [products, showToast]);

  const receiveStock = useCallback(({ productId, quantity, party, refNumber, notes, customTimestamp }) => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return { success: false, error: 'Received quantity must be a positive number greater than zero.' };
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      return { success: false, error: 'Selected product was not found.' };
    }

    const prevBalance = prod.stock;
    const newBalance = prevBalance + qty;
    const timestamp = customTimestamp || new Date().toISOString();

    const tx = {
      id: 'tx-' + Date.now(),
      productId: prod.id,
      productName: prod.name,
      unit: prod.unit,
      type: 'RECEIVED',
      quantity: qty,
      prevBalance,
      newBalance,
      party: (party || '').trim(),
      refNumber: (refNumber || '').trim(),
      notes: (notes || '').trim(),
      operator,
      timestamp,
      reversed: false
    };

    const updatedProducts = products.map((p) =>
      p.id === prod.id ? { ...p, stock: newBalance, updatedAt: timestamp } : p
    );

    const updatedTransactions = [tx, ...transactions];

    storage.setProducts(updatedProducts);
    storage.setTransactions(updatedTransactions);
    setProducts(updatedProducts);
    setTransactions(updatedTransactions);

    triggerCelebration();
    return { success: true, transaction: tx, prevBalance, newBalance };
  }, [products, transactions, operator, triggerCelebration]);

  const deliverStock = useCallback(({ productId, quantity, party, refNumber, notes, customTimestamp }) => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return { success: false, error: 'Delivery quantity must be a positive number greater than zero.' };
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) {
      return { success: false, error: 'Selected product was not found.' };
    }

    if (qty > prod.stock) {
      return {
        success: false,
        error: `Cannot deliver ${qty} ${prod.unit}. Only ${prod.stock} ${prod.unit} available in stock.`
      };
    }

    const prevBalance = prod.stock;
    const newBalance = prevBalance - qty;
    const timestamp = customTimestamp || new Date().toISOString();

    const tx = {
      id: 'tx-' + Date.now(),
      productId: prod.id,
      productName: prod.name,
      unit: prod.unit,
      type: 'DELIVERED',
      quantity: qty,
      prevBalance,
      newBalance,
      party: (party || '').trim(),
      refNumber: (refNumber || '').trim(),
      notes: (notes || '').trim(),
      operator,
      timestamp,
      reversed: false
    };

    const updatedProducts = products.map((p) =>
      p.id === prod.id ? { ...p, stock: newBalance, updatedAt: timestamp } : p
    );

    const updatedTransactions = [tx, ...transactions];

    storage.setProducts(updatedProducts);
    storage.setTransactions(updatedTransactions);
    setProducts(updatedProducts);
    setTransactions(updatedTransactions);

    triggerCelebration();
    return { success: true, transaction: tx, prevBalance, newBalance };
  }, [products, transactions, operator, triggerCelebration]);

  // Controlled Reversal Process: Preserves original record & adds explicit offsetting record
  const reverseTransaction = useCallback(({ transactionId, reason }) => {
    const origTx = transactions.find((t) => t.id === transactionId);
    if (!origTx) return { success: false, error: 'Transaction not found.' };
    if (origTx.reversed) return { success: false, error: 'This transaction has already been reversed.' };

    const prod = products.find((p) => p.id === origTx.productId);
    if (!prod) return { success: false, error: 'Product associated with this transaction no longer exists.' };

    let newStock = prod.stock;
    let revType = '';
    const now = new Date().toISOString();

    if (origTx.type === 'RECEIVED') {
      // Reversing a receipt requires deducting stock
      if (prod.stock < origTx.quantity) {
        return {
          success: false,
          error: `Cannot reverse receiving of ${origTx.quantity} ${prod.unit}. Current stock is only ${prod.stock} ${prod.unit} (items may have already been delivered).`
        };
      }
      newStock = prod.stock - origTx.quantity;
      revType = 'REVERSAL (RECEIVING CANCELLED)';
    } else if (origTx.type === 'DELIVERED') {
      // Reversing a delivery returns stock
      newStock = prod.stock + origTx.quantity;
      revType = 'REVERSAL (DELIVERY RETURNED)';
    } else {
      return { success: false, error: 'Reversals cannot be reversed again.' };
    }

    const reversalTxId = 'rev-' + Date.now();
    const reversalTx = {
      id: reversalTxId,
      productId: prod.id,
      productName: prod.name,
      unit: prod.unit,
      type: revType,
      quantity: origTx.quantity,
      prevBalance: prod.stock,
      newBalance: newStock,
      party: origTx.party ? `Ref: ${origTx.party}` : 'Reversal Adjustment',
      refNumber: `REV-FOR-${origTx.id}`,
      notes: `Reversal Reason: ${reason || 'Correction of entry error'} (Original Ref: ${origTx.refNumber || 'N/A'})`,
      operator,
      timestamp: now,
      reversed: false,
      originalTxId: origTx.id
    };

    // Mark original as reversed while keeping it permanently visible
    const updatedTransactions = transactions.map((t) => {
      if (t.id === origTx.id) {
        return {
          ...t,
          reversed: true,
          reversedAt: now,
          reversalTxId: reversalTxId,
          reversalReason: reason || 'Correction'
        };
      }
      return t;
    });

    const finalTransactions = [reversalTx, ...updatedTransactions];

    const updatedProducts = products.map((p) =>
      p.id === prod.id ? { ...p, stock: newStock, updatedAt: now } : p
    );

    storage.setProducts(updatedProducts);
    storage.setTransactions(finalTransactions);
    setProducts(updatedProducts);
    setTransactions(finalTransactions);

    showToast(`Transaction ${origTx.id} reversed successfully! Stock adjusted.`, 'info');
    return { success: true };
  }, [products, transactions, operator, showToast]);

  // Re-edit receiving or delivery transaction (corrects human mistakes & adjusts stock)
  const updateTransaction = useCallback(({ transactionId, quantity, party, refNumber, notes, reason }) => {
    const origTx = transactions.find((t) => t.id === transactionId);
    if (!origTx) return { success: false, error: 'Transaction not found.' };
    if (origTx.reversed) return { success: false, error: 'Reversed transactions cannot be modified.' };

    const newQty = parseInt(quantity, 10);
    if (isNaN(newQty) || newQty <= 0) {
      return { success: false, error: 'Quantity must be a positive number greater than zero.' };
    }

    const prod = products.find((p) => p.id === origTx.productId);
    if (!prod) return { success: false, error: 'Product associated with this transaction no longer exists.' };

    const oldQty = origTx.quantity;
    const qtyDiff = newQty - oldQty;

    let newProductStock = prod.stock;

    if (origTx.type === 'RECEIVED') {
      newProductStock = prod.stock + qtyDiff;
      if (newProductStock < 0) {
        return {
          success: false,
          error: `Cannot reduce received quantity to ${newQty}. Current available stock is only ${prod.stock} ${prod.unit} (items may have already been delivered).`
        };
      }
    } else if (origTx.type === 'DELIVERED') {
      newProductStock = prod.stock - qtyDiff;
      if (newProductStock < 0) {
        return {
          success: false,
          error: `Cannot increase delivery quantity to ${newQty}. Total available stock is ${prod.stock + oldQty} ${prod.unit}.`
        };
      }
    } else {
      return { success: false, error: 'Reversal records cannot be edited directly.' };
    }

    const now = new Date().toISOString();
    const recalculatedNewBalance = origTx.prevBalance + (origTx.type === 'RECEIVED' ? newQty : -newQty);

    const updatedTx = {
      ...origTx,
      quantity: newQty,
      newBalance: recalculatedNewBalance,
      party: (party ?? origTx.party ?? '').trim(),
      refNumber: (refNumber ?? origTx.refNumber ?? '').trim(),
      notes: (notes ?? origTx.notes ?? '').trim(),
      edited: true,
      lastEditedAt: now,
      lastEditedBy: operator,
      editReason: (reason || '').trim() || 'Corrected quantity mistake'
    };

    const updatedTransactions = transactions.map((t) => (t.id === origTx.id ? updatedTx : t));
    const updatedProducts = products.map((p) =>
      p.id === prod.id ? { ...p, stock: newProductStock, updatedAt: now } : p
    );

    storage.setProducts(updatedProducts);
    storage.setTransactions(updatedTransactions);
    setProducts(updatedProducts);
    setTransactions(updatedTransactions);

    showToast(`Entry updated! Stock adjusted by ${qtyDiff >= 0 ? '+' : ''}${origTx.type === 'RECEIVED' ? qtyDiff : -qtyDiff} ${prod.unit}.`);
    return { success: true, transaction: updatedTx };
  }, [products, transactions, operator, showToast]);

  const resetAllData = useCallback(() => {
    const data = storage.resetDemoData();
    setProducts(data.products);
    setTransactions(data.transactions);
    setOperator(data.operator);
    showToast('Loaded demo stock data with chocolates, perfumes, and cosmetics!');
  }, [showToast]);

  const importDataFromJSON = useCallback((jsonStr) => {
    const result = storage.importJSON(jsonStr);
    if (result.success) {
      setProducts(result.data.products);
      setTransactions(result.data.transactions);
      if (result.data.operator) setOperator(result.data.operator);
      showToast('Data backup restored successfully!');
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [showToast]);

  const navigateToReceiveWithProduct = (productId) => {
    setPreselectedProductId(productId);
    setCurrentTab('receive');
  };

  const navigateToDeliverWithProduct = (productId) => {
    setPreselectedProductId(productId);
    setCurrentTab('deliver');
  };

  return (
    <AppContext.Provider
      value={{
        products,
        transactions,
        operator,
        currentTab,
        setCurrentTab,
        toasts,
        showToast,
        updateOperator,
        addProduct,
        updateProduct,
        receiveStock,
        deliverStock,
        reverseTransaction,
        updateTransaction,
        resetAllData,
        importDataFromJSON,
        preselectedProductId,
        setPreselectedProductId,
        navigateToReceiveWithProduct,
        navigateToDeliverWithProduct,
        theme,
        toggleTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
