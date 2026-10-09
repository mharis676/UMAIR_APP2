import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, ArrowLeft, Calendar, FileText, Building2, Package } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  items = [],
  product,
  quantity,
  prevBalance,
  newBalance,
  party,
  refNumber,
  notes,
  timestamp
}) {
  if (!isOpen) return null;

  const isReceive = type === 'RECEIVE';

  // Normalize single product vs multiple items
  const displayItems = items && items.length > 0 
    ? items 
    : (product ? [{ product, quantity, prevBalance, newBalance }] : []);

  if (displayItems.length === 0) return null;

  const totalUnits = displayItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const isMulti = displayItems.length > 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isReceive ? 'badge-received' : 'badge-delivered'}`}>
              {isReceive ? <ArrowDownToLine size={13} strokeWidth={2.4} /> : <ArrowUpFromLine size={13} strokeWidth={2.4} />}
              {isReceive 
                ? (isMulti ? `Review Receiving (${displayItems.length} Products)` : 'Review Receiving') 
                : (isMulti ? `Review Delivery (${displayItems.length} Products)` : 'Review Delivery')
              }
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close review dialog">
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Itemized Products List */}
        <div style={{
          maxHeight: '260px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          margin: '12px 0 16px 0',
          paddingRight: '2px'
        }}>
          {displayItems.map((it, idx) => {
            const p = it.product || it;
            const unit = p.unit || it.unit || 'units';
            const qty = it.quantity || 0;
            const prev = it.prevBalance !== undefined ? it.prevBalance : (p.stock || 0);
            const next = it.newBalance !== undefined ? it.newBalance : (isReceive ? prev + qty : prev - qty);

            return (
              <div
                key={p.id || idx}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '1px' }}>
                    Bal: {prev} ➔ <strong style={{ color: isReceive ? 'var(--receive-green)' : 'var(--deliver-blue)' }}>{next}</strong> {unit}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    color: isReceive ? 'var(--receive-green)' : 'var(--deliver-blue)'
                  }}>
                    {isReceive ? '+' : '-'}{qty}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '3px' }}>
                    {unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Batch Summary Pill */}
        <div style={{
          background: isReceive ? 'var(--receive-green-light)' : 'var(--deliver-blue-light)',
          border: `1.5px solid ${isReceive ? 'var(--receive-green-border)' : 'var(--deliver-blue-border)'}`,
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {isReceive ? 'Total Items Receiving' : 'Total Items Delivering'}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {displayItems.length} {displayItems.length === 1 ? 'Product' : 'Products'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Units</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isReceive ? 'var(--receive-green)' : 'var(--deliver-blue)', fontFamily: 'var(--font-heading)' }}>
              {isReceive ? '+' : '-'}{totalUnits.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '0.84rem' }}>
          {party && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Building2 size={15} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>{isReceive ? 'Supplier:' : 'Recipient:'}</span>
              <strong style={{ marginLeft: 'auto' }}>{party}</strong>
            </div>
          )}

          {refNumber && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <FileText size={15} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>Ref No:</span>
              <strong style={{ marginLeft: 'auto' }}>{refNumber}</strong>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Calendar size={15} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
            <strong style={{ marginLeft: 'auto' }}>{new Date(timestamp || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
          </div>

          {notes && (
            <div style={{ background: 'var(--bg-surface)', padding: '9px 12px', borderRadius: '10px', marginTop: '2px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-main)' }}>Notes: </strong> {notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, padding: '13px' }}
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="button"
            className={`btn ${isReceive ? 'btn-success' : 'btn-deliver'}`}
            style={{ flex: 2, padding: '13px' }}
            onClick={onConfirm}
          >
            <Check size={18} strokeWidth={2.5} />
            {isReceive 
              ? (isMulti ? `Confirm Receive (${displayItems.length})` : 'Confirm & Receive') 
              : (isMulti ? `Confirm Deliver (${displayItems.length})` : 'Confirm & Deliver')
            }
          </button>
        </div>
      </div>
    </div>
  );
}
