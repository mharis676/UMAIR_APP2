import React, { useState, useEffect } from 'react';
import { 
  ArrowUpFromLine, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Trash2,
  Layers,
  RotateCcw,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductSearchBar from '../components/ProductSearchBar';
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

  // Selected product in search bar
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Multi-product batch list: array of { product, quantity, prevBalance, newBalance }
  const [batchItems, setBatchItems] = useState([]);

  // Optional dispatch details
  const [recipient, setRecipient] = useState('');
  const [destination, setDestination] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Modals & States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [lastSuccessResult, setLastSuccessResult] = useState(null);
  const [error, setError] = useState('');

  // Handle preselected product from other tabs
  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(preselectedProductId);
      setPreselectedProductId(null);
    } else if (!selectedProductId && products.length > 0 && batchItems.length === 0) {
      const available = products.find((p) => p.stock > 0) || products[0];
      setSelectedProductId(available ? available.id : '');
    }
  }, [preselectedProductId, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;
  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const numQuantity = parseInt(quantity, 10) || 0;

  // How many of this product are already in the batch list?
  const alreadyInBatch = batchItems.find((it) => it.product.id === selectedProductId);
  const alreadyAddedQty = alreadyInBatch ? alreadyInBatch.quantity : 0;
  const remainingAvailableForSelection = Math.max(0, currentStock - alreadyAddedQty);

  const isOverDelivery = selectedProduct && numQuantity > remainingAvailableForSelection;
  const calculatedRemainingBalance = currentStock - (alreadyAddedQty + numQuantity);

  // Stepper adjustments for the search selection
  const handleAdjustQuantity = (delta) => {
    const current = parseInt(quantity, 10) || 0;
    const maxAllowed = remainingAvailableForSelection > 0 ? remainingAvailableForSelection : 1;
    const next = Math.max(1, Math.min(maxAllowed, current + delta));
    setQuantity(String(next));
    setError('');
  };

  const handleSetMax = () => {
    if (remainingAvailableForSelection > 0) {
      setQuantity(String(remainingAvailableForSelection));
    }
    setError('');
  };

  // Add selected product to the batch dispatch list
  const handleAddProductToBatch = () => {
    if (!selectedProduct) {
      setError('Please search and select a product to deliver.');
      return;
    }
    if (currentStock === 0) {
      setError(`"${selectedProduct.name}" has 0 stock in hand. Receive stock first.`);
      return;
    }
    if (numQuantity <= 0) {
      setError('Quantity to deliver must be at least 1.');
      return;
    }
    if (numQuantity > remainingAvailableForSelection) {
      setError(`Cannot deliver ${numQuantity} ${selectedProduct.unit}. Only ${remainingAvailableForSelection} remaining available.`);
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
          newBalance: selectedProduct.stock - newQty
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
            newBalance: selectedProduct.stock - numQuantity
          }
        ];
      }
    });

    setError('');
    // Clear selection so user can pick the next product easily
    setSelectedProductId('');
    setQuantity('1');
  };

  // Inline adjustment inside batch items list
  const handleUpdateBatchItemQty = (productId, delta) => {
    setBatchItems((prev) =>
      prev
        .map((it) => {
          if (it.product.id === productId) {
            const nextQty = it.quantity + delta;
            if (nextQty <= 0) return null; // Remove if zero
            if (nextQty > it.product.stock) {
              setError(`Maximum available stock for "${it.product.name}" is ${it.product.stock} ${it.product.unit}.`);
              return it;
            }
            return {
              ...it,
              quantity: nextQty,
              newBalance: it.product.stock - nextQty
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

  // Clear all batch items
  const handleClearBatch = () => {
    setBatchItems([]);
    setError('');
  };

  // Total batch units
  const totalBatchUnits = batchItems.reduce((acc, it) => acc + it.quantity, 0);

  // Compute items that will be submitted
  const getSubmissionItems = () => {
    let itemsToSubmit = [...batchItems];
    // If user has a valid product selected in form but didn't click "Add to List", include it automatically
    if (selectedProduct && numQuantity > 0 && !isOverDelivery) {
      const existsIndex = itemsToSubmit.findIndex((it) => it.product.id === selectedProduct.id);
      if (existsIndex >= 0) {
        // Already in list
      } else {
        itemsToSubmit.push({
          product: selectedProduct,
          quantity: numQuantity,
          prevBalance: selectedProduct.stock,
          newBalance: selectedProduct.stock - numQuantity
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
      setError('Please add at least one product with available stock to deliver.');
      return;
    }

    // Verify none exceed stock
    for (const it of itemsToSubmit) {
      if (it.quantity > it.product.stock) {
        setError(`Insufficient stock for "${it.product.name}". Available: ${it.product.stock}, Entered: ${it.quantity}.`);
        return;
      }
    }

    setError('');
    setIsConfirmOpen(true);
  };

  // Submit the batch delivery transaction
  const handleConfirmSubmit = () => {
    const itemsToSubmit = getSubmissionItems();
    const timestamp = new Date().toISOString();

    let fullParty = recipient.trim();
    if (destination.trim()) {
      fullParty = fullParty ? `${fullParty} (${destination.trim()})` : destination.trim();
    }

    const formattedPayload = itemsToSubmit.map((it) => ({
      productId: it.product.id,
      quantity: it.quantity
    }));

    const res = deliverStockBatch({
      items: formattedPayload,
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
      // Reset form and batch cart
      setBatchItems([]);
      setSelectedProductId('');
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

  const pendingSubmissionItems = getSubmissionItems();

  let fullPartyLabel = recipient.trim();
  if (destination.trim()) {
    fullPartyLabel = fullPartyLabel ? `${fullPartyLabel} (${destination.trim()})` : destination.trim();
  }

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }} className="font-heading">
            Deliver Stock
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Deliver single or multiple products at one time
          </p>
        </div>

        {batchItems.length > 0 && (
          <span className="badge badge-delivered" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>
            <Layers size={13} /> {batchItems.length} queued
          </span>
        )}
      </div>

      {/* Success Card (Supports Batch) */}
      {lastSuccessResult && (
        <div className="success-card" style={{ background: 'var(--deliver-blue-light)', borderColor: 'var(--deliver-blue-border)', marginBottom: '20px' }}>
          <div className="success-icon-wrap" style={{ background: 'var(--deliver-blue)', boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 className="font-heading" style={{ fontSize: '1.25rem', color: '#0c4a6e', marginBottom: '4px' }}>
            Stock Delivered Successfully!
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#0369a1', marginBottom: '14px' }}>
            Dispatched <strong>{lastSuccessResult.items.length} {lastSuccessResult.items.length === 1 ? 'product' : 'products'}</strong> ({lastSuccessResult.totalUnits} total units)
          </p>

          {/* Itemized delivered breakdown */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '16px',
            border: '1px solid #bae6fd',
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
                    Bal: {it.prevBalance} ➔ <strong style={{ color: '#0284c7' }}>{it.newBalance}</strong> {it.unit}
                  </div>
                </div>
                <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.95rem', flexShrink: 0 }}>
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
        <div style={{ background: 'var(--accent-rose-light)', border: '1px solid rgba(225, 29, 72, 0.3)', color: 'var(--accent-rose)', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.86rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* ACTIVE BATCH ITEMS LIST (CART) */}
      {batchItems.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1.5px solid var(--deliver-blue)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '18px',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="var(--deliver-blue)" />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                Dispatch List ({batchItems.length} {batchItems.length === 1 ? 'item' : 'items'})
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

          {/* Scrollable list of items queued in dispatch */}
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
                    Bal: {it.product.stock} ➔ <strong style={{ color: 'var(--deliver-blue)' }}>{it.product.stock - it.quantity}</strong> {it.product.unit}
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
                  <span style={{ minWidth: '36px', textAlign: 'center', fontWeight: 800, fontSize: '0.92rem', color: 'var(--deliver-blue)' }}>
                    -{it.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateBatchItemQty(it.product.id, 1)}
                    disabled={it.quantity >= it.product.stock}
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
                      justifyContent: 'center',
                      opacity: it.quantity >= it.product.stock ? 0.4 : 1
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
                    title="Remove product from dispatch"
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
            <strong style={{ fontSize: '1.05rem', color: 'var(--deliver-blue)', fontWeight: 800 }}>
              -{totalBatchUnits.toLocaleString()} units
            </strong>
          </div>
        </div>
      )}

      {/* FORM: SELECT PRODUCT & QUANTITY */}
      <form onSubmit={handleOpenReview}>
        <div className="form-group">
          <label className="form-label" style={{ marginBottom: '8px' }}>
            {batchItems.length > 0 ? '+ Add Another Product to Deliver' : '1. Search Product to Deliver'}
          </label>

          <ProductSearchBar
            products={products}
            selectedProduct={selectedProduct}
            onSelectProduct={(p) => {
              setSelectedProductId(p ? p.id : '');
              setError('');
            }}
            placeholder="Type product name to deliver..."
            showStockStatus={true}
          />
        </div>

        {/* Quantity Stepper for current selection */}
        {selectedProduct && (
          <div className="form-group" style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Quantity to Deliver ({selectedProduct.unit})
              </label>
              <span style={{ fontSize: '0.78rem', color: remainingAvailableForSelection > 0 ? 'var(--deliver-blue)' : 'var(--accent-rose)', fontWeight: 600 }}>
                Available: {remainingAvailableForSelection} {selectedProduct.unit}
              </span>
            </div>

            <div className="stepper-container">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQuantity(-1)}
                disabled={numQuantity <= 1 || remainingAvailableForSelection === 0}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={remainingAvailableForSelection}
                className="stepper-input"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError('');
                }}
                disabled={remainingAvailableForSelection === 0}
                required
              />
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleAdjustQuantity(1)}
                disabled={numQuantity >= remainingAvailableForSelection || remainingAvailableForSelection === 0}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Quick Presets */}
            <div className="quick-chip-row">
              <button type="button" className="quick-chip" onClick={() => handleAdjustQuantity(1)} disabled={remainingAvailableForSelection === 0}>+1</button>
              <button type="button" className="quick-chip" onClick={() => handleAdjustQuantity(5)} disabled={remainingAvailableForSelection < 5}>+5</button>
              <button type="button" className="quick-chip" onClick={() => handleAdjustQuantity(10)} disabled={remainingAvailableForSelection < 10}>+10</button>
              <button type="button" className="quick-chip" onClick={handleSetMax} disabled={remainingAvailableForSelection === 0}>
                All Available ({remainingAvailableForSelection})
              </button>
            </div>

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
                  marginTop: '12px',
                  fontSize: '0.86rem'
                }}
              >
                <ShieldAlert size={22} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Exceeds available stock!</strong>
                  <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>
                    You entered {numQuantity} {selectedProduct.unit}, but only {remainingAvailableForSelection} are available.
                  </div>
                </div>
              </div>
            )}

            {/* Visual single calculation */}
            {numQuantity > 0 && !isOverDelivery && remainingAvailableForSelection > 0 && (
              <div className="calculation-card" style={{ marginTop: '12px' }}>
                <div className="calc-row">
                  <span style={{ color: 'var(--text-muted)' }}>Current Stock:</span>
                  <span style={{ fontWeight: 600 }}>{currentStock} {selectedProduct.unit}</span>
                </div>
                <div className="calc-row">
                  <span style={{ color: 'var(--deliver-blue)', fontWeight: 600 }}>- Dispatched:</span>
                  <span style={{ color: 'var(--deliver-blue)', fontWeight: 700 }}>-{alreadyAddedQty + numQuantity} {selectedProduct.unit}</span>
                </div>
                <div className="calc-row final">
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Remaining Balance:</span>
                  <span className="calc-final-num blue">
                    {calculatedRemainingBalance} {selectedProduct.unit}
                  </span>
                </div>
              </div>
            )}

            {/* "+ Add to Dispatch List" Button */}
            {remainingAvailableForSelection > 0 && !isOverDelivery && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddProductToBatch}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '12px',
                  fontWeight: 700,
                  color: 'var(--deliver-blue)',
                  borderColor: 'var(--deliver-blue)',
                  background: 'var(--deliver-blue-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={18} strokeWidth={2.5} />
                Add "{selectedProduct.name}" to Dispatch List
              </button>
            )}
          </div>
        )}

        {/* Collapsible Optional Details (Recipient, Destination, Ref #, Notes) */}
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

        {/* Master Review Button */}
        <button
          type="submit"
          className="btn btn-deliver btn-block"
          style={{ padding: '16px' }}
          disabled={pendingSubmissionItems.length === 0}
        >
          <ArrowUpFromLine size={20} strokeWidth={2.4} />
          {pendingSubmissionItems.length > 1
            ? `Review & Deliver Dispatch (${pendingSubmissionItems.length} Products)`
            : (pendingSubmissionItems.length === 1
                ? `Review & Deliver (${pendingSubmissionItems[0].product.name})`
                : 'Review & Deliver Stock')}
        </button>
      </form>

      {/* Confirmation Dialog (Supports Single or Multi-Product Items) */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        type="DELIVER"
        items={pendingSubmissionItems}
        party={fullPartyLabel}
        refNumber={refNumber}
        notes={notes}
        operator={operator}
        timestamp={new Date().toISOString()}
      />
    </div>
  );
}
