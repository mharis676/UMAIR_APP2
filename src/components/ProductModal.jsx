import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UNIT_OPTIONS, CATEGORY_OPTIONS } from '../types';

export default function ProductModal({ isOpen, onClose, editingProduct = null, onCreatedCallback = null }) {
  const { addProduct, updateProduct } = useApp();

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
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
            {error}
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
                <Sparkles size={16} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>Category</span>
              <span className="optional">Optional</span>
            </label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Other">Other (Custom Category)</option>
            </select>
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
            <select
              className="select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value="custom">Custom unit...</option>
            </select>
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
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Stock can also be added anytime using the "Receive Stock" screen.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              <Check size={18} />
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
