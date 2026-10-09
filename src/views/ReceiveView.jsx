import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  Plus, 
  CheckCircle2, 
  Building2, 
  FileText, 
  Calendar, 
  Clock, 
  Search,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
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
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Custom date/time or auto current
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customDateTime, setCustomDateTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  // Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [lastSuccessResult, setLastSuccessResult] = useState(null);
  const [error, setError] = useState('');

  // Handle preselection when navigated from another screen
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

  const handleOpenReview = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product first.');
      return;
    }
    if (numQuantity <= 0) {
      setError('Quantity received must be a positive number greater than 0.');
      return;
    }
    setError('');
    setIsConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    const timestamp = useCurrentTime ? new Date().toISOString() : new Date(customDateTime).toISOString();

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
      // Reset form
      setQuantity('');
      setSupplier('');
      setRefNumber('');
      setNotes('');
    } else {
      setError(res.error || 'Failed to record stock receiving.');
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
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ArrowDownToLine size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }} className="font-heading">
            Receive Stock
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Record inbound goods & update inventory
          </p>
        </div>
      </div>

      {/* Success Banner if just recorded */}
      {lastSuccessResult && (
        <div className="success-card">
          <div className="success-icon-wrap">
            <CheckCircle2 size={30} />
          </div>
          <h3 className="font-heading" style={{ fontSize: '1.2rem', color: '#ecfdf5', marginBottom: '6px' }}>
            Stock Received Successfully!
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#a7f3d0', marginBottom: '14px', lineHeight: '1.4' }}>
            <strong>{lastSuccessResult.product.name}</strong><br />
            Current stock: {lastSuccessResult.prevBalance} {lastSuccessResult.product.unit}. Received: {lastSuccessResult.receivedQuantity} {lastSuccessResult.product.unit}.<br />
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              New balance: {lastSuccessResult.newBalance} {lastSuccessResult.product.unit}
            </span>
          </p>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '10px 14px' }}
              onClick={handleResetForNew}
            >
              Receive More Stock
            </button>
            <button
              className="btn btn-primary"
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
        {/* Step 1: Product Selection */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label className="form-label" style={{ margin: 0 }}>
              1. Select Product *
            </label>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={12} /> New Product
            </button>
          </div>

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
              <option value="">No products available. Click New Product</option>
            )}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code || 'No SKU'}) — Stock: {p.stock} {p.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Product Current Stock Indicator */}
        {selectedProduct && (
          <div
            style={{
              background: '#0d131f',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Available Stock</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                {selectedProduct.stock} {selectedProduct.unit}
              </div>
            </div>
            <span className="badge badge-category">{selectedProduct.category}</span>
          </div>
        )}

        {/* Step 2: Quantity Received */}
        <div className="form-group">
          <label className="form-label">
            2. Quantity Received ({selectedProduct?.unit || 'units'}) *
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className="input input-num-huge"
            placeholder="0"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setError('');
            }}
            required
          />
        </div>

        {/* Real-time Calculation Preview */}
        {selectedProduct && numQuantity > 0 && (
          <div className="balance-preview-box">
            <div className="balance-step-row">
              <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span>
              <span>{currentStock} {selectedProduct.unit}</span>
            </div>
            <div className="balance-step-row">
              <span style={{ color: '#34d399', fontWeight: 600 }}>+ Received:</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>+{numQuantity} {selectedProduct.unit}</span>
            </div>
            <div className="balance-step-row">
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>New Balance:</span>
              <span className="balance-final-num green">
                {calculatedNewBalance} {selectedProduct.unit}
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Optional Details */}
        <div className="form-group">
          <label className="form-label">
            <span>Supplier / Source</span>
            <span className="optional">Optional</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input"
              placeholder="e.g. Nestlé Logistics, Dior Distribution..."
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Reference / Delivery Slip Number</span>
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

        <div className="form-group">
          <label className="form-label">
            <span>Notes / Remarks</span>
            <span className="optional">Optional</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Fresh batch, expiry 2028, inspected"
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
          className="btn btn-success btn-block"
          style={{ marginTop: '10px', padding: '14px' }}
          disabled={!selectedProduct || numQuantity <= 0}
        >
          <ArrowDownToLine size={20} />
          Review & Receive Stock
        </button>
      </form>

      {/* Confirmation Step Dialog */}
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
        timestamp={useCurrentTime ? new Date().toISOString() : new Date(customDateTime).toISOString()}
      />

      {/* Inline Add Product Modal */}
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
