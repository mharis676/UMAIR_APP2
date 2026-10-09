/**
 * Helper to generate professional WhatsApp message text for stock transactions
 * and open WhatsApp directly on mobile and web.
 */

export function generateWhatsAppMessage(tx) {
  if (!tx) return '';

  const isReceive = tx.type === 'RECEIVED';
  const isDeliver = tx.type === 'DELIVERED';
  const dateFormatted = new Date(tx.timestamp || Date.now()).toLocaleString();

  let header = isReceive 
    ? '📥 *STOCK RECEIVED SLIP*' 
    : isDeliver 
    ? '🚚 *STOCK DELIVERY DISPATCH SLIP*' 
    : '🔄 *STOCK TRANSACTION SLIP*';

  let lines = [
    header,
    '━━━━━━━━━━━━━━━━━━',
    `🔹 *Product:* ${tx.productName || 'N/A'}`,
    isReceive
      ? `📥 *Quantity Received:* +${tx.quantity} ${tx.unit || 'units'}`
      : `📤 *Quantity Delivered:* -${tx.quantity} ${tx.unit || 'units'}`,
    `📊 *Previous Stock:* ${tx.prevBalance ?? 0} ${tx.unit || 'units'}`,
    isReceive
      ? `✅ *New Stock Balance:* ${tx.newBalance ?? 0} ${tx.unit || 'units'}`
      : `✅ *Remaining Balance:* ${tx.newBalance ?? 0} ${tx.unit || 'units'}`,
    '━━━━━━━━━━━━━━━━━━'
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

  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(`_Tracking ID: #${tx.id || 'N/A'}_`);
  lines.push('_StockTrack Mobile App_');

  return lines.join('\n');
}

export function shareToWhatsApp(tx) {
  const text = generateWhatsAppMessage(tx);
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  
  // Open in new tab or trigger WhatsApp native mobile app
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Format single product current stock balance for WhatsApp
 */
export function generateProductStockMessage(product, operator) {
  if (!product) return '';

  const dateFormatted = new Date().toLocaleString();
  const isOutOfStock = (product.stock || 0) <= 0;

  const lines = [
    '📦 *CURRENT STOCK BALANCE*',
    '━━━━━━━━━━━━━━━━━━',
    `🔹 *Product:* ${product.name || 'N/A'}`,
    product.code ? `🏷️ *SKU / Code:* ${product.code}` : null,
    product.category ? `📂 *Category:* ${product.category}` : null,
    isOutOfStock 
      ? `⚠️ *Current In-Stock:* 0 ${product.unit || 'units'} *(OUT OF STOCK)*`
      : `✅ *Current In-Stock:* *${product.stock} ${product.unit || 'units'}*`,
    '━━━━━━━━━━━━━━━━━━',
    operator ? `👤 *Informed By:* ${operator}` : null,
    `🕒 *As of:* ${dateFormatted}`,
    '━━━━━━━━━━━━━━━━━━',
    '_StockTrack Mobile App - Real-Time Quantity Tracking_'
  ].filter(Boolean);

  return lines.join('\n');
}

export function shareProductStockToWhatsApp(product, operator) {
  const text = generateProductStockMessage(product, operator);
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Format complete current inventory stock report for WhatsApp
 */
export function generateInventoryReportMessage(products = [], { categoryName = 'All Items', operator } = {}) {
  const dateFormatted = new Date().toLocaleString();
  const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  const lines = [
    '📋 *INVENTORY STOCK REPORT*',
    '━━━━━━━━━━━━━━━━━━',
    categoryName && categoryName !== 'ALL' && categoryName !== 'All Items'
      ? `📂 *Category:* ${categoryName}`
      : `📂 *Scope:* Complete Inventory (All Items)`,
    `📦 *Total Products:* ${products.length} items`,
    `🔢 *Total Stock on Hand:* *${totalUnits.toLocaleString()}* units`,
    operator ? `👤 *Reported By:* ${operator}` : null,
    `🕒 *Date & Time:* ${dateFormatted}`,
    '━━━━━━━━━━━━━━━━━━',
    '*CURRENT STOCK BREAKDOWN:*'
  ].filter(Boolean);

  if (products.length === 0) {
    lines.push('_No products recorded in this selection._');
  } else {
    products.forEach((p, index) => {
      const codeStr = p.code ? ` [${p.code}]` : '';
      const stockStr = (p.stock || 0) <= 0 ? '*0 (Out of stock)*' : `*${p.stock} ${p.unit || 'units'}*`;
      lines.push(`${index + 1}. *${p.name}*${codeStr}: ${stockStr}`);
    });
  }

  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('_StockTrack Mobile App - Real-Time Quantity Tracking_');

  return lines.join('\n');
}

export function shareInventoryReportToWhatsApp(products = [], options = {}) {
  const text = generateInventoryReportMessage(products, options);
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

