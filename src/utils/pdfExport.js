import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a PDF report of stock transactions
 */
export function exportHistoryPDF(transactions = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Stock Transaction Report', 40, 45);

  // Subtitle & Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${dateStr}  |  Total Records: ${transactions.length}`, 40, 62);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 72, doc.internal.pageSize.getWidth() - 40, 72);

  // Format table data
  const tableData = transactions.length > 0 ? transactions.map((t, idx) => {
    const isReceive = t.type === 'RECEIVED';
    const isDeliver = t.type === 'DELIVERED';
    const typeLabel = isReceive ? 'RECEIVED' : isDeliver ? 'DELIVERED' : (t.type || 'TX');
    const qtySign = isReceive ? '+' : isDeliver ? '-' : '';
    const dateFormatted = new Date(t.timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const partyLabel = t.party
      ? (isReceive ? 'From: ' + t.party : isDeliver ? 'To: ' + t.party : t.party)
      : '';
    const partyRef = [partyLabel, t.refNumber ? `Ref: ${t.refNumber}` : ''].filter(Boolean).join(' | ');

    return [
      idx + 1,
      dateFormatted,
      t.productName || 'N/A',
      typeLabel,
      `${qtySign}${t.quantity} ${t.unit || ''}`,
      `${t.prevBalance ?? 0} -> ${t.newBalance ?? 0}`,
      partyRef || '-'
    ];
  }) : [['-', '-', 'No transactions recorded yet', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: 85,
    head: [['#', 'Date & Time', 'Product', 'Type', 'Quantity', 'Balance', 'Party / Ref']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42], // sleek dark navy
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 6,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 85 },
      2: { cellWidth: 120, fontStyle: 'bold' },
      3: { cellWidth: 65, halign: 'center' },
      4: { cellWidth: 65, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 65, halign: 'center' },
      6: { cellWidth: 'auto' }
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'right' }
      );
    }
  });

  const fileDate = now.toISOString().slice(0, 10);
  doc.save(`stock-transactions-${fileDate}.pdf`);
}

/**
 * Generate and download a PDF report of current inventory stock
 */
export function exportInventoryPDF(products = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Current Inventory Report', 40, 45);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${dateStr}  |  Total Items: ${products.length}  |  Total Units: ${totalUnits.toLocaleString()}`, 40, 62);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 72, doc.internal.pageSize.getWidth() - 40, 72);

  const tableData = products.length > 0 ? products.map((p, idx) => {
    const isOut = (p.stock || 0) <= 0;
    return [
      idx + 1,
      p.name,
      p.code || '-',
      p.category || 'General',
      `${p.stock || 0} ${p.unit || 'units'}`,
      isOut ? 'OUT OF STOCK' : 'IN STOCK'
    ];
  }) : [['-', 'No products registered yet', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: 85,
    head: [['#', 'Product Name', 'SKU / Code', 'Category', 'Stock Quantity', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 6,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 150, fontStyle: 'bold' },
      2: { cellWidth: 75 },
      3: { cellWidth: 110 },
      4: { cellWidth: 85, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 'auto', halign: 'center' }
    },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'right' }
      );
    }
  });

  const fileDate = now.toISOString().slice(0, 10);
  doc.save(`stock-inventory-${fileDate}.pdf`);
}
