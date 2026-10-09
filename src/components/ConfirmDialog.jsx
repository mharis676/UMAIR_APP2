import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, ArrowLeft, Calendar, User, FileText, Building2 } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  product,
  quantity,
  prevBalance,
  newBalance,
  party,
  refNumber,
  notes,
  operator,
  timestamp
}) {
  if (!isOpen || !product) return null;

  const isReceive = type === 'RECEIVE';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isReceive ? 'badge-received' : 'badge-delivered'}`}>
              {isReceive ? <ArrowDownToLine size={13} strokeWidth={2.4} /> : <ArrowUpFromLine size={13} strokeWidth={2.4} />}
              {isReceive ? 'Review Receiving' : 'Review Delivery'}
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close review dialog">
            <ArrowLeft size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '10px 0 16px 0' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }} className="font-heading">
            {product.name}
          </h3>
          <span className="badge badge-code">{product.code || 'SKU'}</span>
        </div>

        {/* Calculation Summary Card */}
        <div className="calculation-card" style={{ background: isReceive ? 'var(--receive-green-light)' : 'var(--deliver-blue-light)', borderColor: isReceive ? 'var(--receive-green-border)' : 'var(--deliver-blue-border)' }}>
          <div className="calc-row">
            <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span>
            <span style={{ fontWeight: 600 }}>{prevBalance} {product.unit}</span>
          </div>

          <div className="calc-row">
            <span style={{ color: isReceive ? 'var(--receive-green)' : 'var(--deliver-blue)', fontWeight: 700 }}>
              {isReceive ? '+ Quantity Arriving:' : '- Quantity Delivering:'}
            </span>
            <span style={{ fontWeight: 800, color: isReceive ? 'var(--receive-green)' : 'var(--deliver-blue)', fontSize: '1.1rem' }}>
              {isReceive ? '+' : '-'}{quantity} {product.unit}
            </span>
          </div>

          <div className="calc-row final">
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Updated Balance:</span>
            <span className={`calc-final-num ${isReceive ? 'green' : 'blue'}`}>
              {newBalance} {product.unit}
            </span>
          </div>
        </div>

        {/* Details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '0.86rem' }}>
          {party && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Building2 size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>{isReceive ? 'Supplier:' : 'Recipient:'}</span>
              <strong style={{ marginLeft: 'auto' }}>{party}</strong>
            </div>
          )}

          {refNumber && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <FileText size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>Ref No:</span>
              <strong style={{ marginLeft: 'auto' }}>{refNumber}</strong>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
            <strong style={{ marginLeft: 'auto' }}>{new Date(timestamp).toLocaleString()}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <User size={16} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)' }}>Recorded By:</span>
            <strong style={{ marginLeft: 'auto' }}>{operator}</strong>
          </div>

          {notes && (
            <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: '10px', marginTop: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>Notes: </strong> {notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, padding: '14px' }}
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="button"
            className={`btn ${isReceive ? 'btn-success' : 'btn-deliver'}`}
            style={{ flex: 2, padding: '14px' }}
            onClick={onConfirm}
          >
            <Check size={18} strokeWidth={2.5} />
            {isReceive ? 'Confirm & Receive' : 'Confirm & Deliver'}
          </button>
        </div>
      </div>
    </div>
  );
}
