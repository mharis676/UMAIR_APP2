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
