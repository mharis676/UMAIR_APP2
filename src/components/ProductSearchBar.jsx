import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Plus, Package } from 'lucide-react';
import { getCategoryInfo } from '../types';

export default function ProductSearchBar({
  products,
  selectedProduct,
  onSelectProduct,
  onOpenCreateProduct,
  placeholder = "Type product name or SKU code...",
  showStockStatus = true
}) {
  const [query, setQuery] = useState(selectedProduct ? selectedProduct.name : '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Keep query in sync when selectedProduct changes externally
  useEffect(() => {
    if (selectedProduct) {
      setQuery(selectedProduct.name);
    } else {
      setQuery('');
    }
  }, [selectedProduct]);

  // Close dropdown when tapping outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Filter products based on query
  const filteredProducts = products.filter((p) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const handleSelect = (product) => {
    onSelectProduct(product);
    setQuery(product.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onSelectProduct(null);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input Bar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={18}
          color="var(--text-dim)"
          style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
        />
        <input
          type="text"
          className="input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            paddingLeft: '42px',
            paddingRight: query ? '38px' : '14px',
            fontSize: '0.92rem',
            height: '48px',
            borderRadius: '12px',
            borderColor: isOpen ? 'var(--primary)' : 'var(--border-color)',
            boxShadow: isOpen ? '0 0 0 3px var(--primary-light)' : 'none'
          }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Selected Product Pill & Available Stock Indicator */}
      {selectedProduct && !isOpen && (
        <div
          style={{
            marginTop: '8px',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '1.25rem' }}>
              {getCategoryInfo(selectedProduct.category).emoji}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedProduct.name}
              </div>
              <span className="badge badge-code" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                {selectedProduct.code || 'SKU'}
              </span>
            </div>
          </div>

          {showStockStatus && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Stock</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: selectedProduct.stock === 0 ? 'var(--accent-rose)' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                {selectedProduct.stock} {selectedProduct.unit}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-suggest Dropdown List */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 60,
            maxHeight: '260px',
            overflowY: 'auto',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {filteredProducts.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Package size={24} color="var(--text-dim)" style={{ margin: '0 auto 6px auto' }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                No product found matching "{query}"
              </p>
              {onOpenCreateProduct && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: '8px' }}
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCreateProduct(query);
                  }}
                >
                  <Plus size={14} /> Create "{query}"
                </button>
              )}
            </div>
          ) : (
            <div>
              <div style={{ padding: '8px 12px 4px 12px', fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Matching Product ({filteredProducts.length})
              </div>
              {filteredProducts.map((p) => {
                const cat = getCategoryInfo(p.category);
                const isSelected = selectedProduct?.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ fontSize: '1.2rem' }}>{cat.emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {p.code || 'No SKU'} • {p.category}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: p.stock === 0 ? 'var(--accent-rose)' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                        {p.stock} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-muted)' }}>{p.unit}</span>
                      </div>
                      {isSelected && (
                        <Check size={14} color="var(--primary)" style={{ marginLeft: 'auto' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
