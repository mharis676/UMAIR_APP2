/**
 * Helper to generate professional WhatsApp message text for stock transactions
 * and open WhatsApp directly on mobile and web.
 */

function formatSlipDate(timestamp) {
  try {
    return new Date(timestamp || Date.now()).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return new Date().toLocaleString();
  }
}

function openWhatsAppUrl(text) {
  const encoded = encodeURIComponent(text);
  // Universal WhatsApp deep link: works natively on Android, iOS & WhatsApp Web
  const url = `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

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
    `• Product: *${tx.productName || 'N/A'}*`,
    isReceive
      ? `• Received Qty: *+${tx.quantity} ${tx.unit || 'units'}*`
      : `• Delivered Qty: *${tx.quantity} ${tx.unit || 'units'}*`,
    '',
    `• Previous Stock: ${tx.prevBalance ?? 0} ${tx.unit || 'units'}`,
    isReceive
      ? `• Updated Balance: *${tx.newBalance ?? 0} ${tx.unit || 'units'}*`
      : `• Remaining Stock: *${tx.newBalance ?? 0} ${tx.unit || 'units'}*`,
    '----------------------------------------'
  ];

  if (tx.party) {
    lines.push(isReceive ? `• Supplier: *${tx.party}*` : `• Recipient / Destination: *${tx.party}*`);
  }

  if (tx.refNumber) {
    lines.push(`• Ref / Slip #: *${tx.refNumber}*`);
  }

  lines.push(`• Date & Time: ${dateFormatted}`);

  if (tx.notes) {
    lines.push(`• Notes: _${tx.notes}_`);
  }

  lines.push('----------------------------------------');
  lines.push('_StockTrack Mobile App_');

  return lines.join('\n');
}

export function shareToWhatsApp(tx) {
  const text = generateWhatsAppMessage(tx);
  openWhatsAppUrl(text);
}

/**
 * Format single product current stock balance for WhatsApp
 */
export function generateProductStockMessage(product, operator) {
  if (!product) return '';

  const dateFormatted = formatSlipDate();
  const isOutOfStock = (product.stock || 0) <= 0;

  const lines = [
    '*CURRENT STOCK BALANCE*',
    '----------------------------------------',
    `• Product: *${product.name || 'N/A'}*`,
    product.code ? `• SKU / Code: *${product.code}*` : null,
    product.category ? `• Category: *${product.category}*` : null,
    '',
    isOutOfStock 
      ? `• In-Stock Quantity: *0 ${product.unit || 'units'} (OUT OF STOCK)*`
      : `• In-Stock Quantity: *${product.stock} ${product.unit || 'units'}*`,
    '----------------------------------------',
    `• As of: ${dateFormatted}`,
    '----------------------------------------',
    '_StockTrack Mobile App_'
  ].filter((line) => line !== null);

  return lines.join('\n');
}

export function shareProductStockToWhatsApp(product) {
  const text = generateProductStockMessage(product);
  openWhatsAppUrl(text);
}

/**
 * Format complete current inventory stock report for WhatsApp
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
    `• Scope: ${scopeLabel}`,
    `• Total Products: ${products.length} items`,
    `• Total Units on Hand: *${totalUnits.toLocaleString()}* units`,
    `• Date & Time: ${dateFormatted}`,
    '----------------------------------------',
    '',
    '*CURRENT STOCK BREAKDOWN:*',
    ''
  ].filter((line) => line !== null);

  if (products.length === 0) {
    lines.push('_No products recorded in this selection._');
  } else {
    products.forEach((p, index) => {
      const codeStr = p.code ? ` | SKU: ${p.code}` : '';
      const stockStr = (p.stock || 0) <= 0 
        ? '*0 (Out of stock)*' 
        : `*${p.stock} ${p.unit || 'units'}*`;
      lines.push(`${index + 1}. *${p.name}*`);
      lines.push(`   Qty: ${stockStr}${codeStr}`);
      lines.push('');
    });
  }

  lines.push('----------------------------------------');
  lines.push('_StockTrack Mobile App_');

  return lines.join('\n');
}

export function shareInventoryReportToWhatsApp(products = [], options = {}) {
  const text = generateInventoryReportMessage(products, options);
  openWhatsAppUrl(text);
}

/**
 * Format multi-product batch receiving or delivery slip for WhatsApp
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
      ? (party ? `• Supplier: *${party}*` : null)
      : (party ? `• Recipient: *${party}*` : null),
    refNumber ? `• Ref / Slip #: *${refNumber}*` : null,
    `• Total Products: ${items.length} items`,
    `• Total Units: *${totalUnits.toLocaleString()}* units`,
    `• Date & Time: ${dateFormatted}`,
    '----------------------------------------',
    '',
    isReceive ? '*RECEIVED ITEMS:*' : '*DELIVERED ITEMS:*',
    ''
  ].filter((line) => line !== null);

  items.forEach((item, index) => {
    const qtyStr = isReceive ? `+${item.quantity}` : `${item.quantity}`;
    const codeStr = item.code ? ` | SKU: ${item.code}` : '';
    const balStr = item.newBalance !== undefined ? ` | Balance: ${item.newBalance} ${item.unit || ''}` : '';
    lines.push(`${index + 1}. *${item.productName || item.product?.name || item.name}*`);
    lines.push(`   ${isReceive ? 'Received' : 'Dispatched'}: *${qtyStr} ${item.unit || 'units'}*${codeStr}${balStr}`);
    lines.push('');
  });

  if (notes) {
    lines.push(`• Notes: _${notes}_`);
    lines.push('');
  }

  lines.push('----------------------------------------');
  lines.push('_StockTrack Mobile App_');

  return lines.join('\n');
}

export function shareBatchToWhatsApp(batchData) {
  const text = generateBatchWhatsAppMessage(batchData);
  openWhatsAppUrl(text);
}




