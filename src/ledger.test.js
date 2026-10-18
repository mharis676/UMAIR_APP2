import test from 'node:test';
import assert from 'node:assert/strict';
import { recordMovement, loadLedger } from './ledger.js';
const receipt = { type: 'RECEIVED', name: 'Water', unit: 'boxes', quantity: '10', party: 'Supplier' };
test('receive then deliver preserves history and balances without mutating prior records', () => {
  const first = recordMovement({ products: [], transactions: [] }, receipt);
  const next = recordMovement(first, { type: 'DELIVERED', productId: first.products[0].id, quantity: '4', party: 'Customer' });
  assert.equal(next.products[0].stock, 6);
  assert.equal(first.products[0].stock, 10);
  assert.equal(next.transactions.length, 2);
  assert.equal(next.transactions[0].prevBalance, 10);
  assert.equal(next.transactions[0].newBalance, 6);
});
test('rejects over-delivery, fractions and invalid quantities', () => {
  const ledger = recordMovement({ products: [], transactions: [] }, receipt);
  for (const quantity of ['11', '-1', '0', '1.5', 'NaN', 'Infinity', '']) {
    assert.throws(() => recordMovement(ledger, { type: 'DELIVERED', productId: ledger.products[0].id, quantity, party: 'Customer' }));
  }

  assert.throws(() => recordMovement(ledger, { ...receipt, name: 'water' }));
  assert.equal(ledger.products[0].stock, 10);
});
test('new install is empty and legacy data is preserved', () => {
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null };
  assert.deepEqual(loadLedger(), { products: [], transactions: [] });
  const ledger = recordMovement({ products: [], transactions: [] }, receipt);
  values.set('stocktrack_products_v1', JSON.stringify(ledger.products));
  values.set('stocktrack_transactions_v1', JSON.stringify(ledger.transactions));
  assert.deepEqual(loadLedger(), ledger);
  values.set('stocktrack_ledger_v2', JSON.stringify({ products: [], transactions: [] }));
  assert.deepEqual(loadLedger(), { products: [], transactions: [] });
});

test('cancellation keeps original receipt and creates a separate audit entry', async () => {
  const { cancelMovement } = await import('./ledger.js');
  const first = recordMovement({ products: [], transactions: [] }, receipt);
  const original = first.transactions[0];
  const cancelled = cancelMovement(first, original.id, 'Wrong quantity');
  assert.equal(cancelled.products[0].stock, 0);
  assert.equal(first.products[0].stock, 10);
  assert.equal(cancelled.transactions[1].quantity, 10);
  assert.equal(cancelled.transactions[1].reversed, true);
  assert.equal(cancelled.transactions[1].reversalReason, 'Wrong quantity');
  assert.equal(cancelled.transactions[0].originalTxId, original.id);
  assert.equal(cancelled.transactions[0].newBalance, 0);
  assert.throws(() => cancelMovement(cancelled, original.id, 'Again'));
  assert.throws(() => cancelMovement(first, original.id, ' '));
  assert.throws(() => cancelMovement(cancelled, cancelled.transactions[0].id, 'Cancel cancellation'));
});
test('cancelling deliveries returns stock; receipts cannot produce negative stock', async () => {
  const { cancelMovement } = await import('./ledger.js');
  const first = recordMovement({ products: [], transactions: [] }, receipt);
  const delivered = recordMovement(first, { type: 'DELIVERED', productId: first.products[0].id, quantity: 4, party: 'Customer' });
  assert.throws(() => cancelMovement(delivered, first.transactions[0].id, 'Mistake'));
  const cancelled = cancelMovement(delivered, delivered.transactions[0].id, 'Wrong recipient');
  assert.equal(cancelled.products[0].stock, 10);
  assert.equal(cancelMovement(cancelled, first.transactions[0].id, 'Mistake').products[0].stock, 0);
});
test('date filters include local calendar boundaries and Monday week start', async () => {
  const { matchesDate } = await import('./ledger.js');
  const now = new Date(2026, 9, 18, 12);
  assert.equal(matchesDate(new Date(2026, 9, 18, 0).toISOString(), 'today', '', '', now), true);
  assert.equal(matchesDate(new Date(2026, 9, 19, 0).toISOString(), 'today', '', '', now), false);
  assert.equal(matchesDate(new Date(2026, 9, 12, 0).toISOString(), 'week', '', '', now), true);
  assert.equal(matchesDate(new Date(2026, 9, 11, 23, 59).toISOString(), 'week', '', '', now), false);
  assert.equal(matchesDate(new Date(2026, 9, 18, 23, 59, 59).toISOString(), 'custom', '2026-10-17', '2026-10-18'), true);
  assert.equal(matchesDate(new Date(2026, 9, 19).toISOString(), 'custom', '2026-10-17', '2026-10-18'), false);
  assert.equal(matchesDate(now.toISOString(), 'custom', '2026-10-19', '2026-10-18'), false);
  assert.equal(matchesDate(now.toISOString(), 'custom', '', '2026-10-18'), true);
});
test('receipts identify movement and cancellation status', async () => {
  const { receiptText, cancelMovement } = await import('./ledger.js');
  const first = recordMovement({ products: [], transactions: [] }, receipt);
  const text = receiptText(first.transactions[0]);
  assert.match(text, /STOCK RECEIVED/);
  assert.match(text, /10 boxes/);
  assert.doesNotMatch(text, /Supplier|Received from|Delivered to/);
  const cancelled = cancelMovement(first, first.transactions[0].id, 'Duplicate entry');
  assert.match(receiptText(cancelled.transactions[1]), /CANCELLED/);
  assert.match(receiptText(cancelled.transactions[1]), /Duplicate entry/);
});

