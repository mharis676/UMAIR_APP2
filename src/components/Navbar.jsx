import React from 'react';
import { User, Plus, Database, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ onOpenAddProduct, onOpenBackupModal }) {
  const { theme, toggleTheme } = useApp();

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
        {/* Quick Add Product */}
        <button
          className="icon-btn"
          onClick={onOpenAddProduct}
          title="Add New Product"
          aria-label="Add Product"
          style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'transparent' }}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Backup & Reports */}
        <button
          className="icon-btn"
          onClick={onOpenBackupModal}
          title="Backup & Reports"
          aria-label="Backup and Reports"
        >
          <Database size={16} />
        </button>
      </div>
    </header>
  );
}
