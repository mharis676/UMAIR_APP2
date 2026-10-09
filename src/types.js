export const UNIT_OPTIONS = [
  'pieces',
  'boxes',
  'bottles',
  'packets',
  'kilograms',
  'litres',
  'cartons',
  'dozens',
  'meters',
  'sets',
  'units'
];

export const CATEGORY_OPTIONS = [
  'Confectionery & Chocolates',
  'Perfumes & Fragrances',
  'Cosmetics & Skincare',
  'Groceries & Foods',
  'Electronics & Accessories',
  'Beverages',
  'Pharmaceuticals',
  'Apparel & Textiles',
  'General Supplies'
];

export const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Ferrero Rocher Box 24s',
    code: 'CHOC-001',
    category: 'Confectionery & Chocolates',
    unit: 'boxes',
    stock: 50,
    createdAt: '2026-10-08T09:00:00Z',
    updatedAt: '2026-10-09T14:30:00Z'
  },
  {
    id: 'prod-2',
    name: 'Dior Sauvage Eau De Parfum 100ml',
    code: 'PERF-102',
    category: 'Perfumes & Fragrances',
    unit: 'bottles',
    stock: 24,
    createdAt: '2026-10-08T09:15:00Z',
    updatedAt: '2026-10-09T16:00:00Z'
  },
  {
    id: 'prod-3',
    name: 'Maybelline Matte Liquid Lipstick #15',
    code: 'COSM-305',
    category: 'Cosmetics & Skincare',
    unit: 'pieces',
    stock: 65,
    createdAt: '2026-10-08T09:30:00Z',
    updatedAt: '2026-10-09T11:20:00Z'
  },
  {
    id: 'prod-4',
    name: 'Basmati Premium Rice 5kg Bag',
    code: 'GROC-014',
    category: 'Groceries & Foods',
    unit: 'packets',
    stock: 40,
    createdAt: '2026-10-08T10:00:00Z',
    updatedAt: '2026-10-09T10:00:00Z'
  },
  {
    id: 'prod-5',
    name: 'Anker USB-C Braided Fast Cable',
    code: 'ELEC-077',
    category: 'Electronics & Accessories',
    unit: 'pieces',
    stock: 90,
    createdAt: '2026-10-08T10:15:00Z',
    updatedAt: '2026-10-09T15:10:00Z'
  },
  {
    id: 'prod-6',
    name: 'Cadbury Dairy Milk Silk Roasted Almond',
    code: 'CHOC-002',
    category: 'Confectionery & Chocolates',
    unit: 'pieces',
    stock: 110,
    createdAt: '2026-10-08T10:30:00Z',
    updatedAt: '2026-10-09T12:00:00Z'
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    productId: 'prod-1',
    productName: 'Ferrero Rocher Box 24s',
    unit: 'boxes',
    type: 'RECEIVED', // 'RECEIVED' | 'DELIVERED' | 'REVERSAL'
    quantity: 30,
    prevBalance: 20,
    newBalance: 50,
    party: 'Ferrero Logistics Dubai', // supplier or recipient
    refNumber: 'GRN-9841',
    notes: 'Initial restock from regional hub',
    operator: 'Umair (Store Manager)',
    timestamp: '2026-10-09T08:30:00Z',
    reversed: false
  },
  {
    id: 'tx-2',
    productId: 'prod-2',
    productName: 'Dior Sauvage Eau De Parfum 100ml',
    unit: 'bottles',
    type: 'RECEIVED',
    quantity: 30,
    prevBalance: 0,
    newBalance: 30,
    party: 'Parfums Christian Dior Distribution',
    refNumber: 'INV-4412',
    notes: 'Direct supplier batch delivery',
    operator: 'Umair (Store Manager)',
    timestamp: '2026-10-09T09:45:00Z',
    reversed: false
  },
  {
    id: 'tx-3',
    productId: 'prod-2',
    productName: 'Dior Sauvage Eau De Parfum 100ml',
    unit: 'bottles',
    type: 'DELIVERED',
    quantity: 6,
    prevBalance: 30,
    newBalance: 24,
    party: 'Downtown Boutique Mall',
    refNumber: 'DO-1029',
    notes: 'Urgent transfer for evening launch',
    operator: 'Ali (Storekeeper)',
    timestamp: '2026-10-09T16:00:00Z',
    reversed: false
  },
  {
    id: 'tx-4',
    productId: 'prod-5',
    productName: 'Anker USB-C Braided Fast Cable',
    unit: 'pieces',
    type: 'RECEIVED',
    quantity: 100,
    prevBalance: 0,
    newBalance: 100,
    party: 'Anker Tech Imports',
    refNumber: 'PO-8812',
    notes: 'Standard batch shipment',
    operator: 'Umair (Store Manager)',
    timestamp: '2026-10-09T11:00:00Z',
    reversed: false
  },
  {
    id: 'tx-5',
    productId: 'prod-5',
    productName: 'Anker USB-C Braided Fast Cable',
    unit: 'pieces',
    type: 'DELIVERED',
    quantity: 10,
    prevBalance: 100,
    newBalance: 90,
    party: 'Tech Zone Outlet #3',
    refNumber: 'DISP-7301',
    notes: 'Weekly store fulfillment',
    operator: 'Ali (Storekeeper)',
    timestamp: '2026-10-09T15:10:00Z',
    reversed: false
  }
];
