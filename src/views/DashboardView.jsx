import React from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Package,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getCategoryInfo } from '../types';
import { shareInventoryReportToWhatsApp } from '../utils/whatsapp';
import { WhatsAppIcon } from '../components/WhatsAppShareButton';

export default function DashboardView({ onOpenAddProduct }) {
  const { products, transactions, operator, setCurrentTab, navigateToReceiveWithProduct, navigateToDeliverWithProduct } = useApp();

  const totalProductsCount = products.length;
  const totalStockQuantity = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  const todayStr = new Date().toISOString().slice(0, 10);

  const receivedToday = transactions
    .filter((t) => t.type === 'RECEIVED' && t.timestamp.slice(0, 10) === todayStr)
    .reduce((acc, t) => acc + (t.quantity || 0), 0);

  const deliveredToday = transactions
    .filter((t) => t.type === 'DELIVERED' && t.timestamp.slice(0, 10) === todayStr)
    .reduce((acc, t) => acc + (t.quantity || 0), 0);

  const recentActivities = transactions.slice(0, 5);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  const operatorFirstName = operator.split(' ')[0] || 'Storekeeper';

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Friendly Welcome Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }} className="font-heading">
            Hello, {operatorFirstName} 👋
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {formattedDate} • Stock is up to date
          </p>
        </div>

        <button
          onClick={onOpenAddProduct}
          className="badge"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--primary)',
            padding: '6px 12px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Sparkles size={13} color="var(--primary)" /> + New Item
        </button>
      </div>

      {/* Hero Stock Overview Card */}
      <div className="hero-card">
        <div className="hero-greeting">
          <span>Current Physical Inventory</span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: '12px' }}>
            {totalProductsCount} {totalProductsCount === 1 ? 'Product' : 'Products'}
          </span>
        </div>

        <div className="hero-main-stat">
          <div className="hero-label">Total Units on Hand</div>
          <div className="hero-number">
            {totalStockQuantity.toLocaleString()}
            <span className="hero-unit">total units</span>
          </div>
        </div>

        {/* Today's Inbound & Outbound Pills */}
        <div className="hero-pill-grid">
          <div className="hero-pill-col">
            <div className="hero-pill-label">
              <TrendingUp size={13} color="#6ee7b7" />
              <span>Received Today</span>
            </div>
            <div className="hero-pill-val" style={{ color: '#6ee7b7' }}>
              +{receivedToday.toLocaleString()}
            </div>
          </div>

          <div className="hero-pill-col" style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.15)', paddingLeft: '12px' }}>
            <div className="hero-pill-label">
              <TrendingDown size={13} color="#93c5fd" />
              <span>Delivered Today</span>
            </div>
            <div className="hero-pill-val" style={{ color: '#93c5fd' }}>
              -{deliveredToday.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 1-Tap Share Stock Report via WhatsApp */}
        <button
          type="button"
          onClick={() => shareInventoryReportToWhatsApp(products, { operator })}
          style={{
            marginTop: '14px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.16)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '12px',
            padding: '9px 14px',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'background 0.15s ease'
          }}
          title="Share complete inventory stock report on WhatsApp"
        >
          <WhatsAppIcon size={17} color="#4ade80" />
          <span>Share Stock Report on WhatsApp</span>
        </button>
      </div>

      {/* Big Tactile Quick Action Cards */}
      <div className="big-action-grid">
        <button
          className="big-action-card receive"
          onClick={() => setCurrentTab('receive')}
        >
          <div className="big-action-icon green">
            <ArrowDownToLine size={24} strokeWidth={2.4} />
          </div>
          <div className="big-action-title">
            <span>Receive</span>
            <ChevronRight size={16} opacity={0.6} />
          </div>
          <span className="big-action-subtitle">Add arriving stock</span>
        </button>

        <button
          className="big-action-card deliver"
          onClick={() => setCurrentTab('deliver')}
        >
          <div className="big-action-icon blue">
            <ArrowUpFromLine size={24} strokeWidth={2.4} />
          </div>
          <div className="big-action-title">
            <span>Deliver</span>
            <ChevronRight size={16} opacity={0.6} />
          </div>
          <span className="big-action-subtitle">Dispatch outbound</span>
        </button>
      </div>

      {/* Quick Category Snapshot */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Quick Inventory View
          </h3>
          <button
            onClick={() => setCurrentTab('stock')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            All Items <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {products.slice(0, 5).map((p) => {
            const cat = getCategoryInfo(p.category);
            return (
              <div
                key={p.id}
                onClick={() => setCurrentTab('stock')}
                style={{
                  minWidth: '135px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.25rem' }}>{cat.emoji}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>{p.unit}</span>
                </div>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={p.name}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: p.stock === 0 ? 'var(--accent-rose)' : 'var(--text-main)' }}>
                  {p.stock}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="var(--primary)" />
            <h3 className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Recent Activity
            </h3>
          </div>
          <button
            onClick={() => setCurrentTab('history')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            History <ChevronRight size={14} />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <Package size={36} color="var(--text-dim)" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>No stock movements yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
              Tap "Receive" above to record your first batch of stock.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentActivities.map((tx) => {
              const isReceive = tx.type === 'RECEIVED';
              const isDeliver = tx.type === 'DELIVERED';

              return (
                <div
                  key={tx.id}
                  className="card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    borderRadius: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: isReceive ? 'var(--receive-green-light)' : 'var(--deliver-blue-light)',
                        color: isReceive ? 'var(--receive-green)' : 'var(--deliver-blue)'
                      }}
                    >
                      {isReceive ? <ArrowDownToLine size={18} strokeWidth={2.4} /> : <ArrowUpFromLine size={18} strokeWidth={2.4} />}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {tx.productName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {tx.party || tx.refNumber || tx.operator}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: isReceive ? 'var(--receive-green)' : 'var(--deliver-blue)'
                      }}
                    >
                      {isReceive ? '+' : '-'}{tx.quantity} {tx.unit}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                      Bal: {tx.newBalance}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
