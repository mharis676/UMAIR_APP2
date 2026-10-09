import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Check, 
  AlertCircle,
  Building2,
  User,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function EditTransactionModal({ isOpen, onClose, transaction }) {
  const { products, updateTransaction } = useApp();

  const [quantity, setQuantity] = useState('1');
  const [party, setParty] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setQuantity(String(transaction.quantity || 1));
      setParty(transaction.party || '');
      setRefNumber(transaction.refNumber || '');
      setNotes(transaction.notes || '');
      setReason(transaction.editReason || 'Corrected quantity entry mistake');
      setError('');
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const isReceive = transaction.type === 'RECEIVED';
  const isDeliver = transaction.type === 'DELIVERED';
  const product = products.find((p) => p.id === transaction.productId);

  const numQuantity = Math.max(0, parseInt(quantity, 10) || 0);
  const oldQuantity = transaction.quantity;
  const qtyDiff = numQuantity - oldQuantity;

  // Calculate live resulting product stock
  const currentProductStock = product ? product.stock : 0;
  let simulatedStock = currentProductStock;
  if (isReceive) {
    simulatedStock = currentProductStock + qtyDiff;
  } else if (isDeliver) {
    simulatedStock = currentProductStock - qtyDiff;
  }

  const handleAdjustQty = (delta) => {
    const nextVal = Math.max(1, numQuantity + delta);
    setQuantity(String(nextVal));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (numQuantity <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (isDeliver && simulatedStock < 0) {
      setError(`Cannot increase delivery to ${numQuantity}. Total available stock is ${currentProductStock + oldQuantity} ${transaction.unit}.`);
      return;
    }

    if (isReceive && simulatedStock < 0) {
      setError(`Cannot reduce received quantity to ${numQuantity}. Current stock is only ${currentProductStock} ${transaction.unit} (items may have already been dispatched).`);
      return;
    }

    const res = updateTransaction({
      transactionId: transaction.id,
      quantity: numQuantity,
      party,
      refNumber,
      notes,
      reason
    });

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to update transaction.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-sheet" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className={`badge ${isReceive ? 'badge-received' : 'badge-delivered'}`}
              style={{ fontSize: '0.78rem' }}
            >
              {isReceive ? <ArrowDownToLine size={13} strokeWidth={2.5} /> : <ArrowUpFromLine size={13} strokeWidth={2.5} />}
              {isReceive ? 'Edit Receiving Entry' : 'Edit Delivery Entry'}
            </span>
          </div>

          <button 
            type="button" 
            className="icon-btn" 
            onClick={onClose} 
            aria-label="Close edit modal"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--accent-rose-light)', 
            border: '1px solid rgba(225, 29, 72, 0.3)', 
            color: 'var(--accent-rose)', 
            padding: '10px 14px', 
            borderRadius: '10px', 
            marginBottom: '14px', 
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Product Banner */}
          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
              Product & Unit
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {transaction.productName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Current In-Stock: <strong>{currentProductStock} {transaction.unit}</strong> • Recorded initially: {oldQuantity} {transaction.unit}
            </div>
          </div>

          {/* Stepper for Quantity */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Corrected Quantity ({transaction.unit}) *</span>
              <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>Originally: {oldQuantity}</span>
            </label>

            <div className="stepper-container">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQty(-1)}
                disabled={numQuantity <= 1}
                aria-label="Decrease quantity"
              >
                -
              </button>

              <input
                type="number"
                min="1"
                className="stepper-input"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
              />

              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQty(1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Quick Adjustment Chips */}
            <div className="quick-chip-row" style={{ marginTop: '8px' }}>
              {[-10, -5, -1, 1, 5, 10, 50].map((delta) => {
                const targetVal = numQuantity + delta;
                if (targetVal < 1) return null;
                return (
                  <button
                    key={delta}
                    type="button"
                    className="quick-chip"
                    onClick={() => handleAdjustQty(delta)}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Recalculation Preview */}
          <div style={{
            background: isReceive ? 'var(--receive-green-light)' : 'var(--deliver-blue-light)',
            border: `1.5px solid ${isReceive ? 'var(--receive-green-border)' : 'var(--deliver-blue-border)'}`,
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Quantity Change:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                {oldQuantity} ➔ {numQuantity} ({qtyDiff >= 0 ? `+${qtyDiff}` : qtyDiff} {transaction.unit})
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Adjusted In-Stock Balance:</span>
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: isReceive ? 'var(--receive-green)' : 'var(--deliver-blue)', fontFamily: 'var(--font-heading)' }}>
                {simulatedStock} {transaction.unit}
              </span>
            </div>
          </div>

          {/* Party (Received from / Deliver to) */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {isReceive ? <Building2 size={13} color="var(--receive-green)" /> : <User size={13} color="var(--deliver-blue)" />}
                {isReceive ? 'Received from (Supplier)' : 'Deliver to (Recipient)'}
              </span>
              <span className="optional">Optional</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder={isReceive ? "Supplier / Vendor name..." : "Recipient, client or store..."}
              value={party}
              onChange={(e) => setParty(e.target.value)}
            />
          </div>

          {/* Ref Number */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={13} /> Ref / Invoice / Slip #
              </span>
              <span className="optional">Optional</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. INV-1002, PO-883"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
            />
          </div>

          {/* Reason for Edit */}
          <div className="form-group">
            <label className="form-label">
              <span>Reason for Correction</span>
              <span className="optional">Optional</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Typo in quantity, human error corrected"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">
              <span>Notes & Remarks</span>
              <span className="optional">Optional</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="Additional remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '13px' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, padding: '13px' }}
            >
              <Check size={18} strokeWidth={2.5} />
              Save & Recalculate Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
