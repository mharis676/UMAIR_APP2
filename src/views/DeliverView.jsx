import React, { useState, useEffect } from 'react';
import { 
  ArrowUpFromLine, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  FileText, 
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Search,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryInfo } from '../types';
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
  const [quantity, setQuantity] = useState('1');
  const [recipient, setRecipient] = useState('');
  const [destination, setDestination] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [lastSuccessResult, setLastSuccessResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(preselectedProductId);
      setPreselectedProductId(null);
    } else if (!selectedProductId && products.length > 0) {
      // Pick first product that has stock > 0 if possible
      const available = products.find((p) => p.stock > 0) || products[0];
      setSelectedProductId(available.id);
    }
  }, [preselectedProductId, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const numQuantity = parseInt(quantity, 10) || 0;
  const isOverDelivery = selectedProduct && numQuantity > currentStock;
  const calculatedRemainingBalance = currentStock - numQuantity;
  const categoryInfo = selectedProduct ? getCategoryInfo(selectedProduct.category) : null;

  const handleAdjustQuantity = (delta) => {
    const current = parseInt(quantity, 10) || 0;
    const next = Math.max(1, Math.min(currentStock || 1, current + delta));
    setQuantity(String(next));
    setError('');
  };

  const handleSetMax = () => {
    setQuantity(String(currentStock));
    setError('');
  };

  const handleOpenReview = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product first.');
      return;
    }
    if (currentStock === 0) {
      setError('This product has 0 units in stock. Receive stock first.');
      return;
    }
    if (numQuantity <= 0) {
      setError('Quantity delivered must be at least 1.');
      return;
    }
    if (numQuantity > currentStock) {
      setError(`Cannot deliver ${numQuantity} ${selectedProduct.unit}. Only ${currentStock} available.`);
      return;
    }
    setError('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    const timestamp = new Date().toISOString();
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
      setQuantity('1');
      setRecipient('');
      setDestination('');
      setRefNumber('');
      setNotes('');
      setShowOptionalFields(false);
    } else {
      setError(res.error || 'Failed to record stock delivery.');
    }
  };

  const filteredPickerProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--deliver-blue-light)',
            color: 'var(--deliver-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)'
          }}
        >
          <ArrowUpFromLine size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }} className="font-heading">
            Deliver Stock
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Dispatch products and deduct available balance
          </p>
        </div>
      </div>

      {/* Success Card */}
      {lastSuccessResult && (
        <div className="success-card" style={{ background: 'var(--deliver-blue-light)', borderColor: 'var(--deliver-blue-border)' }}>
          <div className="success-icon-wrap" style={{ background: 'var(--deliver-blue)', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#0c4a6e', marginBottom: '6px' }}>
            Stock Delivered Successfully!
          </h3>
          <p style={{ fontSize: '0.92rem', color: '#0369a1', marginBottom: '16px', lineHeight: '1.4' }}>
            <strong>{lastSuccessResult.product.name}</strong><br />
            Previous: {lastSuccessResult.prevBalance} {lastSuccessResult.product.unit} ➔ Delivered: -{lastSuccessResult.deliveredQuantity} {lastSuccessResult.product.unit}<br />
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
              Remaining Balance: {lastSuccessResult.newBalance} {lastSuccessResult.product.unit}
            </span>
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.84rem', padding: '10px 16px' }}
              onClick={() => setLastSuccessResult(null)}
            >
              Deliver Another
            </button>
            <button
              className="btn btn-deliver"
              style={{ fontSize: '0.84rem', padding: '10px 16px' }}
              onClick={() => setCurrentTab('history')}
            >
              View in History <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--accent-rose-light)', border: '1px solid rgba(225, 29, 72, 0.3)', color: 'var(--accent-rose)', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.86rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleOpenReview}>
        {/* Step 1: Product Selection Card */}
        <div className="form-group">
          <label className="form-label">
            1. Product to Deliver
          </label>

          {selectedProduct ? (
            <div
              className="card"
              onClick={() => setIsProductPickerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderColor: currentStock === 0 ? 'var(--accent-rose)' : 'var(--border-focus)',
                background: 'var(--bg-card)'
              }}
            >
              <div
                className="category-avatar"
                style={{ background: categoryInfo?.bg || '#f1f5f9' }}
              >
                {categoryInfo?.emoji || '📦'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedProduct.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span className="badge badge-code">{selectedProduct.code || 'SKU'}</span>
                  <span style={{ fontSize: '0.78rem', color: currentStock === 0 ? 'var(--accent-rose)' : 'var(--deliver-blue)', fontWeight: 700 }}>
                    {currentStock === 0 ? 'Out of Stock (0)' : `${currentStock} ${selectedProduct.unit} available`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => setIsProductPickerOpen(true)}
            >
              Tap to choose product
            </button>
          )}
        </div>

        {/* Step 2: Quantity Stepper */}
        {selectedProduct && (
          <div className="form-group">
            <label className="form-label">
              2. Quantity to Deliver ({selectedProduct.unit})
            </label>
            <div className="stepper-container">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQuantity(-1)}
                disabled={numQuantity <= 1 || currentStock === 0}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={currentStock}
                className="stepper-input"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                disabled={currentStock === 0}
                required
              />
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQuantity(1)}
                disabled={numQuantity >= currentStock || currentStock === 0}
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="quick-chip-row">
              <button type="button" className="quick-chip" onClick={() => handleAdjustQuantity(1)} disabled={currentStock === 0}>+1</button>
              <button type="button" className="quick-chip" onClick={() => handleAdjustQuantity(5)} disabled={currentStock === 0}>+5</button>
              <button type="button" className="quick-chip" onClick={() => handleAdjustQuantity(10)} disabled={currentStock === 0}>+10</button>
              <button type="button" className="quick-chip" onClick={handleSetMax} disabled={currentStock === 0}>
                All Available ({currentStock})
              </button>
            </div>
          </div>
        )}

        {/* Over-delivery Alert */}
        {isOverDelivery && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--accent-rose-light)',
              border: '1px solid rgba(225, 29, 72, 0.4)',
              color: 'var(--accent-rose)',
              padding: '12px 14px',
              borderRadius: '12px',
              marginBottom: '16px',
              fontSize: '0.86rem'
            }}
          >
            <ShieldAlert size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>Exceeds available stock!</strong>
              <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                You entered {numQuantity} {selectedProduct.unit}, but only {currentStock} are in stock.
              </div>
            </div>
          </div>
        )}

        {/* Calculation Visual Summary Card */}
        {selectedProduct && numQuantity > 0 && !isOverDelivery && (
          <div className="calculation-card">
            <div className="calc-row">
              <span style={{ color: 'var(--text-muted)' }}>Current In-Stock:</span>
              <span style={{ fontWeight: 600 }}>{currentStock} {selectedProduct.unit}</span>
            </div>
            <div className="calc-row">
              <span style={{ color: 'var(--deliver-blue)', fontWeight: 600 }}>- Delivering Out:</span>
              <span style={{ color: 'var(--deliver-blue)', fontWeight: 700 }}>-{numQuantity} {selectedProduct.unit}</span>
            </div>
            <div className="calc-row final">
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Remaining Balance:</span>
              <span className="calc-final-num blue">
                {calculatedRemainingBalance} {selectedProduct.unit}
              </span>
            </div>
          </div>
        )}

        {/* Collapsible Optional Details */}
        <div style={{ marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '10px 14px',
              color: 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>{showOptionalFields ? 'Hide' : '+ Add'} Recipient, Location & Notes (Optional)</span>
            {showOptionalFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showOptionalFields && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Recipient / Customer</span>
                  <span className="optional">Optional</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Downtown Boutique, Client John"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Destination / Location</span>
                  <span className="optional">Optional</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Branch Outlet #2, Main Warehouse"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Dispatch / DO Number</span>
                  <span className="optional">Optional</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. DO-9021, DISP-104"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span>Notes / Remarks</span>
                  <span className="optional">Optional</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Handed over to driver"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Review Button */}
        <button
          type="submit"
          className="btn btn-deliver btn-block"
          style={{ padding: '16px' }}
          disabled={!selectedProduct || currentStock === 0 || numQuantity <= 0 || isOverDelivery}
        >
          <ArrowUpFromLine size={20} strokeWidth={2.4} />
          Review & Deliver Stock
        </button>
      </form>

      {/* Product Picker Modal */}
      {isProductPickerOpen && (
        <div className="modal-overlay" onClick={() => setIsProductPickerOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-heading">Choose Product to Deliver</h3>
            </div>

            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search
                size={16}
                color="var(--text-dim)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="input"
                placeholder="Search products..."
                style={{ paddingLeft: '38px', fontSize: '0.88rem' }}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '55vh', overflowY: 'auto' }}>
              {filteredPickerProducts.map((p) => {
                const cat = getCategoryInfo(p.category);
                const isSelected = p.id === selectedProductId;
                const isZero = p.stock === 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setIsProductPickerOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: isSelected ? 'var(--deliver-blue-light)' : 'var(--bg-surface)',
                      border: isSelected ? '1.5px solid var(--deliver-blue)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      opacity: isZero ? 0.6 : 1
                    }}
                  >
                    <div className="category-avatar" style={{ background: cat.bg, width: '38px', height: '38px', fontSize: '1.2rem' }}>
                      {cat.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: isZero ? 'var(--accent-rose)' : 'var(--deliver-blue)', fontWeight: 600 }}>
                        {isZero ? '0 in stock (empty)' : `${p.stock} ${p.unit} available`}
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="var(--deliver-blue)" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
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
        timestamp={new Date().toISOString()}
      />
    </div>
  );
}
