import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowDownToLine, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductModal from '../components/ProductModal';
import { WhatsAppBatchShareButton } from '../components/WhatsAppShareButton';

export default function ReceiveView() {
  const { 
    products, 
    receiveStockBatch, 
    preselectedProductId, 
    setPreselectedProductId, 
    operator, 
    setCurrentTab 
  } = useApp();

  // Quantities mapped by productId: { [productId]: number }
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState('ALL'); // 'ALL' | 'SELECTED'

  // Optional batch details
  const [supplier, setSupplier] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Modals & States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [lastSuccessResult, setLastSuccessResult] = useState(null);
  const [error, setError] = useState('');

  // Preselected product from other tabs
  useEffect(() => {
    if (preselectedProductId) {
      setQuantities((prev) => ({
        ...prev,
        [preselectedProductId]: (prev[preselectedProductId] || 0) + 10
      }));
      setPreselectedProductId(null);
    }
  }, [preselectedProductId, setPreselectedProductId]);

  // Adjust quantity for a specific product
  const handleAdjustQty = (productId, delta) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
    setError('');
  };

  // Direct number input change
  const handleSetQty = (productId, rawVal) => {
    const val = parseInt(rawVal, 10);
    setQuantities((prev) => {
      if (isNaN(val) || val <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: val };
    });
    setError('');
  };

  // Clear all entered quantities
  const handleClearAll = () => {
    setQuantities({});
    setError('');
  };

  // Compile active items list for submission
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
          newBalance: prod.stock + qty
        };
      })
      .filter(Boolean);
  }, [quantities, products]);

  const totalSelectedUnits = selectedItems.reduce((acc, it) => acc + it.quantity, 0);

  // Filtered products list for the visual stepper screen
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
      setError('Please add receiving quantity for at least one product using the [+] buttons.');
      return;
    }
    setError('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    const timestamp = new Date().toISOString();
    const payload = selectedItems.map((it) => ({
      productId: it.product.id,
      quantity: it.quantity
    }));

    const res = receiveStockBatch({
      items: payload,
      party: supplier,
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
        party: supplier,
        refNumber,
        notes,
        timestamp
      });
      // Reset state
      setQuantities({});
      setSupplier('');
      setRefNumber('');
      setNotes('');
      setShowOptionalFields(false);
      setViewFilter('ALL');
    } else {
      setError(res.error || 'Failed to record stock receiving.');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--receive-green-light)',
              color: 'var(--receive-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)',
              flexShrink: 0
            }}
          >
            <ArrowDownToLine size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }} className="font-heading">
              Receive Stock
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Set quantities for multiple products directly
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsProductModalOpen(true)}
          style={{
            background: 'var(--primary-light)',
            border: 'none',
            color: 'var(--primary)',
            borderRadius: '10px',
            padding: '7px 11px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Plus size={14} strokeWidth={2.5} /> New Product
        </button>
      </div>

      {/* Success Card */}
      {lastSuccessResult && (
        <div className="success-card" style={{ marginBottom: '18px' }}>
          <div className="success-icon-wrap">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#064e3b', marginBottom: '4px' }}>
            Stock Added Successfully!
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#065f46', marginBottom: '14px' }}>
            Received <strong>{lastSuccessResult.items.length} {lastSuccessResult.items.length === 1 ? 'product' : 'products'}</strong> (+{lastSuccessResult.totalUnits} units total)
          </p>

          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '16px',
            border: '1px solid #a7f3d0',
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
                    Bal: {it.prevBalance} ➔ <strong style={{ color: '#059669' }}>{it.newBalance}</strong> {it.unit}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                  +{it.quantity} {it.unit}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <WhatsAppBatchShareButton
              batchData={{
                type: 'RECEIVED',
                items: lastSuccessResult.items,
                party: lastSuccessResult.party,
                refNumber: lastSuccessResult.refNumber,
                notes: lastSuccessResult.notes,
                timestamp: lastSuccessResult.timestamp
              }}
              label="Share Receiving Slip on WhatsApp"
              style={{ width: '100%', padding: '13px' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.84rem', padding: '10px 14px' }}
                onClick={() => setLastSuccessResult(null)}
              >
                Receive More
              </button>
              <button
                className="btn btn-primary"
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

      {/* STICKY LIVE BATCH COUNTER & FILTERS */}
      <div style={{
        background: selectedItems.length > 0 ? 'var(--receive-green-light)' : 'var(--bg-card)',
        border: `1.5px solid ${selectedItems.length > 0 ? 'var(--receive-green)' : 'var(--border-color)'}`,
        borderRadius: '14px',
        padding: '12px 14px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
        boxShadow: selectedItems.length > 0 ? '0 4px 14px rgba(5, 150, 105, 0.12)' : 'none'
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {selectedItems.length > 0 ? 'Shipment Queued' : 'Ready to Receive'}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: selectedItems.length > 0 ? 'var(--receive-green)' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {selectedItems.length} {selectedItems.length === 1 ? 'Product' : 'Products'} • +{totalSelectedUnits.toLocaleString()} units
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
            placeholder="Search products to receive..."
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
              background: viewFilter === 'SELECTED' ? 'var(--receive-green)' : 'var(--bg-card)',
              border: viewFilter === 'SELECTED' ? '1px solid var(--receive-green)' : '1px solid var(--border-color)',
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
          const newBalance = p.stock + qty;

          return (
            <div
              key={p.id}
              className="card"
              style={{
                borderRadius: '16px',
                padding: '14px',
                border: isSelected ? '2px solid var(--receive-green)' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(5, 150, 105, 0.03)' : 'var(--bg-card)',
                boxShadow: isSelected ? '0 4px 16px rgba(5, 150, 105, 0.1)' : 'var(--shadow-sm)',
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
                    <span>Stock: <strong>{p.stock}</strong> {p.unit}</span>
                  </div>
                </div>

                {/* Live balance indicator */}
                {isSelected && (
                  <span className="badge badge-received" style={{ fontSize: '0.74rem', padding: '3px 8px', flexShrink: 0 }}>
                    New: {newBalance} {p.unit}
                  </span>
                )}
              </div>

              {/* Stepper & Quick Chips */}
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
                    value={qty || ''}
                    placeholder="0"
                    onChange={(e) => handleSetQty(p.id, e.target.value)}
                    style={{
                      width: '56px',
                      height: '32px',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: isSelected ? 'var(--receive-green)' : 'var(--text-main)',
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontFamily: 'var(--font-heading)'
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => handleAdjustQty(p.id, 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--receive-green)' : 'var(--bg-card)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      border: isSelected ? 'none' : '1px solid var(--border-color)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Quick Add Preset Buttons */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleAdjustQty(p.id, 5)}
                    style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustQty(p.id, 10)}
                    style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustQty(p.id, 25)}
                    style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    +25
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustQty(p.id, 50)}
                    style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  >
                    +50
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-muted)' }}>
            No products match the filter.
          </div>
        )}
      </div>

      {/* Collapsible Optional Details (Supplier, Ref #, Notes) */}
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
          <span>{showOptionalFields ? 'Hide' : '+ Add'} Received from, Ref # & Notes (Optional)</span>
          {showOptionalFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showOptionalFields && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="form-group">
              <label className="form-label">
                <span>Received from (Supplier / Source)</span>
                <span className="optional">Optional</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Ferrero Logistics, Dior Distribution..."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Reference / Delivery Order #</span>
                <span className="optional">Optional</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. GRN-1049, PO-8492, INV-002"
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
                placeholder="e.g. Fresh batch, inspected by warehouse team"
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
        className="btn btn-success btn-block"
        style={{ padding: '16px' }}
        disabled={selectedItems.length === 0}
      >
        <ArrowDownToLine size={20} strokeWidth={2.4} />
        {selectedItems.length > 0
          ? `Review & Receive (${selectedItems.length} Products • +${totalSelectedUnits.toLocaleString()} Units)`
          : 'Select Products Above to Receive'}
      </button>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        type="RECEIVE"
        items={selectedItems}
        party={supplier}
        onPartyChange={setSupplier}
        refNumber={refNumber}
        notes={notes}
        operator={operator}
        timestamp={new Date().toISOString()}
      />

      {/* Product Creation Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onCreatedCallback={(newProd) => {
          setQuantities((prev) => ({ ...prev, [newProd.id]: 10 }));
        }}
      />
    </div>
  );
}
