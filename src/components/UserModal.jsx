import React, { useState } from 'react';
import { User, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UserModal({ isOpen, onClose }) {
  const { operator, updateOperator } = useApp();
  const [customName, setCustomName] = useState(operator);

  if (!isOpen) return null;

  const presets = [
    'Umair (Store Manager)',
    'Ali (Storekeeper)',
    'Sara (Receiving Clerk)',
    'Hamza (Inventory Auditor)'
  ];

  const handleSelectPreset = (name) => {
    updateOperator(name);
    onClose();
  };

  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (customName.trim()) {
      updateOperator(customName.trim());
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--primary)" />
            <h3 className="modal-title font-heading">Switch Operator / User</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close user modal">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Select or enter the operator name. Every stock receipt and delivery records who performed the transaction.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {presets.map((p) => {
            const isCurrent = operator === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectPreset(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: isCurrent ? 'var(--primary-light)' : 'var(--bg-surface)',
                  border: isCurrent ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  color: isCurrent ? 'var(--primary)' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{p}</span>
                {isCurrent && <Check size={18} color="var(--primary)" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSaveCustom}>
          <div className="form-group">
            <label className="form-label">Or Custom Name / Title</label>
            <input
              type="text"
              className="input"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. John (Warehouse Supervisor)"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" style={{ padding: '14px' }}>
            <Check size={18} strokeWidth={2.5} />
            Set Active Operator
          </button>
        </form>
      </div>
    </div>
  );
}
