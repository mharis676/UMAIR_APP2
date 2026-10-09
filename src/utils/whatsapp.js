/**
 * Ultra-simple WhatsApp message generators.
 * Straightforward format with zero clutter.
 */

function formatShortDate(timestamp) {
  try {
    const d = new Date(timestamp || Date.now());
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return new Date().toLocaleDateString();
  }
}

function openWhatsAppUrl(text) {
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Single product transaction slip (Delivery or Receiving)
 */
export function generateWhatsAppMessage(tx) {
  if (!tx) return '';

  const isReceive = tx.type === 'RECEIVED';
  const isDeliver = tx.type === 'DELIVERED';
  const dateStr = formatShortDate(tx.timestamp);

  if (isReceive) {
    const lines = [
      `Stock Received: +${tx.quantity} ${tx.unit || 'units'} (${tx.productName || 'Item'})`
    ];
    if (tx.party) lines.push(`Received from: ${tx.party}`);
    lines.push(`Total Stock: ${tx.newBalance ?? 0} ${tx.unit || 'units'}`);
    lines.push(`Date: ${dateStr}`);
    if (tx.refNumber) lines.push(`Ref: ${tx.refNumber}`);
    return lines.join('\n');
  }

  if (isDeliver) {
    const lines = [
      `Stock: ${tx.quantity} ${tx.unit || 'units'} (${tx.productName || 'Item'})`
    ];
    if (tx.party) lines.push(`Delivered to: ${tx.party}`);
    lines.push(`Remaining Stock: ${tx.newBalance ?? 0} ${tx.unit || 'units'}`);
    lines.push(`Date: ${dateStr}`);
    if (tx.refNumber) lines.push(`Ref: ${tx.refNumber}`);
    return lines.join('\n');
  }

  return `Stock: ${tx.quantity} ${tx.unit || 'units'} (${tx.productName})\nBalance: ${tx.newBalance ?? 0}\nDate: ${dateStr}`;
}

export function shareToWhatsApp(tx) {
  const text = generateWhatsAppMessage(tx);
  openWhatsAppUrl(text);
}

/**
 * Multi-product batch receiving or delivery slip
 */
export function generateBatchWhatsAppMessage({ type, items = [], party, refNumber, timestamp }) {
  const isReceive = type === 'RECEIVED';
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const dateStr = formatShortDate(timestamp);

  if (isReceive) {
    const lines = ['Stock Received:'];
    items.forEach((item, index) => {
      const name = item.productName || item.product?.name || item.name || 'Product';
      const unit = item.unit || item.product?.unit || 'units';
      const balStr = item.newBalance !== undefined ? ` (Total: ${item.newBalance})` : '';
      lines.push(`${index + 1}. ${name}: +${item.quantity} ${unit}${balStr}`);
    });
    lines.push('');
    lines.push(`Total Received: +${totalUnits} units`);
    if (party) lines.push(`Received from: ${party}`);
    lines.push(`Date: ${dateStr}`);
    if (refNumber) lines.push(`Ref: ${refNumber}`);
    return lines.join('\n');
  }

  // Delivery
  const lines = ['Stock:'];
  items.forEach((item, index) => {
    const name = item.productName || item.product?.name || item.name || 'Product';
    const unit = item.unit || item.product?.unit || 'units';
    const balStr = item.newBalance !== undefined ? ` (Remaining: ${item.newBalance})` : '';
    lines.push(`${index + 1}. ${name}: ${item.quantity} ${unit}${balStr}`);
  });
  lines.push('');
  lines.push(`Total Delivered: ${totalUnits} units`);
  if (party) lines.push(`Delivered to: ${party}`);
  lines.push(`Date: ${dateStr}`);
  if (refNumber) lines.push(`Ref: ${refNumber}`);
  return lines.join('\n');
}

export function shareBatchToWhatsApp(batchData) {
  const text = generateBatchWhatsAppMessage(batchData);
  openWhatsAppUrl(text);
}

/**
 * Single product stock inquiry
 */
export function generateProductStockMessage(product) {
  if (!product) return '';
  const dateStr = formatShortDate();
  return `Product: ${product.name}\nTotal Stock: ${product.stock || 0} ${product.unit || 'units'}\nDate: ${dateStr}`;
}

export function shareProductStockToWhatsApp(product) {
  const text = generateProductStockMessage(product);
  openWhatsAppUrl(text);
}

/**
 * Complete current inventory stock report
 */
export function generateInventoryReportMessage(products = []) {
  const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const dateStr = formatShortDate();

  const lines = [
    `Total Stock: ${totalUnits.toLocaleString()} units`,
    `Date: ${dateStr}`,
    ''
  ];

  if (products.length === 0) {
    lines.push('No products recorded.');
  } else {
    products.forEach((p, index) => {
      lines.push(`${index + 1}. ${p.name}: ${p.stock || 0} ${p.unit || 'units'}`);
    });
  }

  return lines.join('\n');
}

export function shareInventoryReportToWhatsApp(products = [], options = {}) {
  const text = generateInventoryReportMessage(products, options);
  openWhatsAppUrl(text);
}
