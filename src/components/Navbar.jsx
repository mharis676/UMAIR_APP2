import React from 'react';
import { Package, User, Plus, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ onOpenAddProduct, onOpenUserModal, onOpenBackupModal }) {
  const { operator } = useApp();

  return (
    <header className="app-header">
      <div className="brand-section">
        <img src="/logo.svg" alt="StockTrack Logo" className="brand-logo" />
        <div>
          <h1 className="brand-title">StockTrack</h1>
          <p className="brand-subtitle">Receiving & Delivery</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="operator-badge"
          onClick={onOpenUserModal}
          title="Change active operator"
          aria-label="Active Operator"
        >
          <User size={13} color="#818cf8" />
          <span style={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {operator.split(' ')[0]}
          </span>
        </button>

        <button
          className="icon-btn"
          onClick={onOpenAddProduct}
          title="Add New Product"
          aria-label="Add Product"
        >
          <Plus size={18} />
        </button>

        <button
          className="icon-btn"
          onClick={onOpenBackupModal}
          title="Backup & Reports"
          aria-label="Backup and Settings"
        >
          <Database size={17} />
        </button>
      </div>
    </header>
  );
}
