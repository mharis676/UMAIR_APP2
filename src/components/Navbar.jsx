import React from 'react';
import { User, Plus, Database, Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ onOpenAddProduct, onOpenUserModal, onOpenBackupModal }) {
  const { operator, theme, toggleTheme } = useApp();

  const getInitials = (name) => {
    return (name || 'U')
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

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
        {/* Theme Toggle (Light / Dark) */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Active Operator Switcher */}
        <button
          className="operator-badge"
          onClick={onOpenUserModal}
          title="Switch operator"
          aria-label="Active Operator"
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              color: '#ffffff',
              fontSize: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}
          >
            {getInitials(operator)}
          </div>
          <span style={{ maxWidth: '85px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {operator.split(' ')[0]}
          </span>
        </button>

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
