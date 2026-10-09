import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UNIT_OPTIONS, CATEGORIES_META, CATEGORY_OPTIONS } from '../types';
import { WhatsAppProductStockButton } from './WhatsAppShareButton';
import CustomDropdown from './CustomDropdown';

export default function ProductModal({ isOpen, onClose, editingProduct = null, onCreatedCallback = null }) {
  const { addProduct, updateProduct, operator } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [customUnit, setCustomUnit] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setCode(editingProduct.code || '');
      if (CATEGORY_OPTIONS.includes(editingProduct.category)) {
        setCategory(editingProduct.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(editingProduct.category || '');
      }
      if (UNIT_OPTIONS.includes(editingProduct.unit)) {
        setUnit(editingProduct.unit);
        setCustomUnit('');
      } else {
        setUnit('custom');
        setCustomUnit(editingProduct.unit || '');
      }
      setInitialStock(String(editingProduct.stock || 0));
    } else {
      setName('');
      setCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
      setCategory(CATEGORY_OPTIONS[0]);
      setCustomCategory('');
      setUnit('pieces');
      setCustomUnit('');
      setInitialStock('0');
    }
    setError('');
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;
    const finalUnit = unit === 'custom' && customUnit.trim() ? customUnit.trim() : unit;

    if (editingProduct) {
      const res = updateProduct(editingProduct.id, {
        name: name.trim(),
        code: code.trim(),
        category: finalCategory,
        unit: finalUnit
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Failed to update product.');
      }
    } else {
      const res = addProduct({
        name: name.trim(),
        code: code.trim(),
        category: finalCategory,
        unit: finalUnit,
        initialStock: parseInt(initialStock, 10) || 0
      });

      if (res.success) {
        if (onCreatedCallback) {
          onCreatedCallback(res.product);
        }
        onClose();
      } else {
        setError(res.error || 'Failed to create product.');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title font-heading">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'var(--accent-rose-light)', border: '1px solid rgba(225, 29, 72, 0.3)', color: 'var(--accent-rose)', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {editingProduct && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current In-Stock</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                {editingProduct.stock} <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{editingProduct.unit}</span>
              </div>
            </div>
            <WhatsAppProductStockButton product={editingProduct} variant="button" />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Product Name *
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Ferrero Rocher 24s, Dior Sauvage..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Product ID / Code</span>
              <span className="optional">Optional</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder="e.g. SKU-1049, CHOC-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0 12px', flexShrink: 0 }}
                onClick={() => setCode(`PRD-${Math.floor(100 + Math.random() * 900)}`)}
                title="Generate SKU Code"
              >
                <Sparkles size={16} color="var(--primary)" />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Category</span>
              <span className="optional">Optional</span>
            </label>
            <CustomDropdown
              value={category}
              onChange={(val) => setCategory(val)}
              options={[
                ...CATEGORIES_META.map((cat) => ({ value: cat.name, label: cat.name })),
                { value: 'Other', label: 'Other (Custom Category)' }
              ]}
              placeholder="Select category..."
            />
            {category === 'Other' && (
              <input
                type="text"
                className="input"
                style={{ marginTop: '8px' }}
                placeholder="Type custom category name..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Unit of Measurement *
            </label>
            <CustomDropdown
              value={unit}
              onChange={(val) => setUnit(val)}
              options={[
                ...UNIT_OPTIONS.map((u) => ({ value: u, label: u })),
                { value: 'custom', label: 'Custom unit...' }
              ]}
              placeholder="Select unit..."
            />
            {unit === 'custom' && (
              <input
                type="text"
                className="input"
                style={{ marginTop: '8px' }}
                placeholder="e.g. tins, rolls, sets..."
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
              />
            )}
          </div>

          {!editingProduct && (
            <div className="form-group">
              <label className="form-label">
                <span>Initial Stock Quantity</span>
                <span className="optional">Optional (Defaults to 0)</span>
              </label>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
              />
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Stock can also be added anytime using the "Receive Stock" screen.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, padding: '14px' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, padding: '14px' }}
            >
              <Check size={18} strokeWidth={2.5} />
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
