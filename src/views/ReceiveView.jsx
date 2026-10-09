import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  Plus, 
  CheckCircle2, 
  Building2, 
  FileText, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryInfo } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductModal from '../components/ProductModal';

export default function ReceiveView() {
  const { 
    products, 
    receiveStock, 
    preselectedProductId, 
    setPreselectedProductId,
    operator,
    setCurrentTab
  } = useApp();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [supplier, setSupplier] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Modals
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
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
  const calculatedNewBalance = currentStock + numQuantity;
  const categoryInfo = selectedProduct ? getCategoryInfo(selectedProduct.category) : null;

  const handleAdjustQuantity = (delta) => {
    const current = parseInt(quantity, 10) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
    setError('');
  };

  const handleAddPreset = (amount) => {
    const current = parseInt(quantity, 10) || 0;
    setQuantity(String(current + amount));
    setError('');
  };

  const handleOpenReview = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product first.');
      return;
    }
    if (numQuantity <= 0) {
      setError('Quantity received must be at least 1.');
      return;
    }
    setError('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    const timestamp = new Date().toISOString();

    const res = receiveStock({
      productId: selectedProduct.id,
      quantity: numQuantity,
      party: supplier,
      refNumber,
      notes,
      customTimestamp: timestamp
    });

    setIsConfirmOpen(false);

    if (res.success) {
      setLastSuccessResult({
        product: selectedProduct,
        receivedQuantity: numQuantity,
        prevBalance: res.prevBalance,
        newBalance: res.newBalance,
        refNumber: res.transaction.refNumber,
        txId: res.transaction.id
      });
      setQuantity('10');
      setSupplier('');
      setRefNumber('');
      setNotes('');
      setShowOptionalFields(false);
    } else {
      setError(res.error || 'Failed to record stock receiving.');
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
            background: 'var(--receive-green-light)',
            color: 'var(--receive-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)'
          }}
        >
          <ArrowDownToLine size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }} className="font-heading">
            Receive Stock
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Record inbound goods and update balance
          </p>
        </div>
      </div>

      {/* Success Card */}
      {lastSuccessResult && (
        <div className="success-card">
          <div className="success-icon-wrap">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#064e3b', marginBottom: '6px' }}>
            Stock Added Successfully!
          </h3>
          <p style={{ fontSize: '0.92rem', color: '#065f46', marginBottom: '16px', lineHeight: '1.4' }}>
            <strong>{lastSuccessResult.product.name}</strong><br />
            Previous: {lastSuccessResult.prevBalance} {lastSuccessResult.product.unit} ➔ Received: +{lastSuccessResult.receivedQuantity} {lastSuccessResult.product.unit}<br />
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#047857' }}>
              New Balance: {lastSuccessResult.newBalance} {lastSuccessResult.product.unit}
            </span>
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.84rem', padding: '10px 16px' }}
              onClick={() => setLastSuccessResult(null)}
            >
              Receive Another
            </button>
            <button
              className="btn btn-primary"
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
        {/* Step 1: Select Product Card */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="form-label" style={{ margin: 0 }}>
              1. Select Product
            </span>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              style={{
                background: 'var(--primary-light)',
                border: 'none',
                color: 'var(--primary)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> New Product
            </button>
          </div>

          {selectedProduct ? (
            <div
              className="card"
              onClick={() => setIsProductPickerOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderColor: 'var(--border-focus)',
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
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Current: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong>
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
              2. Quantity to Receive ({selectedProduct.unit})
            </label>
            <div className="stepper-container">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQuantity(-1)}
                disabled={numQuantity <= 1}
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
                required
              />
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQuantity(1)}
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="quick-chip-row">
              <button type="button" className="quick-chip" onClick={() => handleAddPreset(5)}>+5</button>
              <button type="button" className="quick-chip" onClick={() => handleAddPreset(10)}>+10</button>
              <button type="button" className="quick-chip" onClick={() => handleAddPreset(25)}>+25</button>
              <button type="button" className="quick-chip" onClick={() => handleAddPreset(50)}>+50</button>
              <button type="button" className="quick-chip" onClick={() => handleAddPreset(100)}>+100</button>
            </div>
          </div>
        )}

        {/* Calculation Visual Summary Card */}
        {selectedProduct && numQuantity > 0 && (
          <div className="calculation-card">
            <div className="calc-row">
              <span style={{ color: 'var(--text-muted)' }}>Current In-Stock:</span>
              <span style={{ fontWeight: 600 }}>{currentStock} {selectedProduct.unit}</span>
            </div>
            <div className="calc-row">
              <span style={{ color: 'var(--receive-green)', fontWeight: 600 }}>+ Arriving Stock:</span>
              <span style={{ color: 'var(--receive-green)', fontWeight: 700 }}>+{numQuantity} {selectedProduct.unit}</span>
            </div>
            <div className="calc-row final">
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Updated Balance:</span>
              <span className="calc-final-num green">
                {calculatedNewBalance} {selectedProduct.unit}
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
            <span>{showOptionalFields ? 'Hide' : '+ Add'} Supplier, Ref # & Notes (Optional)</span>
            {showOptionalFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showOptionalFields && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', marginTop: '8px', animation: 'fadeIn 0.2s ease-out' }}>
              <div className="form-group">
                <label className="form-label">
                  <span>Supplier / Source</span>
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

        {/* Submit Review Button */}
        <button
          type="submit"
          className="btn btn-success btn-block"
          style={{ padding: '16px' }}
          disabled={!selectedProduct || numQuantity <= 0}
        >
          <ArrowDownToLine size={20} strokeWidth={2.4} />
          Review & Receive Stock
        </button>
      </form>

      {/* Visual Product Picker Bottom Sheet */}
      {isProductPickerOpen && (
        <div className="modal-overlay" onClick={() => setIsProductPickerOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-heading">Choose Product</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  setIsProductPickerOpen(false);
                  setIsProductModalOpen(true);
                }}
                title="Create New Product"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Picker Search */}
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
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div className="category-avatar" style={{ background: cat.bg, width: '38px', height: '38px', fontSize: '1.2rem' }}>
                      {cat.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Stock: <strong>{p.stock} {p.unit}</strong>
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="var(--primary)" />}
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
        type="RECEIVE"
        product={selectedProduct}
        quantity={numQuantity}
        prevBalance={currentStock}
        newBalance={calculatedNewBalance}
        party={supplier}
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
          setSelectedProductId(newProd.id);
        }}
      />
    </div>
  );
}
