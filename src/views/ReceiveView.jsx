import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  Plus, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductModal from '../components/ProductModal';
import EditTransactionModal from '../components/EditTransactionModal';
import ProductSearchBar from '../components/ProductSearchBar';
import WhatsAppShareButton from '../components/WhatsAppShareButton';

export default function ReceiveView() {
  const { 
    products, 
    receiveStock, 
    preselectedProductId, 
    setPreselectedProductId,
    operator,
    setCurrentTab
  } = useApp();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [supplier, setSupplier] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

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

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;
  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const numQuantity = parseInt(quantity, 10) || 0;
  const calculatedNewBalance = currentStock + numQuantity;

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
      setError('Please select or search for a product first.');
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
        txId: res.transaction.id,
        transaction: res.transaction
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <WhatsAppShareButton
              transaction={lastSuccessResult.transaction}
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

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.78rem', padding: '8px 12px', color: 'var(--text-muted)' }}
              onClick={() => setIsEditOpen(true)}
            >
              <Edit3 size={13} /> Made a mistake? Edit this entry
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
        {/* Step 1: Searchable Product Text Bar */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>
              1. Search Product
            </label>
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

          {/* Dedicated Text Bar instead of dropdown */}
          <ProductSearchBar
            products={products}
            selectedProduct={selectedProduct}
            onSelectProduct={(p) => {
              setSelectedProductId(p ? p.id : '');
              setError('');
            }}
            onOpenCreateProduct={() => {
              setIsProductModalOpen(true);
            }}
            placeholder="Type product name or SKU (e.g. Ferrero, Dior)..."
            showStockStatus={true}
          />
        </div>

        {/* Step 2: Quantity Stepper */}
        {selectedProduct && (
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label">
              2. Quantity to Receive ({selectedProduct.unit})
            </label>
            <div className="stepper-container">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQuantity(-1)}
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
                required
              />
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQuantity(1)}
                aria-label="Increase quantity"
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

      {/* Re-Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setLastSuccessResult(null);
        }}
        transaction={lastSuccessResult?.transaction}
      />
    </div>
  );
}
