export function loadLedger() {
  try {
    const saved = localStorage.getItem('stocktrack_ledger_v2');
    if (saved) return JSON.parse(saved);
    return {
      products: JSON.parse(localStorage.getItem('stocktrack_products_v1') || '[]'),
      transactions: JSON.parse(localStorage.getItem('stocktrack_transactions_v1') || '[]'),
    };
  } catch {
    throw new Error('Saved stock records could not be read. Keep app data intact to recover them.');
  }
}
export function recordMovement(ledger, entry) {
  if (!['RECEIVED', 'DELIVERED'].includes(entry.type)) throw new Error('Choose receive or deliver.');
  const quantity = Number(entry.quantity);
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Enter a positive whole quantity.');
  const products = ledger.products.map(p => ({ ...p }));
  let product = products.find(p => p.id === entry.productId);
  const recordedAt = new Date().toISOString();
  const timestamp = entry.timestamp || recordedAt;
  if (!product) {
    if (entry.productId || entry.type !== 'RECEIVED') throw new Error('Select an existing product.');
    const name = entry.name?.trim();
    if (!name) throw new Error('Enter a product name.');
    if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) throw new Error('This product exists. Select it from the list.');
    product = { id: crypto.randomUUID(), name, unit: entry.unit || 'pieces', stock: 0, createdAt: timestamp };
    products.push(product);
  }
  const prevBalance = product.stock;
  const newBalance = prevBalance + (entry.type === 'RECEIVED' ? quantity : -quantity);
  if (!Number.isSafeInteger(newBalance) || newBalance < 0) throw new Error('Not enough stock available, or quantity is too large.');
  product.stock = newBalance;
  product.updatedAt = timestamp;
  const transaction = { id: crypto.randomUUID(), productId: product.id, productName: product.name, unit: product.unit, type: entry.type, quantity, prevBalance, newBalance, notes: entry.notes?.trim() || '', timestamp, recordedAt };
  return { products, transactions: [transaction, ...ledger.transactions] };
}

export function cancelMovement(ledger, transactionId, reason) {
  if (!reason?.trim()) throw new Error('Enter a reason for cancelling this entry.');
  const original = ledger.transactions.find(t => t.id === transactionId);
  if (!original || !['RECEIVED', 'DELIVERED'].includes(original.type)) throw new Error('This entry cannot be cancelled.');
  if (original.reversed) throw new Error('This entry has already been cancelled.');
  const product = ledger.products.find(p => p.id === original.productId);
  if (!product) throw new Error('The product for this entry could not be found.');
  const stock = product.stock + (original.type === 'RECEIVED' ? -original.quantity : original.quantity);
  if (!Number.isSafeInteger(stock) || stock < 0) throw new Error('Cannot cancel this receipt: some of this stock has already been delivered.');
  const timestamp = new Date().toISOString();
  const reversal = { ...original, id: crypto.randomUUID(), type: 'CANCELLATION', originalTxId: original.id,
    prevBalance: product.stock, newBalance: stock, timestamp, recordedAt: timestamp, notes: reason.trim(), reversed: false };
  return {
    products: ledger.products.map(p => p.id === product.id ? { ...p, stock, updatedAt: timestamp } : p),
    transactions: [reversal, ...ledger.transactions.map(t => t.id === original.id ? { ...t, reversed: true, reversalReason: reason.trim(), reversedAt: timestamp, reversalTxId: reversal.id } : t)],
  };
}

// Use local calendar boundaries, including the whole final day and DST changes.
export function matchesDate(timestamp, period, from = '', to = '', now = new Date()) {
  if (period === 'all') return true;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  if (period === 'week') start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  if (period === 'custom') {
    if (from && to && from > to) return false;
    const lower = from ? new Date(`${from}T00:00:00`) : null;
    const upper = to ? new Date(`${to}T00:00:00`) : null;
    if (upper) upper.setDate(upper.getDate() + 1);
    return (!lower || date >= lower) && (!upper || date < upper);
  }
  return date >= start && date < end;
}

export function receiptText(transaction) {
  return batchReceiptText({ ...transaction, items: [transaction] });
}

