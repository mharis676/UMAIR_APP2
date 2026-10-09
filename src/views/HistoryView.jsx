import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  RotateCcw, 
  User, 
  FileText, 
  Building2, 
  Edit3,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ReversalModal from '../components/ReversalModal';
import EditTransactionModal from '../components/EditTransactionModal';
import WhatsAppShareButton, { WhatsAppIcon } from '../components/WhatsAppShareButton';
import CustomDropdown from '../components/CustomDropdown';
import { shareToWhatsApp } from '../utils/whatsapp';
import { exportHistoryPDF } from '../utils/pdfExport';

export default function HistoryView() {
  const { transactions, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  
  const [selectedTxForReversal, setSelectedTxForReversal] = useState(null);
  const [isReversalOpen, setIsReversalOpen] = useState(false);
  const [selectedTxForEdit, setSelectedTxForEdit] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState(null);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions.filter((tx) => {
      const searchStr = `${tx.productName} ${tx.refNumber || ''} ${tx.party || ''} ${tx.notes || ''} ${tx.operator || ''}`.toLowerCase();
      const matchSearch = searchStr.includes(searchTerm.toLowerCase());

      let matchType = true;
      if (typeFilter === 'RECEIVED') {
        matchType = tx.type === 'RECEIVED';
      } else if (typeFilter === 'DELIVERED') {
        matchType = tx.type === 'DELIVERED';
      } else if (typeFilter === 'REVERSAL') {
        matchType = tx.type.includes('REVERSAL') || tx.reversed;
      }

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

  const handleExportPDF = () => {
    exportHistoryPDF(filteredTransactions);
    showToast('Transaction report downloaded (PDF)!');
  };

  const handleOpenReversal = (tx, e) => {
    e.stopPropagation();
    setSelectedTxForReversal(tx);
    setIsReversalOpen(true);
  };

  const handleOpenEdit = (tx, e) => {
    e.stopPropagation();
    setSelectedTxForEdit(tx);
    setIsEditOpen(true);
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Title & PDF Export */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }} className="font-heading">
            History & Logs
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Complete audit trail of all transactions
          </p>
        </div>

        <button
          className="btn btn-secondary"
          style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '10px' }}
          onClick={handleExportPDF}
          title="Download transaction records as PDF"
        >
          <FileText size={14} /> Export PDF
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
          placeholder="Search by product, ref #, party or notes..."
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

      {/* Type Filter Tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px', scrollbarWidth: 'none' }}>
        {[
          { id: 'ALL', label: 'All Records' },
          { id: 'RECEIVED', label: 'Received Only' },
          { id: 'DELIVERED', label: 'Delivered Only' },
          { id: 'REVERSAL', label: 'Reversals' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTypeFilter(tab.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              background: typeFilter === tab.id ? 'var(--primary)' : 'var(--bg-card)',
              border: typeFilter === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
              color: typeFilter === tab.id ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '14px', gap: '8px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Timeframe:</span>
        <div style={{ width: '150px' }}>
          <CustomDropdown
            value={dateFilter}
            onChange={(val) => setDateFilter(val)}
            options={[
              { value: 'ALL', label: 'All Time' },
              { value: 'TODAY', label: 'Today' },
              { value: 'WEEK', label: 'Last 7 Days' },
              { value: 'MONTH', label: 'This Month' }
            ]}
          />
        </div>
      </div>

      {/* Transaction Records List */}
      {filteredTransactions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <History size={38} color="var(--text-dim)" style={{ margin: '0 auto 10px auto' }} />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: 700, marginBottom: '4px' }}>
            No records found
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Try clearing search keywords or filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                  borderRadius: '16px',
                  borderLeft: isReceive
                    ? '4px solid var(--receive-green)'
                    : isDeliver
                    ? '4px solid var(--deliver-blue)'
                    : '4px solid var(--accent-rose)',
                  opacity: isReversedOriginal ? 0.75 : 1
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
                      {isReceive && <ArrowDownToLine size={12} strokeWidth={2.5} />}
                      {isDeliver && <ArrowUpFromLine size={12} strokeWidth={2.5} />}
                      {isReversal && <RotateCcw size={12} strokeWidth={2.5} />}
                      {isReceive ? 'Received' : isDeliver ? 'Delivered' : 'Reversal'}
                    </span>

                    {isReversedOriginal && (
                      <span className="badge badge-reversed" style={{ fontSize: '0.65rem' }}>
                        REVERSED
                      </span>
                    )}

                    {tx.edited && (
                      <span className="badge badge-code" style={{ fontSize: '0.65rem' }}>
                        EDITED
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                      {new Date(tx.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareToWhatsApp(tx);
                      }}
                      style={{
                        background: 'rgba(37, 211, 102, 0.12)',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        color: '#16a34a',
                        borderRadius: '6px',
                        padding: '3px 7px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.68rem',
                        fontWeight: 600
                      }}
                      title="Share to WhatsApp"
                    >
                      <WhatsAppIcon size={12} color="#16a34a" /> WhatsApp
                    </button>
                  </div>
                </div>

                {/* Product & Quantity Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <h3
                      className="font-heading"
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: isReversedOriginal ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: isReversedOriginal ? 'line-through' : 'none'
                      }}
                    >
                      {tx.productName}
                    </h3>

                    {/* Party & Reference */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {tx.party && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {isReceive ? (
                            <>
                              <Building2 size={13} color="var(--receive-green)" />
                              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>From:</span> {tx.party}
                            </>
                          ) : (
                            <>
                              <User size={13} color="var(--deliver-blue)" />
                              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Deliver to:</span> {tx.party}
                            </>
                          )}
                        </span>
                      )}
                      {tx.refNumber && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <FileText size={13} /> Ref: {tx.refNumber}
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
                        fontWeight: 800,
                        color: isReceive ? 'var(--receive-green)' : isDeliver ? 'var(--deliver-blue)' : 'var(--accent-rose)'
                      }}
                    >
                      {isReceive ? '+' : isDeliver ? '-' : ''}
                      {tx.quantity} {tx.unit}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      Bal: {tx.prevBalance} ➔ <strong>{tx.newBalance}</strong>
                    </div>
                  </div>
                </div>

                {/* Expandable Details and Reversal Option */}
                {(isExpanded || tx.notes || isReversedOriginal) && (
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px dashed var(--border-color)',
                      fontSize: '0.78rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    {tx.notes && (
                      <div style={{ color: 'var(--text-main)' }}>
                        <strong style={{ color: 'var(--text-muted)' }}>Notes: </strong>
                        {tx.notes}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-dim)', marginTop: '2px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isReceive ? <Building2 size={12} color="var(--receive-green)" /> : <User size={12} color="var(--deliver-blue)" />}
                        <span>{isReceive ? 'Received from: ' : 'Deliver to: '}<strong>{tx.party || 'General'}</strong></span>
                      </span>
                      <span>#{tx.id}</span>
                    </div>

                    {isReversedOriginal && tx.reversalReason && (
                      <div style={{ background: 'var(--accent-rose-light)', border: '1px solid rgba(225, 29, 72, 0.25)', padding: '6px 10px', borderRadius: '8px', marginTop: '4px', color: 'var(--accent-rose)' }}>
                        <strong>Reversal Reason:</strong> {tx.reversalReason}
                      </div>
                    )}

                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <WhatsAppShareButton
                        transaction={tx}
                        label="Share Slip on WhatsApp"
                        variant="solid"
                        style={{ padding: '6px 12px', fontSize: '0.74rem' }}
                      />

                      {!isReversedOriginal && !isReversal && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ 
                              fontSize: '0.74rem', 
                              padding: '6px 12px', 
                              color: 'var(--primary)', 
                              borderColor: 'var(--primary)',
                              background: 'var(--primary-light)'
                            }}
                            onClick={(e) => handleOpenEdit(tx, e)}
                            title="Correct quantity, party or reference mistake"
                          >
                            <Edit3 size={13} /> Edit Entry
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.74rem', padding: '6px 12px', color: 'var(--accent-rose)', borderColor: 'rgba(225, 29, 72, 0.3)' }}
                            onClick={(e) => handleOpenReversal(tx, e)}
                            title="Void or completely reverse this transaction"
                          >
                            <RotateCcw size={13} /> Void / Reverse
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Re-Edit Transaction Modal (For human entry mistakes) */}
      <EditTransactionModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedTxForEdit(null);
        }}
        transaction={selectedTxForEdit}
      />

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
