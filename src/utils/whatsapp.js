/**
 * WhatsApp message generation utilities.
 * Uses clean, universal ASCII formatting (no non-standard symbols or emojis)
 * to prevent character replacement errors () across all Android and iOS devices.
 */

function formatSlipDate(timestamp) {
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
  // Universal WhatsApp deep link: works natively on Android, iOS & WhatsApp Web
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Single-product transaction slip (Receiving or Delivery)
 */
export function generateWhatsAppMessage(tx) {
  if (!tx) return '';

  const isReceive = tx.type === 'RECEIVED';
  const isDeliver = tx.type === 'DELIVERED';
  const dateFormatted = formatSlipDate(tx.timestamp);

  const title = isReceive 
    ? '*STOCK RECEIVED SLIP*' 
    : isDeliver 
    ? '*STOCK DELIVERY DISPATCH SLIP*' 
    : '*STOCK TRANSACTION SLIP*';

  const lines = [
    title,
    '----------------------------------------',
    `Product: *${tx.productName || 'N/A'}*`,
    isReceive
      ? `Quantity Received: *+${tx.quantity} ${tx.unit || 'units'}*`
      : `Quantity Dispatched: *-${tx.quantity} ${tx.unit || 'units'}*`,
    '',
    `Previous Stock: ${tx.prevBalance ?? 0} ${tx.unit || 'units'}`,
    isReceive
      ? `Updated Balance: *${tx.newBalance ?? 0} ${tx.unit || 'units'}*`
      : `Remaining Balance: *${tx.newBalance ?? 0} ${tx.unit || 'units'}*`,
    '----------------------------------------'
  ];

  if (tx.party) {
    lines.push(isReceive ? `Supplier: *${tx.party}*` : `Recipient: *${tx.party}*`);
  }

  if (tx.refNumber) {
    lines.push(`Ref / DO #: *${tx.refNumber}*`);
  }

  lines.push(`Date & Time: ${dateFormatted}`);

  if (tx.notes) {
    lines.push(`Notes: _${tx.notes}_`);
  }

  lines.push('----------------------------------------');
  lines.push('_StockTrack App_');

  return lines.join('\n');
}

export function shareToWhatsApp(tx) {
  const text = generateWhatsAppMessage(tx);
  openWhatsAppUrl(text);
}

/**
 * Multi-product batch receiving or delivery slip
 */
export function generateBatchWhatsAppMessage({ type, items = [], party, refNumber, notes, timestamp }) {
  const isReceive = type === 'RECEIVED';
  const dateFormatted = formatSlipDate(timestamp);
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 0), 0);

  const title = isReceive 
    ? '*STOCK RECEIVED SLIP*' 
    : '*STOCK DELIVERY DISPATCH SLIP*';

  const lines = [
    title,
    '----------------------------------------',
    isReceive
      ? (party ? `Supplier: *${party}*` : null)
      : (party ? `Recipient: *${party}*` : null),
    refNumber ? `Ref / DO #: *${refNumber}*` : null,
    `Total Products: ${items.length} ${items.length === 1 ? 'item' : 'items'}`,
    `Total Units: *${totalUnits.toLocaleString()}* units`,
    `Date & Time: ${dateFormatted}`,
    '----------------------------------------',
    '',
    isReceive ? '*RECEIVED ITEMS:*' : '*DISPATCHED ITEMS:*',
    ''
  ].filter((line) => line !== null);

  items.forEach((item, index) => {
    const qtySign = isReceive ? '+' : '-';
    const name = item.productName || item.product?.name || item.name || 'Product';
    const unit = item.unit || item.product?.unit || 'units';
    const sku = item.code || item.product?.code ? ` [${item.code || item.product?.code}]` : '';
    const balance = item.newBalance !== undefined 
      ? `\n   Balance: ${item.newBalance} ${unit}`
      : '';

    lines.push(`${index + 1}. *${name}*${sku}`);
    lines.push(`   Quantity: *${qtySign}${item.quantity} ${unit}*${balance}`);
    lines.push('');
  });

  if (notes) {
    lines.push('----------------------------------------');
    lines.push(`Notes: _${notes}_`);
  }

  lines.push('----------------------------------------');
  lines.push('_StockTrack App_');

  return lines.join('\n');
}

export function shareBatchToWhatsApp(batchData) {
  const text = generateBatchWhatsAppMessage(batchData);
  openWhatsAppUrl(text);
}

/**
 * Single product current stock balance inquiry
 */
export function generateProductStockMessage(product) {
  if (!product) return '';

  const dateFormatted = formatSlipDate();
  const isOutOfStock = (product.stock || 0) <= 0;
  const sku = product.code ? `\nSKU / Code: *${product.code}*` : '';
  const category = product.category ? `\nCategory: *${product.category}*` : '';

  const lines = [
    '*CURRENT STOCK BALANCE*',
    '----------------------------------------',
    `Product: *${product.name || 'N/A'}*${sku}${category}`,
    '',
    isOutOfStock 
      ? `In-Stock: *0 ${product.unit || 'units'} (OUT OF STOCK)*`
      : `In-Stock: *${product.stock} ${product.unit || 'units'}*`,
    '----------------------------------------',
    `Date & Time: ${dateFormatted}`,
    '----------------------------------------',
    '_StockTrack App_'
  ];

  return lines.join('\n');
}

export function shareProductStockToWhatsApp(product) {
  const text = generateProductStockMessage(product);
  openWhatsAppUrl(text);
}

/**
 * Complete current inventory stock report
 */
export function generateInventoryReportMessage(products = [], { categoryName = 'All Items' } = {}) {
  const dateFormatted = formatSlipDate();
  const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const scopeLabel = categoryName && categoryName !== 'ALL' && categoryName !== 'All Items'
    ? categoryName
    : 'Complete Inventory (All Items)';

  const lines = [
    '*INVENTORY STOCK REPORT*',
    '----------------------------------------',
    `Scope: ${scopeLabel}`,
    `Total Products: ${products.length} items`,
    `Total Stock on Hand: *${totalUnits.toLocaleString()}* units`,
    `Date & Time: ${dateFormatted}`,
    '----------------------------------------',
    '',
    '*CURRENT STOCK BREAKDOWN:*',
    ''
  ];

  if (products.length === 0) {
    lines.push('_No products recorded in this selection._');
  } else {
    products.forEach((p, index) => {
      const codeStr = p.code ? ` [${p.code}]` : '';
      const stockStr = (p.stock || 0) <= 0 
        ? '*0 (Out of stock)*' 
        : `*${p.stock} ${p.unit || 'units'}*`;
      lines.push(`${index + 1}. *${p.name}*${codeStr}`);
      lines.push(`   Stock: ${stockStr}`);
      lines.push('');
    });
  }

  lines.push('----------------------------------------');
  lines.push('_StockTrack App_');

  return lines.join('\n');
}

export function shareInventoryReportToWhatsApp(products = [], options = {}) {
  const text = generateInventoryReportMessage(products, options);
  openWhatsAppUrl(text);
}
