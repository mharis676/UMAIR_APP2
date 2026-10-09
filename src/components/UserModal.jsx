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
            <User size={18} color="#818cf8" />
            <h3 className="modal-title font-heading">Switch Operator / User</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close user modal">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Select or enter the name of the person performing stock receiving and delivery. Every transaction records who executed it.
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
                  borderRadius: '10px',
                  background: isCurrent ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: isCurrent ? '1px solid #6366f1' : '1px solid var(--border-color)',
                  color: isCurrent ? '#a5b4fc' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.9rem'
                }}
              >
                <span>{p}</span>
                {isCurrent && <Check size={16} color="#818cf8" />}
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

          <button type="submit" className="btn btn-primary btn-block">
            <Check size={18} />
            Set Active Operator
          </button>
        </form>
      </div>
    </div>
  );
}
