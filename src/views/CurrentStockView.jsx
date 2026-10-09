import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Edit3, 
  SlidersHorizontal,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORY_OPTIONS } from '../types';
import ProductModal from '../components/ProductModal';

export default function CurrentStockView({ onOpenAddProduct }) {
  const { 
    products, 
    navigateToReceiveWithProduct, 
    navigateToDeliverWithProduct 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC'); // 'NAME_ASC', 'QTY_DESC', 'QTY_ASC', 'UPDATED'
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter & Sort
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
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Title & Add Product Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }} className="font-heading">
            Current Stock
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {filteredProducts.length} items in inventory
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          onClick={onOpenAddProduct}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search
          size={16}
          color="#94a3b8"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          className="input"
          placeholder="Search products by name, code or category..."
          style={{ paddingLeft: '38px', fontSize: '0.88rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Category Pills Slider */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '14px',
          scrollbarWidth: 'none'
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          style={{
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            background: selectedCategory === 'ALL' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
            border: selectedCategory === 'ALL' ? '1px solid #818cf8' : '1px solid var(--border-color)',
            color: selectedCategory === 'ALL' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          All Categories
        </button>
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              background: selectedCategory === cat ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
              border: selectedCategory === cat ? '1px solid #818cf8' : '1px solid var(--border-color)',
              color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '14px', gap: '8px' }}>
        <SlidersHorizontal size={14} color="#94a3b8" />
        <select
          className="select"
          style={{ width: 'auto', padding: '6px 10px', fontSize: '0.78rem' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="NAME_ASC">Name (A-Z)</option>
          <option value="QTY_DESC">Highest Quantity</option>
          <option value="QTY_ASC">Lowest Quantity</option>
          <option value="UPDATED">Recently Active</option>
        </select>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Boxes size={40} color="#475569" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            No products match your search
          </h4>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '16px' }}>
            Try adjusting your search filters or add a new product.
          </p>
          <button className="btn btn-secondary" onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredProducts.map((p) => {
            const isZero = p.stock === 0;

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'linear-gradient(145deg, #121927, #0e1422)'
                }}
              >
                {/* Product Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      className="font-heading"
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        marginBottom: '4px'
                      }}
                    >
                      {p.name}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span className="badge badge-code">{p.code || 'SKU'}</span>
                      <span className="badge badge-category">{p.category}</span>
                    </div>
                  </div>

                  {/* Stock Quantity Display */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading)',
                        color: isZero ? '#ef4444' : '#ffffff',
                        lineHeight: 1.1
                      }}
                    >
                      {p.stock}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isZero ? '#f87171' : 'var(--text-dim)', fontWeight: 500 }}>
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
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '7px 8px', fontSize: '0.78rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.08)' }}
                    onClick={() => navigateToReceiveWithProduct(p.id)}
                  >
                    <ArrowDownToLine size={14} /> Receive
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '7px 8px', fontSize: '0.78rem', color: '#38bdf8', background: 'rgba(2, 132, 199, 0.08)' }}
                    onClick={() => navigateToDeliverWithProduct(p.id)}
                    disabled={isZero}
                  >
                    <ArrowUpFromLine size={14} /> Deliver
                  </button>

                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: '32px', height: '32px' }}
                    onClick={() => handleEditClick(p)}
                    title="Edit Product"
                    aria-label="Edit product details"
                  >
                    <Edit3 size={14} />
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
