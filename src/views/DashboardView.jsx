import React from 'react';
import { 
  Package, 
  Boxes, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Plus, 
  Clock, 
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DashboardView({ onOpenAddProduct }) {
  const { products, transactions, setCurrentTab } = useApp();

  // 1. Total number of different products
  const totalProductsCount = products.length;

  // 2. Total quantity currently in stock across all products
  const totalStockQuantity = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  // Today's date string in local format YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  // 3. Total quantity received today
  const receivedToday = transactions
    .filter((t) => t.type === 'RECEIVED' && t.timestamp.slice(0, 10) === todayStr)
    .reduce((acc, t) => acc + (t.quantity || 0), 0);

  // 4. Total quantity delivered today
  const deliveredToday = transactions
    .filter((t) => t.type === 'DELIVERED' && t.timestamp.slice(0, 10) === todayStr)
    .reduce((acc, t) => acc + (t.quantity || 0), 0);

  // Recent 5 activities
  const recentActivities = transactions.slice(0, 6);

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top Welcome & Subtitle */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }} className="font-heading">
          Stock Overview
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Real-time physical quantity tracking & stock movement
        </p>
      </div>

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        {/* Total Products */}
        <div className="kpi-card indigo">
          <div className="kpi-label">
            <span>Products</span>
            <Package size={14} color="#818cf8" />
          </div>
          <div className="kpi-value">{totalProductsCount}</div>
          <div className="kpi-subtext">Catalogued items</div>
        </div>

        {/* Total Stock in Hand */}
        <div className="kpi-card emerald">
          <div className="kpi-label">
            <span>Total Units</span>
            <Boxes size={14} color="#34d399" />
          </div>
          <div className="kpi-value">{totalStockQuantity.toLocaleString()}</div>
          <div className="kpi-subtext">Currently in stock</div>
        </div>

        {/* Received Today */}
        <div className="kpi-card cyan">
          <div className="kpi-label">
            <span>Recv. Today</span>
            <ArrowDownToLine size={14} color="#38bdf8" />
          </div>
          <div className="kpi-value" style={{ color: '#38bdf8' }}>
            +{receivedToday.toLocaleString()}
          </div>
          <div className="kpi-subtext">Units taken in</div>
        </div>

        {/* Delivered Today */}
        <div className="kpi-card amber">
          <div className="kpi-label">
            <span>Deliv. Today</span>
            <ArrowUpFromLine size={14} color="#fbbf24" />
          </div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>
            -{deliveredToday.toLocaleString()}
          </div>
          <div className="kpi-subtext">Units dispatched</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="quick-action-grid">
        <button
          className="action-btn-large receive"
          onClick={() => setCurrentTab('receive')}
        >
          <div className="action-icon-circle green">
            <ArrowDownToLine size={22} />
          </div>
          <div>
            <span className="action-text-title" style={{ color: '#34d399' }}>Receive Stock</span>
            <span className="action-text-desc">Inbound restock</span>
          </div>
        </button>

        <button
          className="action-btn-large deliver"
          onClick={() => setCurrentTab('deliver')}
        >
          <div className="action-icon-circle cyan">
            <ArrowUpFromLine size={22} />
          </div>
          <div>
            <span className="action-text-title" style={{ color: '#38bdf8' }}>Deliver Stock</span>
            <span className="action-text-desc">Outbound dispatch</span>
          </div>
        </button>
      </div>

      {/* Recent Activity Section */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} color="#818cf8" />
          <h3 className="font-heading" style={{ fontSize: '1rem', fontWeight: 600 }}>
            Recent Activity
          </h3>
        </div>
        <button
          onClick={() => setCurrentTab('history')}
          style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      {recentActivities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <Boxes size={36} color="#475569" style={{ margin: '0 auto 10px auto' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No stock activities recorded yet.</p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '4px' }}>
            Receive or deliver stock to see transactions here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentActivities.map((tx) => {
            const isReceive = tx.type === 'RECEIVED';
            const isDeliver = tx.type === 'DELIVERED';
            const isReversal = tx.type.includes('REVERSAL') || tx.reversed;

            return (
              <div
                key={tx.id}
                className="card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
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
                      background: isReceive
                        ? 'rgba(16, 185, 129, 0.15)'
                        : isDeliver
                        ? 'rgba(2, 132, 199, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                      color: isReceive ? '#34d399' : isDeliver ? '#38bdf8' : '#f87171'
                    }}
                  >
                    {isReceive && <ArrowDownToLine size={18} />}
                    {isDeliver && <ArrowUpFromLine size={18} />}
                    {!isReceive && !isDeliver && <TrendingUp size={18} />}
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
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{tx.party || tx.operator || 'Stock Log'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: isReceive ? '#34d399' : isDeliver ? '#38bdf8' : '#f87171'
                    }}
                  >
                    {isReceive ? '+' : isDeliver ? '-' : ''}
                    {tx.quantity} {tx.unit}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Bal: {tx.newBalance}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
