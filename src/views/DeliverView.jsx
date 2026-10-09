import React, { useState, useEffect } from 'react';
import { 
  ArrowUpFromLine, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  FileText, 
  Clock, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DeliverView() {
  const { 
    products, 
    deliverStock, 
    preselectedProductId, 
    setPreselectedProductId,
    operator,
    setCurrentTab
  } = useApp();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [recipient, setRecipient] = useState('');
  const [destination, setDestination] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customDateTime, setCustomDateTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [lastSuccessResult, setLastSuccessResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(preselectedProductId);
      setPreselectedProductId(null);
    } else if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [preselectedProductId, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const numQuantity = parseInt(quantity, 10) || 0;
  const isOverDelivery = selectedProduct && numQuantity > currentStock;
  const calculatedRemainingBalance = currentStock - numQuantity;

  const handleOpenReview = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product first.');
      return;
    }
    if (numQuantity <= 0) {
      setError('Quantity delivered must be a positive number greater than 0.');
      return;
    }
    if (numQuantity > currentStock) {
      setError(`Cannot deliver ${numQuantity} ${selectedProduct.unit}. Only ${currentStock} ${selectedProduct.unit} available in stock.`);
      return;
    }
    setError('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    const timestamp = useCurrentTime ? new Date().toISOString() : new Date(customDateTime).toISOString();
    
    // Combine recipient and destination if provided
    let fullParty = recipient.trim();
    if (destination.trim()) {
      fullParty = fullParty ? `${fullParty} (${destination.trim()})` : destination.trim();
    }

    const res = deliverStock({
      productId: selectedProduct.id,
      quantity: numQuantity,
      party: fullParty,
      refNumber,
      notes,
      customTimestamp: timestamp
    });

    setIsConfirmOpen(false);

    if (res.success) {
      setLastSuccessResult({
        product: selectedProduct,
        deliveredQuantity: numQuantity,
        prevBalance: res.prevBalance,
        newBalance: res.newBalance,
        refNumber: res.transaction.refNumber,
        txId: res.transaction.id
      });
      // Reset form
      setQuantity('');
      setRecipient('');
      setDestination('');
      setRefNumber('');
      setNotes('');
    } else {
      setError(res.error || 'Failed to record stock delivery.');
    }
  };

  const handleResetForNew = () => {
    setLastSuccessResult(null);
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(2, 132, 199, 0.15)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowUpFromLine size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }} className="font-heading">
            Deliver Stock
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Dispatch items & deduct available quantity
          </p>
        </div>
      </div>

      {/* Success Card */}
      {lastSuccessResult && (
        <div className="success-card" style={{ background: 'linear-gradient(145deg, #075985, #082f49)', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
          <div className="success-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
            <CheckCircle2 size={30} />
          </div>
          <h3 className="font-heading" style={{ fontSize: '1.2rem', color: '#f0f9ff', marginBottom: '6px' }}>
            Stock Delivered Successfully!
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#bae6fd', marginBottom: '14px', lineHeight: '1.4' }}>
            <strong>{lastSuccessResult.product.name}</strong><br />
            Current stock: {lastSuccessResult.prevBalance} {lastSuccessResult.product.unit}. Delivered: {lastSuccessResult.deliveredQuantity} {lastSuccessResult.product.unit}.<br />
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              Remaining balance: {lastSuccessResult.newBalance} {lastSuccessResult.product.unit}
            </span>
          </p>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '10px 14px' }}
              onClick={handleResetForNew}
            >
              Deliver Another Item
            </button>
            <button
              className="btn btn-deliver"
              style={{ fontSize: '0.82rem', padding: '10px 14px' }}
              onClick={() => setCurrentTab('history')}
            >
              View in History <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleOpenReview}>
        {/* Step 1: Select Product */}
        <div className="form-group">
          <label className="form-label">
            1. Select Product for Delivery *
          </label>
          <select
            className="select"
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setError('');
            }}
            required
          >
            {products.length === 0 && (
              <option value="">No products in inventory</option>
            )}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — Available: {p.stock} {p.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Available Stock Badge */}
        {selectedProduct && (
          <div
            style={{
              background: currentStock === 0 ? 'rgba(239, 68, 68, 0.1)' : '#0d131f',
              border: currentStock === 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: currentStock === 0 ? '#f87171' : 'var(--text-muted)' }}>
                {currentStock === 0 ? 'Out of Stock' : 'Current Available Stock'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: currentStock === 0 ? '#ef4444' : '#38bdf8', fontFamily: 'var(--font-heading)' }}>
                {currentStock} {selectedProduct.unit}
              </div>
            </div>
            <span className="badge badge-category">{selectedProduct.category}</span>
          </div>
        )}

        {/* Step 3: Quantity Delivered */}
        <div className="form-group">
          <label className="form-label">
            2. Quantity Delivered ({selectedProduct?.unit || 'units'}) *
          </label>
          <input
            type="number"
            min="1"
            max={currentStock}
            step="1"
            className="input input-num-huge"
            placeholder="0"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setError('');
            }}
            disabled={currentStock === 0}
            required
          />
        </div>

        {/* Over-delivery Warning */}
        {isOverDelivery && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '12px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.84rem'
            }}
          >
            <ShieldAlert size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Delivery quantity exceeds available stock!</strong>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                You entered {numQuantity} {selectedProduct.unit}, but only {currentStock} {selectedProduct.unit} are available.
              </div>
            </div>
          </div>
        )}

        {/* Real-time Calculation Preview */}
        {selectedProduct && numQuantity > 0 && !isOverDelivery && (
          <div className="balance-preview-box">
            <div className="balance-step-row">
              <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span>
              <span>{currentStock} {selectedProduct.unit}</span>
            </div>
            <div className="balance-step-row">
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>- Delivered:</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>-{numQuantity} {selectedProduct.unit}</span>
            </div>
            <div className="balance-step-row">
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Remaining Balance:</span>
              <span className="balance-final-num">
                {calculatedRemainingBalance} {selectedProduct.unit}
              </span>
            </div>
          </div>
        )}

        {/* Step 4: Optional Fields */}
        <div className="form-group">
          <label className="form-label">
            <span>Recipient / Customer / Department</span>
            <span className="optional">Optional</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Branch Outlet #2, John Doe, Retail Store"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Destination / Delivery Location</span>
            <span className="optional">Optional</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Downtown Mall, Central Warehouse, Section B"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Reference / Dispatch Order Number</span>
            <span className="optional">Optional</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. DO-9021, DISP-104, WAYBILL-5"
            value={refNumber}
            onChange={(e) => setRefNumber(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Notes / Remarks</span>
            <span className="optional">Optional</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Priority dispatch, delivered via courier"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Date & Time Settings */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Date & Time Recorded
            </label>
            <button
              type="button"
              onClick={() => setUseCurrentTime(!useCurrentTime)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#818cf8',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {useCurrentTime ? 'Set Custom Date' : 'Use Current Date'}
            </button>
          </div>
          {useCurrentTime ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: '#0a0f1d', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} color="#818cf8" />
              <span>Automatically recording current timestamp</span>
            </div>
          ) : (
            <input
              type="datetime-local"
              className="input"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
            />
          )}
        </div>

        {/* Submit Review Button */}
        <button
          type="submit"
          className="btn btn-deliver btn-block"
          style={{ marginTop: '10px', padding: '14px' }}
          disabled={!selectedProduct || currentStock === 0 || numQuantity <= 0 || isOverDelivery}
        >
          <ArrowUpFromLine size={20} />
          Review & Deliver Stock
        </button>
      </form>

      {/* Confirmation Step Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        type="DELIVER"
        product={selectedProduct}
        quantity={numQuantity}
        prevBalance={currentStock}
        newBalance={calculatedRemainingBalance}
        party={recipient ? (destination ? `${recipient} (${destination})` : recipient) : destination}
        refNumber={refNumber}
        notes={notes}
        operator={operator}
        timestamp={useCurrentTime ? new Date().toISOString() : new Date(customDateTime).toISOString()}
      />
    </div>
  );
}