export function productSummary(ledger, productId) {
  const movements = ledger.transactions.filter(t => t.productId === productId);
  const active = movements.filter(t => !t.reversed);
  return {
    received: active.filter(t => t.type === 'RECEIVED').reduce((sum, t) => sum + t.quantity, 0),
    delivered: active.filter(t => t.type === 'DELIVERED').reduce((sum, t) => sum + t.quantity, 0),
    count: movements.length,
    latest: movements.reduce((latest, t) => !latest || new Date(t.timestamp) > new Date(latest.timestamp) ? t : latest, null),
  };
}

export function recordBatch(ledger, entry) {
  if (!Array.isArray(entry.items) || !entry.items.length) throw new Error('Add at least one item.');
  const batchId = crypto.randomUUID();
  const now = new Date();
  let timestamp = now.toISOString();
  if (entry.entryDate) {
    const date = new Date(`${entry.entryDate}T12:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.entryDate) || Number.isNaN(date.getTime()) || localDateKey(date) !== entry.entryDate || entry.entryDate > localDateKey(now)) throw new Error('Choose a valid entry date today or earlier.');
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    timestamp = date.toISOString();
  }
  let next = ledger;
  const lines = [];
  for (const [index, item] of entry.items.entries()) {
    try {
      next = recordMovement(next, { ...item, type: entry.type, notes: entry.notes, timestamp });
      const transaction = { ...next.transactions[0], batchId, timestamp };
      next = { ...next, transactions: [transaction, ...next.transactions.slice(1)] };
      lines.push(transaction);
    } catch (error) { throw new Error(`Item ${index + 1}: ${error.message}`); }
  }
  const result = { ...next, transactions: [...lines, ...ledger.transactions] };
  if (entry.entryDate && entry.entryDate < localDateKey(now) && entry.type === 'DELIVERED') {
    for (const productId of new Set(lines.map(t => t.productId))) {
      const product = result.products.find(p => p.id === productId);
      const history = result.transactions.filter(t => t.productId === productId).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp) || new Date(a.recordedAt || a.timestamp) - new Date(b.recordedAt || b.timestamp));
      let balance = product.stock - history.reduce((sum, t) => sum + movementDelta(t), 0);
      for (const transaction of history) {
        balance += movementDelta(transaction);
        if (balance < 0) throw new Error(`Not enough historical stock for ${product.name}. Choose a later date or record the missing receipt first.`);
      }
    }
  }
  return result;
}

export function groupMovements(transactions) {
  const groups = new Map();
  for (const transaction of transactions) {
    const key = transaction.batchId || transaction.id;
    if (!groups.has(key)) groups.set(key, { ...transaction, id: key, items: [] });
    groups.get(key).items.push(transaction);
  }
  return [...groups.values()].map(group => ({ ...group, reversed: group.items.every(t => t.reversed) }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function cancelBatch(ledger, groupId, reason) {
  const items = ledger.transactions.filter(t => (t.batchId || t.id) === groupId);
  if (!items.length) throw new Error('Receipt not found.');
  if (items.every(t => t.reversed)) throw new Error('This entry has already been cancelled.');
  let next = ledger;
  const cancellationId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  // Reverse line order so repeated products unwind their balance changes correctly.
  for (const item of [...items].reverse().filter(t => !t.reversed)) {
    next = cancelMovement(next, item.id, reason);
    next = { ...next, transactions: [{ ...next.transactions[0], batchId: cancellationId, timestamp }, ...next.transactions.slice(1)] };
  }
  return next;
}

export function batchReceiptText(group) {
  const received = group.type === 'RECEIVED';
  const delivered = group.type === 'DELIVERED';
  const title = received ? 'STOCK RECEIVED' : delivered ? 'STOCK DELIVERED' : 'STOCK CORRECTION';
  const label = received ? 'Received' : delivered ? 'Delivered' : 'Adjusted';
  const date = new Date(group.timestamp);
  const totals = Object.entries(group.items.reduce((result, item) => {
    result[item.unit] = (result[item.unit] || 0) + item.quantity;
    return result;
  }, {})).map(([unit, quantity]) => `${quantity.toLocaleString()} ${unit}`).join(' · ');
  return [
    `*${title}*`,
    'StockTrack',
    ...(group.reversed ? ['*CANCELLED — stock entry reversed*'] : []),
    '',
    `Date: ${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
    `Time: ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`,
    `Ref: #${group.id.slice(0, 8)}`,
    '',
    '*ITEMS*',
    ...group.items.flatMap((item, index) => [
      `${index + 1}. *${item.productName}*`,
      `   ${label}: ${item.quantity.toLocaleString()} ${item.unit}`,
      `   Balance when saved: ${item.newBalance.toLocaleString()} ${item.unit}`,
      ...(item.reversed ? [`   Cancelled: ${item.reversalReason || 'See correction entry'}`] : []),
      '',
    ]),
    `*${group.items.length} ${group.items.length === 1 ? 'item' : 'items'} · Recorded quantities*`,
    totals,
    ...(group.notes ? ['', `Notes: ${group.notes}`] : []),
    '',
    'Balances shown are when this entry was saved.',
  ].join('\n');
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function movementDelta(transaction) {
  return transaction.newBalance - transaction.prevBalance;
}

export function dailySummary(ledger, day) {
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return ledger.products.map(product => {
    const history = ledger.transactions.filter(t => t.productId === product.id);
    const today = history.filter(t => new Date(t.timestamp) >= start && new Date(t.timestamp) < end);
    const opening = product.stock - history.filter(t => new Date(t.timestamp) >= start).reduce((sum, t) => sum + movementDelta(t), 0);
    const received = today.filter(t => t.type === 'RECEIVED').reduce((sum, t) => sum + t.quantity, 0);
    const delivered = today.filter(t => t.type === 'DELIVERED').reduce((sum, t) => sum + t.quantity, 0);
    const correction = today.filter(t => !['RECEIVED', 'DELIVERED'].includes(t.type)).reduce((sum, t) => sum + movementDelta(t), 0);
    const remaining = opening + received - delivered + correction;
    return { ...product, opening, received, delivered, correction, remaining };
  });
}

export function availableStockText(products, now = new Date()) {
  const available = products.filter(p => p.stock > 0).sort((a, b) => a.name.localeCompare(b.name));
  const totals = Object.entries(available.reduce((result, p) => { result[p.unit] = (result[p.unit] || 0) + p.stock; return result; }, {}));
  return ['*AVAILABLE STOCK*', 'StockTrack', `As of: ${now.toLocaleString()}`, '', ...available.map((p, i) => `${i + 1}. *${p.name}*\n   Available: ${p.stock.toLocaleString()} ${p.unit}`), '', `*${available.length} products in stock*`, ...totals.map(([unit, qty]) => `${qty.toLocaleString()} ${unit}`), 'Snapshot of current stock.'].join('\n');
}

export function serializeLedgerBackup(ledger) {
  return JSON.stringify({
    version: '2.0',
    exportedAt: new Date().toISOString(),
    ledger: {
      products: ledger.products,
      transactions: ledger.transactions,
    }
  }, null, 2);
}

export function parseLedgerBackup(jsonString) {
  let parsed;
  try {
    parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch {
    throw new Error('Invalid backup file: file is not valid JSON.');
  }
  const data = (parsed && parsed.ledger) ? parsed.ledger : parsed;
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.transactions)) {
    throw new Error('Invalid backup file format: missing products or transactions.');
  }
  return {
    products: data.products,
    transactions: data.transactions,
  };
}

export function inventoryCSV(products) {
  const headers = ['Product ID', 'Product Name', 'Unit', 'Current Stock', 'Status'];
  const rows = products.map(p => [
    p.id,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${(p.unit || '').replace(/"/g, '""')}"`,
    p.stock,
    p.stock > 0 ? 'In Stock' : 'Out of Stock'
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function recordsCSV(transactions) {
  const headers = ['Transaction ID', 'Date & Time', 'Product Name', 'Type', 'Quantity', 'Unit', 'Previous Balance', 'New Balance', 'Status', 'Notes'];
  const rows = transactions.map(t => [
    t.id,
    new Date(t.timestamp).toISOString(),
    `"${(t.productName || '').replace(/"/g, '""')}"`,
    t.type,
    t.quantity,
    `"${(t.unit || '').replace(/"/g, '""')}"`,
    t.prevBalance,
    t.newBalance,
    t.reversed ? 'CANCELLED' : 'ACTIVE',
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
