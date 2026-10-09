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
            <Database size={18} color="#818cf8" />
            <h3 className="modal-title font-heading">Data & Reports</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Reliable local storage keeps all products and transactions secure. You can also export backups or reports anytime.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {/* Export JSON */}
          <button
            type="button"
            className="action-btn-large"
            onClick={handleExportJSON}
          >
            <div className="action-icon-circle green">
              <Download size={20} />
            </div>
            <div>
              <span className="action-text-title">Export Backup (JSON)</span>
              <span className="action-text-desc">Save entire inventory & transactions snapshot</span>
            </div>
          </button>

          {/* Import JSON */}
          <button
            type="button"
            className="action-btn-large"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="action-icon-circle cyan">
              <Upload size={20} />
            </div>
            <div>
              <span className="action-text-title">Restore Backup (JSON)</span>
              <span className="action-text-desc">Load previously saved data file</span>
            </div>
          </button>
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
              style={{ fontSize: '0.8rem', padding: '10px' }}
              onClick={handleExportHistoryCSV}
            >
              <FileSpreadsheet size={16} />
              CSV Transactions
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '10px' }}
              onClick={handleExportInventoryCSV}
            >
              <FileSpreadsheet size={16} />
              CSV Inventory
            </button>
          </div>
        </div>

        {/* GitHub Actions and Mobile App info */}
        <div style={{ background: '#0d131f', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Smartphone size={16} color="#38bdf8" />
            <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>Mobile & GitHub Actions Ready</strong>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Native Android capacitor configuration is ready in <code>/android</code> and GitHub Actions workflows are configured in <code>.github/workflows/build-android-apk.yml</code> to build an APK automatically upon push!
          </p>
        </div>

        {/* Reset Demo Data */}
        <button
          type="button"
          className="btn btn-secondary btn-block"
          style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          onClick={handleResetData}
        >
          <RotateCcw size={16} />
          Reload Sample Demo Data
        </button>
      </div>
    </div>
  );
}
