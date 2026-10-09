import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS } from './types';

const PRODUCTS_KEY = 'stocktrack_products_v1';
const TRANSACTIONS_KEY = 'stocktrack_transactions_v1';
const OPERATOR_KEY = 'stocktrack_current_operator_v1';

export const storage = {
  getProducts: () => {
    try {
      const data = localStorage.getItem(PRODUCTS_KEY);
      if (!data) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading products from localStorage:', e);
      return INITIAL_PRODUCTS;
    }
  },

  setProducts: (products) => {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products:', e);
    }
  },

  getTransactions: () => {
    try {
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      if (!data) {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
        return INITIAL_TRANSACTIONS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading transactions from localStorage:', e);
      return INITIAL_TRANSACTIONS;
    }
  },

  setTransactions: (transactions) => {
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
  },

  getOperator: () => {
    return localStorage.getItem(OPERATOR_KEY) || 'Umair (Store Manager)';
  },

  setOperator: (operator) => {
    localStorage.setItem(OPERATOR_KEY, operator);
  },

  resetDemoData: () => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(OPERATOR_KEY, 'Umair (Store Manager)');
    return {
      products: INITIAL_PRODUCTS,
      transactions: INITIAL_TRANSACTIONS,
      operator: 'Umair (Store Manager)'
    };
  },

  clearAll: () => {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(TRANSACTIONS_KEY);
  },

  exportJSON: () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products: storage.getProducts(),
      transactions: storage.getTransactions(),
      operator: storage.getOperator()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stocktrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  },

  importJSON: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed.products) || !Array.isArray(parsed.transactions)) {
        throw new Error('Invalid backup file format: missing products or transactions.');
      }
      storage.setProducts(parsed.products);
      storage.setTransactions(parsed.transactions);
      if (parsed.operator) {
        storage.setOperator(parsed.operator);
      }
      return { success: true, data: parsed };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  exportHistoryCSV: (transactions) => {
    const headers = [
      'Transaction ID',
      'Date & Time',
      'Product Name',
      'Type',
      'Quantity',
      'Unit',
      'Previous Balance',
      'New Balance',
      'Supplier / Recipient',
      'Reference Number',
      'Operator',
      'Status',
      'Notes'
    ];

    const rows = transactions.map(t => [
      t.id,
      new Date(t.timestamp).toLocaleString(),
      `"${(t.productName || '').replace(/"/g, '""')}"`,
      t.type,
      t.quantity,
      t.unit || '',
      t.prevBalance,
      t.newBalance,
      `"${(t.party || '').replace(/"/g, '""')}"`,
      `"${(t.refNumber || '').replace(/"/g, '""')}"`,
      `"${(t.operator || '').replace(/"/g, '""')}"`,
      t.reversed ? 'REVERSED' : 'CONFIRMED',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportInventoryCSV: (products) => {
    const headers = [
      'Product ID',
      'Product Name',
      'Code / SKU',
      'Category',
      'Current Stock',
      'Unit of Measurement',
      'Last Updated'
    ];

    const rows = products.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.code || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.stock,
      p.unit,
      p.updatedAt ? new Date(p.updatedAt).toLocaleString() : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
