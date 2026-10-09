import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, ArrowLeft, Calendar, User, FileText, Building2 } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  type, // 'RECEIVE' | 'DELIVER'
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
              {isReceive ? <ArrowDownToLine size={13} /> : <ArrowUpFromLine size={13} />}
              {isReceive ? 'Review Receiving' : 'Review Delivery'}
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close review dialog">
            <ArrowLeft size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '14px 0 20px 0' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }} className="font-heading">
            {product.name}
          </h3>
          <span className="badge badge-code">{product.code || 'SKU'}</span>
        </div>

        {/* Calculation Summary Card */}
        <div className="balance-preview-box" style={{ background: isReceive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(2, 132, 199, 0.08)', borderColor: isReceive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(2, 132, 199, 0.25)' }}>
          <div className="balance-step-row">
            <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span>
            <span style={{ fontWeight: 600 }}>{prevBalance} {product.unit}</span>
          </div>

          <div className="balance-step-row">
            <span style={{ color: isReceive ? '#34d399' : '#38bdf8', fontWeight: 600 }}>
              {isReceive ? '+ Quantity Received:' : '- Quantity Delivered:'}
            </span>
            <span style={{ fontWeight: 700, color: isReceive ? '#34d399' : '#38bdf8', fontSize: '1.1rem' }}>
              {isReceive ? '+' : '-'}{quantity} {product.unit}
            </span>
          </div>

          <div className="balance-step-row">
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Updated Balance:</span>
            <span className={`balance-final-num ${isReceive ? 'green' : ''}`}>
              {newBalance} {product.unit}
            </span>
          </div>
        </div>

        {/* Details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
          {party && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
              <Building2 size={15} color="#94a3b8" />
              <span style={{ color: 'var(--text-muted)' }}>{isReceive ? 'Supplier:' : 'Recipient:'}</span>
              <strong style={{ marginLeft: 'auto' }}>{party}</strong>
            </div>
          )}

          {refNumber && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
              <FileText size={15} color="#94a3b8" />
              <span style={{ color: 'var(--text-muted)' }}>Ref No:</span>
              <strong style={{ marginLeft: 'auto' }}>{refNumber}</strong>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
            <Calendar size={15} color="#94a3b8" />
            <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
            <strong style={{ marginLeft: 'auto' }}>{new Date(timestamp).toLocaleString()}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
            <User size={15} color="#94a3b8" />
            <span style={{ color: 'var(--text-muted)' }}>Recorded By:</span>
            <strong style={{ marginLeft: 'auto' }}>{operator}</strong>
          </div>

          {notes && (
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 12px', borderRadius: '8px', marginTop: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
              <strong>Notes:</strong> {notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Back to Edit
          </button>
          <button
            type="button"
            className={`btn ${isReceive ? 'btn-success' : 'btn-deliver'}`}
            style={{ flex: 2 }}
            onClick={onConfirm}
          >
            <Check size={18} />
            {isReceive ? 'Confirm & Receive' : 'Confirm & Deliver'}
          </button>
        </div>
      </div>
    </div>
  );
}
