import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ReversalModal({ isOpen, onClose, transaction }) {
  const { reverseTransaction, products } = useApp();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !transaction) return null;

  const product = products.find((p) => p.id === transaction.productId);
  const isReceive = transaction.type === 'RECEIVED';
  const isDeliver = transaction.type === 'DELIVERED';

  // Projected stock balance after reversal
  let projectedStock = product ? product.stock : 0;
  let canReverse = true;
  let warningMessage = '';

  if (product) {
    if (isReceive) {
      projectedStock = product.stock - transaction.quantity;
      if (projectedStock < 0) {
        canReverse = false;
        warningMessage = `Cannot reverse: Current stock (${product.stock} ${product.unit}) is less than the received quantity (${transaction.quantity} ${product.unit}). Some items may have already been delivered.`;
      }
    } else if (isDeliver) {
      projectedStock = product.stock + transaction.quantity;
    }
  }

  const handleConfirmReversal = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for reversing this transaction.');
      return;
    }

    const res = reverseTransaction({
      transactionId: transaction.id,
      reason: reason.trim()
    });

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to reverse transaction.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-reversed">
              <RotateCcw size={13} />
              Controlled Reversal
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close reversal modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.15rem', marginBottom: '4px' }}>
            Reverse Transaction: #{transaction.id}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            The original entry remains permanently archived in the audit trail. An offsetting reversal transaction will be logged and stock will be restored.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div style={{ background: '#0a0f1d', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginBottom: '16px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Product:</span>
            <strong>{transaction.productName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Original Type:</span>
            <span style={{ color: isReceive ? '#34d399' : '#38bdf8', fontWeight: 600 }}>
              {isReceive ? 'Stock Received' : 'Stock Delivered'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Quantity:</span>
            <strong>{transaction.quantity} {transaction.unit}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Stock Balance Impact:</span>
            <span>
              {product ? product.stock : 0} {product?.unit} &rarr;{' '}
              <strong style={{ color: projectedStock < 0 ? '#ef4444' : '#f59e0b' }}>
                {projectedStock} {product?.unit}
              </strong>
            </span>
          </div>
        </div>

        {warningMessage && (
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.82rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>{warningMessage}</div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleConfirmReversal}>
          <div className="form-group">
            <label className="form-label">
              Reason for Reversal / Correction *
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Incorrect quantity recorded, dispatch cancelled..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              style={{ flex: 2 }}
              disabled={!canReverse}
            >
              <RotateCcw size={16} />
              Confirm Reversal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