test('product detail totals exclude cancelled entries and other products', async () => {
  const { productSummary, cancelMovement } = await import('./ledger.js');
  const received = recordMovement({ products: [], transactions: [] }, receipt);
  const id = received.products[0].id;
  const delivered = recordMovement(received, { type: 'DELIVERED', productId: id, quantity: 4, party: 'Customer' });
  const other = recordMovement(delivered, { ...receipt, name: 'Tea', quantity: 20 });
  assert.equal(productSummary(other, id).received, 10);
  assert.equal(productSummary(other, id).delivered, 4);
  assert.equal(productSummary(other, id).count, 2);
  const cancelled = cancelMovement(other, delivered.transactions[0].id, 'Wrong recipient');
  const summary = productSummary(cancelled, id);
  assert.equal(summary.received, 10);
  assert.equal(summary.delivered, 0);
  assert.equal(summary.count, 3);
  assert.equal(productSummary(cancelled, 'missing').latest, null);
});

test('multi-item receipts are grouped, share all lines and preserve old records', async () => {
  const { recordBatch, groupMovements, batchReceiptText } = await import('./ledger.js');
  const original = recordMovement({ products: [], transactions: [] }, receipt);
  const batch = recordBatch(original, { type: 'RECEIVED', party: 'Warehouse', notes: 'Morning shipment', items: [{ name: 'Tea', quantity: 6, unit: 'boxes' }, { name: 'Juice', quantity: 12, unit: 'bottles' }] });
  assert.equal(batch.products.length, 3);
  assert.equal(original.products.length, 1);
  assert.equal(batch.transactions[0].batchId, batch.transactions[1].batchId);
  assert.equal(batch.transactions[0].timestamp, batch.transactions[1].timestamp);
  const groups = groupMovements(batch.transactions);
  assert.equal(groups.length, 2);
  const group = groups.find(g => g.items.length === 2);
  assert.match(batchReceiptText(group), /\*Tea\*/);
  assert.match(batchReceiptText(group), /Received: 6 boxes/);
  assert.match(batchReceiptText(group), /\*Juice\*/);
  assert.match(batchReceiptText(group), /Received: 12 bottles/);
  assert.doesNotMatch(batchReceiptText(group), /Warehouse/);
  const second = recordBatch(batch, { type: 'RECEIVED', party: 'Warehouse', items: [{ productId: batch.products[1].id, quantity: 2 }] });
  assert.equal(groupMovements(second.transactions).length, 3);
});
test('batch delivery validates all lines and cumulative duplicate-product quantities atomically', async () => {
  const { recordBatch } = await import('./ledger.js');
  const original = recordMovement({ products: [], transactions: [] }, receipt);
  const id = original.products[0].id;
  const snapshot = JSON.stringify(original);
  assert.throws(() => recordBatch(original, { type: 'DELIVERED', party: 'Customer', items: [{ productId: id, quantity: 6 }, { productId: id, quantity: 5 }] }), /Item 2/);
  assert.equal(JSON.stringify(original), snapshot);
  const next = recordBatch(original, { type: 'DELIVERED', party: 'Customer', items: [{ productId: id, quantity: 6 }, { productId: id, quantity: 4 }] });
  assert.equal(next.products[0].stock, 0);
  assert.equal(next.transactions[1].prevBalance, 4);
  assert.throws(() => recordBatch(original, { type: 'RECEIVED', party: 'Supplier', items: [{ name: 'Tea', quantity: 10 }, { name: '', quantity: 1 }] }));
  assert.equal(JSON.stringify(original), snapshot);
  assert.throws(() => recordBatch(original, { type: 'DELIVERED', party: 'Customer', items: [] }));
});
test('complete batch cancellation restores balances and is atomic when one item is unavailable', async () => {
  const { recordBatch, cancelBatch, groupMovements, batchReceiptText } = await import('./ledger.js');
  const original = recordBatch({ products: [], transactions: [] }, { type: 'RECEIVED', party: 'Supplier', items: [{ name: 'Tea', quantity: 10 }, { name: 'Juice', quantity: 10 }] });
  const batchId = original.transactions[0].batchId;
  const delivered = recordBatch(original, { type: 'DELIVERED', party: 'Customer', items: original.products.map(p => ({ productId: p.id, quantity: 4 })) });
  const snapshot = JSON.stringify(delivered);
  assert.throws(() => cancelBatch(delivered, batchId, 'Wrong receipt'));
  assert.equal(JSON.stringify(delivered), snapshot);
  const returned = cancelBatch(delivered, delivered.transactions[0].batchId, 'Wrong delivery');
  assert.deepEqual(returned.products.map(p => p.stock), [10, 10]);
  const cancelled = cancelBatch(returned, batchId, 'Wrong receipt');
  assert.deepEqual(cancelled.products.map(p => p.stock), [0, 0]);
  const group = groupMovements(cancelled.transactions).find(g => g.id === batchId);
  assert.equal(group.reversed, true);
  assert.match(batchReceiptText(group), /CANCELLED/);
  assert.throws(() => cancelBatch(cancelled, batchId, 'Again'));
  assert.equal(groupMovements(cancelled.transactions).length, 4);
});

