import React, { useRef } from 'react';
import { Database, Download, Upload, FileSpreadsheet, RotateCcw, X, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storage } from '../storage';

export default function BackupModal({ isOpen, onClose }) {
  const { products, transactions, resetAllData, importDataFromJSON, showToast } = useApp();
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    storage.exportJSON();
    showToast('Stock data backup downloaded (JSON)!');
  };

  const handleExportHistoryCSV = () => {
    storage.exportHistoryCSV(transactions);
    showToast('Transaction history CSV downloaded!');
  };

  const handleExportInventoryCSV = () => {
    storage.exportInventoryCSV(products);
    showToast('Inventory stock CSV downloaded!');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importDataFromJSON(content);
        if (res.success) {
          onClose();
        } else {
          alert('Import failed: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (window.confirm('Reset inventory and transaction history to initial sample items?')) {
      resetAllData();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--primary)" />
            <h3 className="modal-title font-heading">Data & Reports</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Data is persistently saved on this device. You can export snapshots or download CSV reports for spreadsheets anytime.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {/* Export JSON */}
          <div
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 14px' }}
            onClick={handleExportJSON}
          >
            <div
              className="category-avatar"
              style={{ background: 'var(--receive-green-light)', color: 'var(--receive-green)', width: '42px', height: '42px' }}
            >
              <Download size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>Export Full Backup</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Save complete products & transactions (JSON)</div>
            </div>
          </div>

          {/* Import JSON */}
          <div
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 14px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className="category-avatar"
              style={{ background: 'var(--deliver-blue-light)', color: 'var(--deliver-blue)', width: '42px', height: '42px' }}
            >
              <Upload size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>Restore Backup</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Load a previously exported JSON backup file</div>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />

          {/* Export CSVs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '12px' }}
              onClick={handleExportHistoryCSV}
            >
              <FileSpreadsheet size={16} color="var(--primary)" />
              CSV History
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '12px' }}
              onClick={handleExportInventoryCSV}
            >
              <FileSpreadsheet size={16} color="var(--primary)" />
              CSV Stock
            </button>
          </div>
        </div>

        {/* GitHub Actions and Mobile App info */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '12px 14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Smartphone size={16} color="var(--primary)" />
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Mobile APK & GitHub Actions</strong>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Configured in <code>.github/workflows/build-android-apk.yml</code>. Pushing to GitHub builds a downloadable Android APK automatically under Actions artifacts!
          </p>
        </div>

        {/* Reset Demo Data */}
        <button
          type="button"
          className="btn btn-secondary btn-block"
          style={{ color: 'var(--accent-rose)', borderColor: 'rgba(225, 29, 72, 0.3)', padding: '12px' }}
          onClick={handleResetData}
        >
          <RotateCcw size={15} />
          Reload Sample Demo Products
        </button>
      </div>
    </div>
  );
}
