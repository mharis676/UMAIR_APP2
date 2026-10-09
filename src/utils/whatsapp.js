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

  const header = isReceive 
    ? '📥 *STOCK RECEIVED SLIP*' 
    : isDeliver 
    ? '🚚 *STOCK DELIVERY DISPATCH SLIP*' 
    : '🔄 *STOCK TRANSACTION SLIP*';

  const lines = [
    header,
    '━━━━━━━━━━━━━━━━━━━━',
    `📦 *Product:* ${tx.productName || 'N/A'}`,
    isReceive
      ? `📥 *Quantity Received:* +${tx.quantity} ${tx.unit || 'units'}`
      : `📤 *Quantity Delivered:* ${tx.quantity} ${tx.unit || 'units'}`,
    '',
    `📊 *Previous Stock:* ${tx.prevBalance ?? 0} ${tx.unit || 'units'}`,
    isReceive
      ? `✅ *New Stock Balance:* ${tx.newBalance ?? 0} ${tx.unit || 'units'}`
      : `✅ *Remaining Stock:* ${tx.newBalance ?? 0} ${tx.unit || 'units'}`,
    '━━━━━━━━━━━━━━━━━━━━'
  ];

  if (tx.party) {
    lines.push(isReceive ? `🏢 *Supplier:* ${tx.party}` : `🏢 *Recipient / Destination:* ${tx.party}`);
  }

  if (tx.refNumber) {
    lines.push(`📄 *Ref / Slip #:* ${tx.refNumber}`);
  }

  if (tx.operator) {
    lines.push(`👤 *Recorded By:* ${tx.operator}`);
  }

  lines.push(`🕒 *Date & Time:* ${dateFormatted}`);

  if (tx.notes) {
    lines.push(`📝 *Notes:* ${tx.notes}`);
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');
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
    '📦 *CURRENT STOCK BALANCE*',
    '━━━━━━━━━━━━━━━━━━━━',
    `📦 *Product:* ${product.name || 'N/A'}`,
    product.code ? `🏷️ *SKU / Code:* ${product.code}` : null,
    product.category ? `📂 *Category:* ${product.category}` : null,
    '',
    isOutOfStock 
      ? `⚠️ *Current In-Stock:* 0 ${product.unit || 'units'} *(OUT OF STOCK)*`
      : `✅ *Current In-Stock:* *${product.stock} ${product.unit || 'units'}*`,
    '━━━━━━━━━━━━━━━━━━━━',
    operator ? `👤 *Informed By:* ${operator}` : null,
    `🕒 *As of:* ${dateFormatted}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '_StockTrack Mobile App_'
  ].filter((line) => line !== null);

  return lines.join('\n');
}

export function shareProductStockToWhatsApp(product, operator) {
  const text = generateProductStockMessage(product, operator);
  openWhatsAppUrl(text);
}

/**
 * Format complete current inventory stock report for WhatsApp
 */
export function generateInventoryReportMessage(products = [], { categoryName = 'All Items', operator } = {}) {
  const dateFormatted = formatSlipDate();
  const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  const lines = [
    '📋 *INVENTORY STOCK REPORT*',
    '━━━━━━━━━━━━━━━━━━━━',
    categoryName && categoryName !== 'ALL' && categoryName !== 'All Items'
      ? `📂 *Category:* ${categoryName}`
      : `📂 *Scope:* Complete Inventory (All Items)`,
    `📦 *Total Products:* ${products.length} items`,
    `🔢 *Total Stock on Hand:* *${totalUnits.toLocaleString()}* units`,
    '',
    operator ? `👤 *Reported By:* ${operator}` : null,
    `🕒 *Date & Time:* ${dateFormatted}`,
    '━━━━━━━━━━━━━━━━━━━━',
    '*CURRENT STOCK BREAKDOWN:*'
  ].filter((line) => line !== null);

  if (products.length === 0) {
    lines.push('_No products recorded in this selection._');
  } else {
    products.forEach((p, index) => {
      const codeStr = p.code ? ` [${p.code}]` : '';
      const stockStr = (p.stock || 0) <= 0 ? '*0 (Out of stock)*' : `*${p.stock} ${p.unit || 'units'}*`;
      lines.push(`${index + 1}. *${p.name}*${codeStr}: ${stockStr}`);
    });
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━');
  lines.push('_StockTrack Mobile App_');

  return lines.join('\n');
}

export function shareInventoryReportToWhatsApp(products = [], options = {}) {
  const text = generateInventoryReportMessage(products, options);
  openWhatsAppUrl(text);
}


