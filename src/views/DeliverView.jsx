import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpFromLine, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { WhatsAppBatchShareButton } from '../components/WhatsAppShareButton';

export default function DeliverView() {
  const { 
    products, 
    deliverStockBatch, 
    preselectedProductId, 
    setPreselectedProductId, 
    operator, 
    setCurrentTab 
  } = useApp();

  // Quantities mapped by productId: { [productId]: number }
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState('ALL'); // 'ALL' | 'SELECTED'

  // Optional delivery details
  const [recipient, setRecipient] = useState('');
  const [destination, setDestination] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Modals & States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [lastSuccessResult, setLastSuccessResult] = useState(null);
  const [error, setError] = useState('');

  // Handle preselected product from other views
  useEffect(() => {
    if (preselectedProductId) {
      const prod = products.find((p) => p.id === preselectedProductId);
      if (prod && prod.stock > 0) {
        setQuantities((prev) => ({
          ...prev,
          [preselectedProductId]: 1
        }));
      }
      setPreselectedProductId(null);
    }
  }, [preselectedProductId, products, setPreselectedProductId]);

  // Adjust quantity for a specific product (bounded by product.stock)
  const handleAdjustQty = (productId, delta) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.stock <= 0) return;

    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(prod.stock, current + delta));
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
    setError('');
  };

  // Direct number input change with stock clamping
  const handleSetQty = (productId, rawVal) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.stock <= 0) return;

    const val = parseInt(rawVal, 10);
    setQuantities((prev) => {
      if (isNaN(val) || val <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      const clamped = Math.min(prod.stock, val);
      return { ...prev, [productId]: clamped };
    });
    setError('');
  };

  // Set all available stock for a product
  const handleSetMax = (productId) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.stock <= 0) return;
    setQuantities((prev) => ({ ...prev, [productId]: prod.stock }));
    setError('');
  };

  // Clear all entered quantities
  const handleClearAll = () => {
    setQuantities({});
    setError('');
  };

  // Active items for submission
  const selectedItems = useMemo(() => {
    return Object.entries(quantities)
      .map(([id, qty]) => {
        const prod = products.find((p) => p.id === id);
        if (!prod || qty <= 0) return null;
        return {
          product: prod,
          productId: prod.id,
          quantity: qty,
          prevBalance: prod.stock,
          newBalance: prod.stock - qty
        };
      })
      .filter(Boolean);
  }, [quantities, products]);

  const totalSelectedUnits = selectedItems.reduce((acc, it) => acc + it.quantity, 0);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

      if (viewFilter === 'SELECTED') {
        return matchSearch && (quantities[p.id] || 0) > 0;
      }
      return matchSearch;
    });
  }, [products, searchTerm, viewFilter, quantities]);

  const handleOpenReview = (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Please add delivery quantity for at least one in-stock product using [+] buttons.');
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

    const payload = selectedItems.map((it) => ({
      productId: it.product.id,
      quantity: it.quantity
    }));

    const res = deliverStockBatch({
      items: payload,
      party: fullParty,
      refNumber,
      notes,
      customTimestamp: timestamp
    });

    setIsConfirmOpen(false);

    if (res.success) {
      setLastSuccessResult({
        batchId: res.batchId,
        items: res.items,
        totalUnits: res.items.reduce((acc, it) => acc + it.quantity, 0),
        party: fullParty,
        refNumber,
        notes,
        timestamp
      });
      // Reset state
      setQuantities({});
      setRecipient('');
      setDestination('');
      setRefNumber('');
      setNotes('');
      setShowOptionalFields(false);
      setViewFilter('ALL');
    } else {
      setError(res.error || 'Failed to record stock delivery.');
    }
  };

  let fullPartyLabel = recipient.trim();
  if (destination.trim()) {
    fullPartyLabel = fullPartyLabel ? `${fullPartyLabel} (${destination.trim()})` : destination.trim();
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
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
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)',
            flexShrink: 0
          }}
        >
          <ArrowUpFromLine size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }} className="font-heading">
            Deliver Stock
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Set dispatch quantities for multiple products directly
          </p>
        </div>
      </div>

      {/* Success Card */}
      {lastSuccessResult && (
        <div className="success-card" style={{ background: 'var(--deliver-blue-light)', borderColor: 'var(--deliver-blue-border)', marginBottom: '18px' }}>
          <div className="success-icon-wrap" style={{ background: 'var(--deliver-blue)', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#0c4a6e', marginBottom: '4px' }}>
            Stock Delivered Successfully!
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#0369a1', marginBottom: '14px' }}>
            Dispatched <strong>{lastSuccessResult.items.length} {lastSuccessResult.items.length === 1 ? 'product' : 'products'}</strong> (-{lastSuccessResult.totalUnits} units total)
          </p>

          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '16px',
            border: '1px solid #bae6fd',
            maxHeight: '160px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {lastSuccessResult.items.map((it, idx) => (
              <div
                key={it.productId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  borderBottom: idx < lastSuccessResult.items.length - 1 ? '1px dashed #e2e8f0' : 'none',
                  fontSize: '0.84rem'
                }}
              >
                <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.productName || it.product?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Bal: {it.prevBalance} ➔ <strong style={{ color: '#0284c7' }}>{it.newBalance}</strong> {it.unit}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.95rem' }}>
                  -{it.quantity} {it.unit}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <WhatsAppBatchShareButton
              batchData={{
                type: 'DELIVERED',
                items: lastSuccessResult.items,
                party: lastSuccessResult.party,
                refNumber: lastSuccessResult.refNumber,
                notes: lastSuccessResult.notes,
                timestamp: lastSuccessResult.timestamp
              }}
              label="Share Dispatch Slip on WhatsApp"
              style={{ width: '100%', padding: '13px' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.84rem', padding: '10px 14px' }}
                onClick={() => setLastSuccessResult(null)}
              >
                Deliver More
              </button>
              <button
                className="btn btn-deliver"
                style={{ flex: 1, fontSize: '0.84rem', padding: '10px 14px' }}
                onClick={() => setCurrentTab('history')}
              >
                View in History <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--accent-rose-light)', border: '1px solid rgba(225, 29, 72, 0.3)', color: 'var(--accent-rose)', padding: '12px 14px', borderRadius: '12px', marginBottom: '14px', fontSize: '0.86rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* STICKY LIVE DISPATCH COUNTER */}
      <div style={{
        background: selectedItems.length > 0 ? 'var(--deliver-blue-light)' : 'var(--bg-card)',
        border: `1.5px solid ${selectedItems.length > 0 ? 'var(--deliver-blue)' : 'var(--border-color)'}`,
        borderRadius: '14px',
        padding: '12px 14px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        boxShadow: selectedItems.length > 0 ? '0 4px 14px rgba(2, 132, 199, 0.12)' : 'none'
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {selectedItems.length > 0 ? 'Dispatch Queued' : 'Ready to Deliver'}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: selectedItems.length > 0 ? 'var(--deliver-blue)' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {selectedItems.length} {selectedItems.length === 1 ? 'Product' : 'Products'} • -{totalSelectedUnits.toLocaleString()} units
          </div>
        </div>

        {selectedItems.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-rose)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px'
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      {/* Search Input Bar & Quick View Filter Tabs */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <Search
            size={16}
            color="var(--text-dim)"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search products to deliver..."
            style={{ paddingLeft: '40px', paddingRight: searchTerm ? '38px' : '14px', fontSize: '0.88rem', borderRadius: '12px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setViewFilter('ALL')}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: viewFilter === 'ALL' ? 'var(--primary)' : 'var(--bg-card)',
              border: viewFilter === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              color: viewFilter === 'ALL' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('SELECTED')}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: viewFilter === 'SELECTED' ? 'var(--deliver-blue)' : 'var(--bg-card)',
              border: viewFilter === 'SELECTED' ? '1px solid var(--deliver-blue)' : '1px solid var(--border-color)',
              color: viewFilter === 'SELECTED' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            Selected Only ({selectedItems.length})
          </button>
        </div>
      </div>

      {/* PRODUCTS VISUAL STEPPERS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
        {filteredProducts.map((p) => {
          const qty = quantities[p.id] || 0;
          const isSelected = qty > 0;
          const remainingBal = p.stock - qty;
          const isOutOfStock = (p.stock || 0) <= 0;

          return (
            <div
              key={p.id}
              className="card"
              style={{
                borderRadius: '16px',
                padding: '14px',
                border: isSelected 
                  ? '2px solid var(--deliver-blue)' 
                  : '1px solid var(--border-color)',
                background: isSelected 
                  ? 'rgba(2, 132, 199, 0.03)' 
                  : (isOutOfStock ? 'rgba(0, 0, 0, 0.02)' : 'var(--bg-card)'),
                boxShadow: isSelected ? '0 4px 16px rgba(2, 132, 199, 0.1)' : 'var(--shadow-sm)',
                opacity: isOutOfStock ? 0.6 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              {/* Product Info Row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px', gap: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.25 }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '3px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {p.code && <span className="badge badge-code" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{p.code}</span>}
                    <span>Available: <strong>{p.stock}</strong> {p.unit}</span>
                  </div>
                </div>

                {/* Status or remaining balance */}
                {isOutOfStock ? (
                  <span className="badge badge-reversed" style={{ fontSize: '0.68rem' }}>
                    OUT OF STOCK
                  </span>
                ) : isSelected ? (
                  <span className="badge badge-delivered" style={{ fontSize: '0.74rem', padding: '3px 8px', flexShrink: 0 }}>
                    Remaining: {remainingBal} {p.unit}
                  </span>
                ) : null}
              </div>

              {/* Stepper & Quick Chips */}
              {!isOutOfStock && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <button
                      type="button"
                      onClick={() => handleAdjustQty(p.id, -1)}
                      disabled={qty <= 0}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: qty <= 0 ? 'not-allowed' : 'pointer',
                        opacity: qty <= 0 ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min="0"
                      max={p.stock}
                      value={qty || ''}
                      placeholder="0"
                      onChange={(e) => handleSetQty(p.id, e.target.value)}
                      style={{
                        width: '56px',
                        height: '32px',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: isSelected ? 'var(--deliver-blue)' : 'var(--text-main)',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontFamily: 'var(--font-heading)'
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => handleAdjustQty(p.id, 1)}
                      disabled={qty >= p.stock}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--deliver-blue)' : 'var(--bg-card)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        border: isSelected ? 'none' : '1px solid var(--border-color)',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: qty >= p.stock ? 'not-allowed' : 'pointer',
                        opacity: qty >= p.stock ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleAdjustQty(p.id, 1)}
                      disabled={qty >= p.stock}
                      style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustQty(p.id, 5)}
                      disabled={qty + 5 > p.stock}
                      style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer', opacity: qty + 5 > p.stock ? 0.5 : 1 }}
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustQty(p.id, 10)}
                      disabled={qty + 10 > p.stock}
                      style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer', opacity: qty + 10 > p.stock ? 0.5 : 1 }}
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetMax(p.id)}
                      style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 700, background: 'rgba(2, 132, 199, 0.1)', color: 'var(--deliver-blue)', border: '1px solid rgba(2, 132, 199, 0.25)', cursor: 'pointer' }}
                    >
                      All ({p.stock})
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)' }}>
            No products match the filter.
          </div>
        )}
      </div>

      {/* Collapsible Optional Details (Recipient, Destination, DO #, Notes) */}
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
          <span>{showOptionalFields ? 'Hide' : '+ Add'} Delivered to, Location & Notes (Optional)</span>
          {showOptionalFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showOptionalFields && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="form-group">
              <label className="form-label">
                <span>Delivered to (Recipient / Customer)</span>
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

      {/* Main Review Button */}
      <button
        type="button"
        onClick={handleOpenReview}
        className="btn btn-deliver btn-block"
        style={{ padding: '16px' }}
        disabled={selectedItems.length === 0}
      >
        <ArrowUpFromLine size={20} strokeWidth={2.4} />
        {selectedItems.length > 0
          ? `Review & Deliver (${selectedItems.length} Products • -${totalSelectedUnits.toLocaleString()} Units)`
          : 'Select Products Above to Deliver'}
      </button>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        type="DELIVER"
        items={selectedItems}
        party={recipient}
        onPartyChange={setRecipient}
        refNumber={refNumber}
        notes={notes}
        operator={operator}
        timestamp={new Date().toISOString()}
      />
    </div>
  );
}
