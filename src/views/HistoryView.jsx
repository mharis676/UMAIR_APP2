import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Building2, 
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storage } from '../storage';
import ReversalModal from '../components/ReversalModal';

export default function HistoryView() {
  const { transactions, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'RECEIVED' | 'DELIVERED' | 'REVERSAL'
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'
  
  // Reversal Modal
  const [selectedTxForReversal, setSelectedTxForReversal] = useState(null);
  const [isReversalOpen, setIsReversalOpen] = useState(false);

  // Detail Modal / expanded card view
  const [expandedTxId, setExpandedTxId] = useState(null);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions.filter((tx) => {
      // Search
      const searchStr = `${tx.productName} ${tx.refNumber || ''} ${tx.party || ''} ${tx.notes || ''} ${tx.operator || ''}`.toLowerCase();
      const matchSearch = searchStr.includes(searchTerm.toLowerCase());

      // Type
      let matchType = true;
      if (typeFilter === 'RECEIVED') {
        matchType = tx.type === 'RECEIVED';
      } else if (typeFilter === 'DELIVERED') {
        matchType = tx.type === 'DELIVERED';
      } else if (typeFilter === 'REVERSAL') {
        matchType = tx.type.includes('REVERSAL') || tx.reversed;
      }

      // Date
      let matchDate = true;
      const txDate = new Date(tx.timestamp);
      if (dateFilter === 'TODAY') {
        matchDate = tx.timestamp.slice(0, 10) === todayStr;
      } else if (dateFilter === 'WEEK') {
        matchDate = txDate >= oneWeekAgo;
      } else if (dateFilter === 'MONTH') {
        matchDate = txDate >= firstDayOfMonth;
      }

      return matchSearch && matchType && matchDate;
    });
  }, [transactions, searchTerm, typeFilter, dateFilter]);

  const handleExportCSV = () => {
    storage.exportHistoryCSV(filteredTransactions);
    showToast('Transaction records exported to CSV!');
  };

  const handleOpenReversal = (tx, e) => {
    e.stopPropagation();
    setSelectedTxForReversal(tx);
    setIsReversalOpen(true);
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Title & CSV Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }} className="font-heading">
            Transaction History
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Complete audit trail of stock received & delivered
          </p>
        </div>

        <button
          className="btn btn-secondary"
          style={{ padding: '8px 12px', fontSize: '0.78rem' }}
          onClick={handleExportCSV}
          title="Export records to CSV"
        >
          <Download size={14} /> Export CSV
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
          placeholder="Search by product, reference #, supplier or notes..."
          style={{ paddingLeft: '38px', fontSize: '0.88rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filters: Type & Date Range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
            Transaction Type
          </label>
          <select
            className="select"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="RECEIVED">Received Only</option>
            <option value="DELIVERED">Delivered Only</option>
            <option value="REVERSAL">Reversals & Corrected</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', display: 'block' }}>
            Date Range
          </label>
          <select
            className="select"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="WEEK">Last 7 Days</option>
            <option value="MONTH">This Month</option>
          </select>
        </div>
      </div>

      {/* Transaction Records List */}
      {filteredTransactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <History size={40} color="#475569" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px' }}>
            No transactions match criteria
          </h4>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            Try clearing filters or search keywords.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredTransactions.map((tx) => {
            const isReceive = tx.type === 'RECEIVED';
            const isDeliver = tx.type === 'DELIVERED';
            const isReversal = tx.type.includes('REVERSAL');
            const isReversedOriginal = tx.reversed;
            const isExpanded = expandedTxId === tx.id;

            return (
              <div
                key={tx.id}
                className="card"
                onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                style={{
                  cursor: 'pointer',
                  borderLeft: isReceive
                    ? '3px solid #10b981'
                    : isDeliver
                    ? '3px solid #0284c7'
                    : '3px solid #ef4444',
                  background: isReversedOriginal ? 'rgba(30, 41, 59, 0.5)' : undefined
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className={`badge ${
                        isReceive
                          ? 'badge-received'
                          : isDeliver
                          ? 'badge-delivered'
                          : 'badge-reversed'
                      }`}
                    >
                      {isReceive && <ArrowDownToLine size={12} />}
                      {isDeliver && <ArrowUpFromLine size={12} />}
                      {isReversal && <RotateCcw size={12} />}
                      {isReceive ? 'Stock Received' : isDeliver ? 'Stock Delivered' : 'Reversal Entry'}
                    </span>

                    {isReversedOriginal && (
                      <span className="badge badge-reversed" style={{ fontSize: '0.65rem' }}>
                        REVERSED
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {new Date(tx.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Product & Quantity Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3
                      className="font-heading"
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: isReversedOriginal ? '#94a3b8' : 'var(--text-main)',
                        textDecoration: isReversedOriginal ? 'line-through' : 'none'
                      }}
                    >
                      {tx.productName}
                    </h3>

                    {/* Supplier / Recipient / Ref */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {tx.party && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Building2 size={12} /> {tx.party}
                        </span>
                      )}
                      {tx.refNumber && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <FileText size={12} /> Ref: {tx.refNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Balance */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: isReceive ? '#34d399' : isDeliver ? '#38bdf8' : '#f87171'
                      }}
                    >
                      {isReceive ? '+' : isDeliver ? '-' : ''}
                      {tx.quantity} {tx.unit}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {tx.prevBalance} &rarr; <strong style={{ color: 'var(--text-main)' }}>{tx.newBalance}</strong> {tx.unit}
                    </div>
                  </div>
                </div>

                {/* Expanded Details or Note */}
                {(isExpanded || tx.notes || isReversedOriginal) && (
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px dashed var(--border-color)',
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      color: '#cbd5e1'
                    }}
                  >
                    {tx.notes && (
                      <div>
                        <strong style={{ color: 'var(--text-muted)' }}>Notes: </strong>
                        {tx.notes}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)' }}>
                      <User size={12} />
                      <span>Recorded by: {tx.operator || 'Storekeeper'}</span>
                      <span>• Tx ID: {tx.id}</span>
                    </div>

                    {/* If reversed original */}
                    {isReversedOriginal && tx.reversalReason && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '6px 8px', borderRadius: '6px', marginTop: '4px', color: '#fca5a5' }}>
                        <strong>Reversal Reason:</strong> {tx.reversalReason}
                      </div>
                    )}

                    {/* Action to reverse this transaction if eligible */}
                    {!isReversedOriginal && !isReversal && (
                      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '5px 10px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          onClick={(e) => handleOpenReversal(tx, e)}
                        >
                          <RotateCcw size={12} /> Correct / Reverse Entry
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Controlled Reversal Modal */}
      <ReversalModal
        isOpen={isReversalOpen}
        onClose={() => {
          setIsReversalOpen(false);
          setSelectedTxForReversal(null);
        }}
        transaction={selectedTxForReversal}
      />
    </div>
  );
}