test('stock can be received and delivered without sender or receiver names', async () => {
  const { recordBatch } = await import('./ledger.js');
  const first = recordBatch({ products: [], transactions: [] }, { type: 'RECEIVED', items: [{ name: 'Tea', unit: 'boxes', quantity: 10 }, { name: 'Juice', unit: 'bottles', quantity: 5 }] });
  assert.ok(first.transactions.every(t => !Object.hasOwn(t, 'party')));
  const next = recordBatch(first, { type: 'DELIVERED', items: first.products.map(p => ({ productId: p.id, quantity: 2 })) });
  assert.deepEqual(next.products.map(p => p.stock), [8, 3]);
  assert.ok(next.transactions.every(t => !Object.hasOwn(t, 'party')));
});
test('WhatsApp structure hides legacy parties and separates quantities by unit', async () => {
  const { batchReceiptText } = await import('./ledger.js');
  const group = { id: 'abcd1234-full-id', type: 'DELIVERED', timestamp: '2026-10-18T10:00:00Z', party: 'Legacy Person', items: [{ productName: 'Tea', quantity: 4, unit: 'boxes', newBalance: 6 }, { productName: 'Juice', quantity: 2, unit: 'bottles', newBalance: 3 }] };
  const text = batchReceiptText(group);
  assert.match(text, /^\*STOCK DELIVERED\*/);
  assert.match(text, /Ref: #abcd1234/);
  assert.match(text, /1\. \*Tea\*\n   Delivered: 4 boxes/);
  assert.match(text, /2\. \*Juice\*\n   Delivered: 2 bottles/);
  assert.match(text, /Balance when saved: 6 boxes/);
  assert.match(text, /4 boxes · 2 bottles/);
  assert.doesNotMatch(text, /Legacy Person|Received from|Delivered to|Party:|Unspecified/);
});

test('backdated entries and later cancellations produce correct daily closing balances', async () => {
  const { recordBatch, dailySummary, localDateKey, cancelBatch } = await import('./ledger.js');
  const past = new Date(); past.setDate(past.getDate() - 2);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const first = recordBatch({ products: [], transactions: [] }, { type: 'RECEIVED', entryDate: localDateKey(past), items: [{ name: 'Tea', unit: 'boxes', quantity: 10 }] });
  const next = recordBatch(first, { type: 'DELIVERED', entryDate: localDateKey(yesterday), items: [{ productId: first.products[0].id, quantity: 4 }] });
  assert.equal(localDateKey(new Date(next.transactions[0].timestamp)), localDateKey(yesterday));
  assert.equal(localDateKey(new Date(next.transactions[0].recordedAt)), localDateKey());
  let row = dailySummary(next, localDateKey(yesterday))[0];
  assert.deepEqual([row.opening, row.received, row.delivered, row.remaining], [10, 0, 4, 6]);
  const cancelled = cancelBatch(next, next.transactions[0].batchId, 'Mistake');
  row = dailySummary(cancelled, localDateKey(yesterday))[0];
  assert.equal(row.remaining, 6);
  row = dailySummary(cancelled, localDateKey())[0];
  assert.deepEqual([row.opening, row.correction, row.remaining], [6, 4, 10]);
});
test('backdated deliveries reject unavailable historical stock and invalid dates', async () => {
  const { recordBatch, localDateKey } = await import('./ledger.js');
  const first = recordBatch({ products: [], transactions: [] }, { type: 'RECEIVED', items: [{ name: 'Tea', quantity: 10 }] });
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const snapshot = JSON.stringify(first);
  assert.throws(() => recordBatch(first, { type: 'DELIVERED', entryDate: localDateKey(yesterday), items: [{ productId: first.products[0].id, quantity: 4 }] }), /historical stock/);
  for (const entryDate of ['2099-01-01', '2026-02-30', 'invalid']) assert.throws(() => recordBatch(first, { type: 'RECEIVED', entryDate, items: [{ productId: first.products[0].id, quantity: 1 }] }));
  assert.equal(JSON.stringify(first), snapshot);
});
test('available stock sharing excludes zero stock and keeps units separate', async () => {
  const { availableStockText } = await import('./ledger.js');
  const text = availableStockText([{ name: 'Tea', stock: 10, unit: 'boxes' }, { name: 'Water', stock: 3, unit: 'bottles' }, { name: 'Empty', stock: 0, unit: 'pieces' }]);
  assert.match(text, /AVAILABLE STOCK/); assert.match(text, /10 boxes/); assert.match(text, /3 bottles/); assert.match(text, /2 products in stock/); assert.doesNotMatch(text, /Empty/);
});

test('serialize and parse ledger backup round-trip and validation', async () => {
  const { serializeLedgerBackup, parseLedgerBackup, inventoryCSV, recordsCSV } = await import('./ledger.js');
  const ledger = {
    products: [{ id: 'p1', name: 'Almond "Special"', unit: 'kg', stock: 15 }],
    transactions: [{ id: 't1', productName: 'Almond "Special"', type: 'RECEIVED', quantity: 15, unit: 'kg', prevBalance: 0, newBalance: 15, timestamp: '2026-10-18T10:00:00.000Z', notes: 'First batch' }]
  };
  const json = serializeLedgerBackup(ledger);
  assert.match(json, /"version": "2.0"/);
  assert.match(json, /"Almond \\"Special\\""/);
  const restored = parseLedgerBackup(json);
  assert.deepEqual(restored.products, ledger.products);
  assert.deepEqual(restored.transactions, ledger.transactions);

  const csvInv = inventoryCSV(ledger.products);
  assert.match(csvInv, /Product ID,Product Name,Unit,Current Stock,Status/);
  assert.match(csvInv, /"Almond ""Special"""/);

  const csvRec = recordsCSV(ledger.transactions);
  assert.match(csvRec, /Transaction ID,Date & Time,Product Name,Type,Quantity,Unit/);
  assert.match(csvRec, /ACTIVE,"First batch"/);

  assert.throws(() => parseLedgerBackup('not-json'), /not valid JSON/);
  assert.throws(() => parseLedgerBackup('{"products": []}'), /missing products or transactions/);
});
