import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Edit3, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES_META, getCategoryInfo } from '../types';
import ProductModal from '../components/ProductModal';

export default function CurrentStockView({ onOpenAddProduct }) {
  const { 
    products, 
    navigateToReceiveWithProduct, 
    navigateToDeliverWithProduct 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC');
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;

      return matchSearch && matchCategory;
    }).sort((a, b) => {
      if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
      if (sortBy === 'QTY_DESC') return (b.stock || 0) - (a.stock || 0);
      if (sortBy === 'QTY_ASC') return (a.stock || 0) - (b.stock || 0);
      if (sortBy === 'UPDATED') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      return 0;
    });
  }, [products, searchTerm, selectedCategory, sortBy]);

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }} className="font-heading">
            Current Stock
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filteredProducts.length} items in inventory
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '10px' }}
          onClick={onOpenAddProduct}
        >
          <Plus size={16} strokeWidth={2.5} /> Add Product
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search
          size={16}
          color="var(--text-dim)"
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          className="input"
          placeholder="Search by name, SKU or category..."
          style={{ paddingLeft: '40px', paddingRight: searchTerm ? '38px' : '14px', fontSize: '0.9rem', borderRadius: '12px' }}
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

      {/* Category Pills Slider */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '12px',
          scrollbarWidth: 'none'
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            background: selectedCategory === 'ALL' ? 'var(--primary)' : 'var(--bg-card)',
            border: selectedCategory === 'ALL' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            color: selectedCategory === 'ALL' ? '#ffffff' : 'var(--text-muted)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease'
          }}
        >
          📦 All Items ({products.length})
        </button>

        {CATEGORIES_META.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
            >
              {cat.emoji} {cat.name}
            </button>
          );
        })}
      </div>

      {/* Sort Options */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '14px', gap: '8px' }}>
        <SlidersHorizontal size={14} color="var(--text-dim)" />
        <select
          className="select"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="NAME_ASC">Name (A-Z)</option>
          <option value="QTY_DESC">Highest Stock First</option>
          <option value="QTY_ASC">Lowest Stock First</option>
          <option value="UPDATED">Recently Active</option>
        </select>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <Boxes size={38} color="var(--text-dim)" style={{ margin: '0 auto 10px auto' }} />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '4px' }}>
            No products match
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
            Try clearing search keywords or category filters.
          </p>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredProducts.map((p) => {
            const isZero = p.stock === 0;
            const cat = getCategoryInfo(p.category);

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderRadius: '16px'
                }}
              >
                {/* Product Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="category-avatar"
                    style={{ background: cat.bg }}
                  >
                    {cat.emoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      className="font-heading"
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {p.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className="badge badge-code">{p.code || 'SKU'}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {p.category}
                      </span>
                    </div>
                  </div>

                  {/* Stock Quantity */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-heading)',
                        color: isZero ? 'var(--accent-rose)' : 'var(--text-main)',
                        lineHeight: 1
                      }}
                    >
                      {p.stock}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isZero ? 'var(--accent-rose)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {p.unit}
                    </div>
                  </div>
                </div>

                {/* Card Quick Actions: Receive, Deliver, Edit */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                      color: 'var(--receive-green)',
                      background: 'var(--receive-green-light)',
                      border: '1px solid var(--receive-green-border)'
                    }}
                    onClick={() => navigateToReceiveWithProduct(p.id)}
                  >
                    <ArrowDownToLine size={15} strokeWidth={2.4} /> Receive
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      fontSize: '0.78rem',
                      color: 'var(--deliver-blue)',
                      background: 'var(--deliver-blue-light)',
                      border: '1px solid var(--deliver-blue-border)'
                    }}
                    onClick={() => navigateToDeliverWithProduct(p.id)}
                    disabled={isZero}
                  >
                    <ArrowUpFromLine size={15} strokeWidth={2.4} /> Deliver
                  </button>

                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: '36px', height: '36px' }}
                    onClick={() => handleEditClick(p)}
                    title="Edit Product Details"
                    aria-label="Edit product details"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Product Modal */}
      <ProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editingProduct={editingProduct}
      />
    </div>
  );
}
