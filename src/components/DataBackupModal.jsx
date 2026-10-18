import React, { useRef, useState } from 'react';
import { Database, Download, Upload, FileSpreadsheet, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { serializeLedgerBackup, parseLedgerBackup, inventoryCSV, recordsCSV } from '../ledger';
import { exportHistoryPDF, exportInventoryPDF } from '../utils/pdfExport';

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function DataBackupModal({ isOpen, onClose, ledger, onRestore }) {
  const fileInputRef = useRef(null);
  const [feedback, setFeedback] = useState({ message: '', error: false });

  if (!isOpen) return null;

  const showNotice = (message, error = false) => {
    setFeedback({ message, error });
    setTimeout(() => setFeedback({ message: '', error: false }), 4000);
  };

  const handleExportJSON = () => {
    try {
      const json = serializeLedgerBackup(ledger);
      const today = new Date().toISOString().slice(0, 10);
      downloadFile(json, `stocktrack-backup-${today}.json`, 'application/json');
      showNotice('Full backup downloaded! Keep this file safe.');
    } catch (err) {
      showNotice('Failed to export backup: ' + err.message, true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const restored = parseLedgerBackup(text);
        if (window.confirm(`Restore ${restored.products.length} products and ${restored.transactions.length} transactions? This replaces current data on this device.`)) {
          onRestore(restored);
          showNotice(`Restored ${restored.products.length} products successfully!`);
          setTimeout(onClose, 1200);
        }
      } catch (err) {
        showNotice(err.message, true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportInventoryCSV = () => {
    try {
      const csv = inventoryCSV(ledger.products);
      const today = new Date().toISOString().slice(0, 10);
      downloadFile(csv, `stock-inventory-${today}.csv`, 'text/csv;charset=utf-8;');
      showNotice('Inventory CSV spreadsheet downloaded!');
    } catch (err) {
      showNotice('Failed to export inventory CSV: ' + err.message, true);
    }
  };

  const handleExportRecordsCSV = () => {
    try {
      const csv = recordsCSV(ledger.transactions);
      const today = new Date().toISOString().slice(0, 10);
      downloadFile(csv, `stock-records-${today}.csv`, 'text/csv;charset=utf-8;');
      showNotice('Records CSV spreadsheet downloaded!');
    } catch (err) {
      showNotice('Failed to export records CSV: ' + err.message, true);
    }
  };

  const handleExportInventoryPDF = () => {
    try {
      exportInventoryPDF(ledger.products);
      showNotice('Inventory PDF report downloaded!');
    } catch (err) {
      showNotice('Failed to generate PDF: ' + err.message, true);
    }
  };

  const handleExportHistoryPDF = () => {
    try {
      exportHistoryPDF(ledger.transactions);
      showNotice('Transaction history PDF report downloaded!');
    } catch (err) {
      showNotice('Failed to generate PDF: ' + err.message, true);
    }
  };

  return (
    <dialog className="picker-dialog backup-dialog" open aria-modal="true" aria-labelledby="backup-title">
      <div className="picker-handle" />
      <div className="picker-heading">
        <div>
          <span>DATA PROTECTION & EXPORT</span>
          <h2 id="backup-title">Backup & Reports</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close backup modal">
          <X size={19} />
        </button>
      </div>

      <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: '1.5' }}>
        StockTrack saves everything on your device. Export a full backup to keep your records safe or download spreadsheet/PDF reports.
      </p>

      {feedback.message && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '12px',
            marginBottom: '14px',
            fontSize: '12px',
            fontWeight: 600,
            background: feedback.error ? '#fbeae8' : '#e5f5ed',
            color: feedback.error ? '#a83222' : '#145c43',
            border: `1px solid ${feedback.error ? '#f3cac5' : '#cde5d7'}`
          }}
        >
          {feedback.error ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="picker-options" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Full Backup Section */}
        <button type="button" className="picker-option backup-action-btn" onClick={handleExportJSON}>
          <div className="picker-option-icon" style={{ background: '#e2f2e7', color: '#186847' }}>
            <Download size={18} />
          </div>
          <span>
            <strong>Export Full Backup (JSON)</strong>
            <small>Save all {ledger.products.length} products & {ledger.transactions.length} movements</small>
          </span>
        </button>

        <button type="button" className="picker-option backup-action-btn" onClick={() => fileInputRef.current?.click()}>
          <div className="picker-option-icon" style={{ background: '#e0edf8', color: '#1d5e94' }}>
            <Upload size={18} />
          </div>
          <span>
            <strong>Restore Backup from File</strong>
            <small>Load a previous .json backup to restore stock</small>
          </span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,application/json"
          style={{ display: 'none' }}
        />

        {/* Spreadsheets Section */}
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e7ede2' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#687e6b', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
            SPREADSHEETS (EXCEL / CSV)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="picker-option"
              onClick={handleExportInventoryCSV}
              style={{ padding: '10px', border: '1px solid #dce4d6', borderRadius: '12px' }}
            >
              <FileSpreadsheet size={16} style={{ color: '#276949', flexShrink: 0 }} />
              <span style={{ fontSize: '12px' }}>
                <strong style={{ fontSize: '12px' }}>Stock CSV</strong>
                <small>Current list</small>
              </span>
            </button>
            <button
              type="button"
              className="picker-option"
              onClick={handleExportRecordsCSV}
              style={{ padding: '10px', border: '1px solid #dce4d6', borderRadius: '12px' }}
            >
              <FileSpreadsheet size={16} style={{ color: '#276949', flexShrink: 0 }} />
              <span style={{ fontSize: '12px' }}>
                <strong style={{ fontSize: '12px' }}>Records CSV</strong>
                <small>All movements</small>
              </span>
            </button>
          </div>
        </div>

        {/* PDF Reports Section */}
        <div style={{ marginTop: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#687e6b', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
            PRINTABLE PDF REPORTS
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="picker-option"
              onClick={handleExportInventoryPDF}
              style={{ padding: '10px', border: '1px solid #dce4d6', borderRadius: '12px' }}
            >
              <FileText size={16} style={{ color: '#174f43', flexShrink: 0 }} />
              <span style={{ fontSize: '12px' }}>
                <strong style={{ fontSize: '12px' }}>Stock PDF</strong>
                <small>Print summary</small>
              </span>
            </button>
            <button
              type="button"
              className="picker-option"
              onClick={handleExportHistoryPDF}
              style={{ padding: '10px', border: '1px solid #dce4d6', borderRadius: '12px' }}
            >
              <FileText size={16} style={{ color: '#174f43', flexShrink: 0 }} />
              <span style={{ fontSize: '12px' }}>
                <strong style={{ fontSize: '12px' }}>History PDF</strong>
                <small>Movement audit</small>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="picker-footer" style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{ width: '100%', minHeight: '44px', background: '#eaf2e6', border: '0', borderRadius: '12px', color: '#1f5940', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </dialog>
  );
}
