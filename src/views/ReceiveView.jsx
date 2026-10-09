import React, { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  Plus, 
  CheckCircle2, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Package,
  Layers,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductModal from '../components/ProductModal';
import ProductSearchBar from '../components/ProductSearchBar';
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

  // Selected product in the search bar
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('10');

  // Multi-product batch list: array of { product, quantity }
  const [batchItems, setBatchItems] = useState([]);

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

  // Handle preselected product from other tabs
  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(preselectedProductId);
      setPreselectedProductId(null);
    } else if (!selectedProductId && products.length > 0 && batchItems.length === 0) {
      setSelectedProductId(products[0].id);
    }
  }, [preselectedProductId, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;
  const numQuantity = parseInt(quantity, 10) || 0;

  // Adjust input stepper quantity
  const handleAdjustQuantity = (delta) => {
    const current = parseInt(quantity, 10) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
    setError('');
  };

  // Quick preset buttons
  const handleAddPreset = (amount) => {
    const current = parseInt(quantity, 10) || 0;
    setQuantity(String(current + amount));
    setError('');
  };

  // Add currently selected product and quantity into batch list
  const handleAddProductToBatch = () => {
    if (!selectedProduct) {
      setError('Please search and select a product first.');
      return;
    }
    if (numQuantity <= 0) {
      setError('Quantity received must be at least 1.');
      return;
    }

    setBatchItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === selectedProduct.id);
      if (existingIndex >= 0) {
        // Increment quantity of existing item
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + numQuantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          prevBalance: selectedProduct.stock,
          newBalance: selectedProduct.stock + newQty
        };
        return updated;
      } else {
        // Add new item to batch list
        return [
          ...prev,
          {
            product: selectedProduct,
            quantity: numQuantity,
            prevBalance: selectedProduct.stock,
            newBalance: selectedProduct.stock + numQuantity
          }
        ];
      }
    });

    setError('');
    // Clear search selection so user can pick next product easily
    setSelectedProductId('');
    setQuantity('10');
  };

  // Inline adjustment inside batch items list
  const handleUpdateBatchItemQty = (productId, delta) => {
    setBatchItems((prev) =>
      prev
        .map((it) => {
          if (it.product.id === productId) {
            const nextQty = it.quantity + delta;
            if (nextQty <= 0) return null; // Remove if zero
            return {
              ...it,
              quantity: nextQty,
              newBalance: it.product.stock + nextQty
            };
          }
          return it;
        })
        .filter(Boolean)
    );
  };

  // Remove specific item from batch
  const handleRemoveBatchItem = (productId) => {
    setBatchItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  // Clear all items in batch
  const handleClearBatch = () => {
    setBatchItems([]);
    setError('');
  };

  // Total units across batch
  const totalBatchUnits = batchItems.reduce((acc, it) => acc + it.quantity, 0);

  // Compute items that will be submitted
  const getSubmissionItems = () => {
    let itemsToSubmit = [...batchItems];
    // If user has a product selected in form but didn't click "Add to List", include it automatically
    if (selectedProduct && numQuantity > 0) {
      const existsIndex = itemsToSubmit.findIndex((it) => it.product.id === selectedProduct.id);
      if (existsIndex >= 0) {
        // Already in list, do not duplicate
      } else {
        itemsToSubmit.push({
          product: selectedProduct,
          quantity: numQuantity,
          prevBalance: selectedProduct.stock,
          newBalance: selectedProduct.stock + numQuantity
        });
      }
    }
    return itemsToSubmit;
  };

  // Open confirmation modal
  const handleOpenReview = (e) => {
    e.preventDefault();
    const itemsToSubmit = getSubmissionItems();

    if (itemsToSubmit.length === 0) {
      setError('Please add at least one product with quantity to receive.');
      return;
    }

    setError('');
    setIsConfirmOpen(true);
  };

  // Submit the batch receiving transaction
  const handleConfirmSubmit = () => {
    const itemsToSubmit = getSubmissionItems();
    const timestamp = new Date().toISOString();

    const formattedPayload = itemsToSubmit.map((it) => ({
      productId: it.product.id,
      quantity: it.quantity
    }));

    const res = receiveStockBatch({
      items: formattedPayload,
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
      // Reset form and batch cart
      setBatchItems([]);
      setSelectedProductId('');
      setQuantity('10');
      setSupplier('');
      setRefNumber('');
      setNotes('');
      setShowOptionalFields(false);
    } else {
      setError(res.error || 'Failed to record stock receiving.');
    }
  };

  const pendingSubmissionItems = getSubmissionItems();

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }} className="font-heading">
            Receive Stock
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Receive single or multiple products at one time
          </p>
        </div>

        {batchItems.length > 0 && (
          <span className="badge badge-received" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>
            <Layers size={13} /> {batchItems.length} queued
          </span>
        )}
      </div>

      {/* Success Card (Supports Batch) */}
      {lastSuccessResult && (
        <div className="success-card" style={{ marginBottom: '20px' }}>
          <div className="success-icon-wrap">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#064e3b', marginBottom: '4px' }}>
            Stock Added Successfully!
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#065f46', marginBottom: '14px' }}>
            Received <strong>{lastSuccessResult.items.length} {lastSuccessResult.items.length === 1 ? 'product' : 'products'}</strong> ({lastSuccessResult.totalUnits} total units)
          </p>

          {/* Itemized received breakdown */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '16px',
            border: '1px solid #a7f3d0',
            maxHeight: '180px',
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
                <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem', flexShrink: 0 }}>
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
        <div style={{ background: 'var(--accent-rose-light)', border: '1px solid rgba(225, 29, 72, 0.3)', color: 'var(--accent-rose)', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.86rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* ACTIVE BATCH ITEMS LIST (CART) */}
      {batchItems.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1.5px solid var(--receive-green)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '18px',
          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--receive-green)" />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                Shipment List ({batchItems.length} {batchItems.length === 1 ? 'item' : 'items'})
              </strong>
            </div>
            <button
              type="button"
              onClick={handleClearBatch}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-rose)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px'
              }}
            >
              <RotateCcw size={12} /> Clear List
            </button>
          </div>

          {/* Scrollable list of items queued in shipment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', paddingRight: '2px' }}>
            {batchItems.map((it) => (
              <div
                key={it.product.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {it.product.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Bal: {it.product.stock} ➔ <strong style={{ color: 'var(--receive-green)' }}>{it.product.stock + it.quantity}</strong> {it.product.unit}
                  </div>
                </div>

                {/* Inline mini stepper for this item */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleUpdateBatchItemQty(it.product.id, -1)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 800, fontSize: '0.92rem', color: 'var(--receive-green)' }}>
                    +{it.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateBatchItemQty(it.product.id, 1)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBatchItem(it.product.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      padding: '4px',
                      cursor: 'pointer',
                      marginLeft: '2px'
                    }}
                    title="Remove product from shipment"
                  >
                    <Trash2 size={15} color="var(--accent-rose)" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Batch Units Totals Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px dashed var(--border-color)',
            fontSize: '0.84rem'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Units Queued:</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--receive-green)', fontWeight: 800 }}>
              +{totalBatchUnits.toLocaleString()} units
            </strong>
          </div>
        </div>
      )}

      {/* FORM: SELECT PRODUCT & QUANTITY */}
      <form onSubmit={handleOpenReview}>
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>
              {batchItems.length > 0 ? '+ Add Another Product' : '1. Search Product'}
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
            placeholder="Type product name or SKU to receive..."
            showStockStatus={true}
          />
        </div>

        {/* Quantity Stepper for current selection */}
        {selectedProduct && (
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label">
              Quantity to Receive ({selectedProduct.unit})
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

            {/* Visual single calculation */}
            <div className="calculation-card" style={{ marginTop: '12px' }}>
              <div className="calc-row">
                <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span>
                <span style={{ fontWeight: 600 }}>{selectedProduct.stock} {selectedProduct.unit}</span>
              </div>
              <div className="calc-row">
                <span style={{ color: 'var(--receive-green)', fontWeight: 600 }}>+ Adding:</span>
                <span style={{ color: 'var(--receive-green)', fontWeight: 700 }}>+{numQuantity} {selectedProduct.unit}</span>
              </div>
              <div className="calc-row final">
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Updated Balance:</span>
                <span className="calc-final-num green">
                  {selectedProduct.stock + numQuantity} {selectedProduct.unit}
                </span>
              </div>
            </div>

            {/* "+ Add to Shipment List" Button */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddProductToBatch}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px',
                fontWeight: 700,
                color: 'var(--receive-green)',
                borderColor: 'var(--receive-green)',
                background: 'var(--receive-green-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Add "{selectedProduct.name}" to Shipment List
            </button>
          </div>
        )}

        {/* Collapsible Optional Details (Supplier, Ref #, Notes) */}
        <div style={{ margin: '18px 0' }}>
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

        {/* Master Review Button */}
        <button
          type="submit"
          className="btn btn-success btn-block"
          style={{ padding: '16px' }}
          disabled={pendingSubmissionItems.length === 0}
        >
          <ArrowDownToLine size={20} strokeWidth={2.4} />
          {pendingSubmissionItems.length > 1
            ? `Review & Receive Shipment (${pendingSubmissionItems.length} Products)`
            : (pendingSubmissionItems.length === 1
                ? `Review & Receive (${pendingSubmissionItems[0].product.name})`
                : 'Review & Receive Stock')}
        </button>
      </form>

      {/* Confirmation Dialog (Supports Single or Multi-Product Items) */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        type="RECEIVE"
        items={pendingSubmissionItems}
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
