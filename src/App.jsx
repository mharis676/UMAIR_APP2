import React, { useState } from 'react';
import { loadLedger, recordBatch, cancelBatch, groupMovements, matchesDate, productSummary, availableStockText } from './ledger.js';
import BatchForm from './components/BatchForm';
import BatchRecord from './components/BatchRecord';
import SelectPicker from './components/SelectPicker';
import { Package, ArrowDownLeft, ArrowUpRight, History, Search, SlidersHorizontal, CalendarDays, Boxes, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { WhatsAppIcon } from './components/WhatsAppShareButton';
import DateRangeCalendar from './components/DateRangeCalendar';
import DailySummary from './components/DailySummary';
import './App.css';

export default function App() {
  const [ledger, setLedger] = useState(loadLedger);
  const [tab, setTab] = useState('STOCK');
  const [productId, setProductId] = useState('');

  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [detailId, setDetailId] = useState(null);
  const [availability, setAvailability] = useState('all');
  const [stockSearch, setStockSearch] = useState('');
  const [movementType, setMovementType] = useState('all');
  const [recordStatus, setRecordStatus] = useState('all');
  const visibleProducts = ledger.products.filter(p =>
    `${p.name} ${p.code || ''}`.toLowerCase().includes(stockSearch.toLowerCase()) &&
    (availability === 'all' || (availability === 'available' ? p.stock > 0 : p.stock === 0))
  ).sort((a, b) => a.name.localeCompare(b.name));
  const stockByUnit = Object.entries(ledger.products.reduce((totals, p) => {
    totals[p.unit] = (totals[p.unit] || 0) + p.stock;
    return totals;
  }, {}));
  const detail = ledger.products.find(p => p.id === detailId);
  const summary = detail ? productSummary(ledger, detail.id) : null;
  const filteredTransactions = groupMovements(ledger.transactions).filter(group =>
    (!detail || group.items.some(t => t.productId === detail.id)) &&
    (movementType === 'all' || (movementType === 'corrections' ? !['RECEIVED', 'DELIVERED'].includes(group.type) : group.type === movementType)) &&
    (recordStatus === 'all' || (recordStatus === 'cancelled' ? group.reversed : !group.reversed)) &&
    (detail || `${group.items.map(t => t.productName).join(' ')} ${group.id}`.toLowerCase().includes(search.toLowerCase())) && matchesDate(group.timestamp, period, from, to));
  const receiving = tab === 'RECEIVED';
  function save(entry) {
    const next = recordBatch(loadLedger(), entry);
    localStorage.setItem('stocktrack_ledger_v2', JSON.stringify(next));
    setLedger(next);
    setMessage(`${receiving ? 'Receipt' : 'Delivery'} saved with ${entry.items.length} ${entry.items.length === 1 ? 'item' : 'items'}.`);
  }
  function switchTab(next) { setTab(next); setMessage(''); setDetailId(null); setProductId(''); }
  function openDetail(id) { setDetailId(id); setMessage(''); setPeriod('all'); setMovementType('all'); setRecordStatus('all'); window.scrollTo({ top: 0 }); }
  function detailAction(type) { const id = detail.id; switchTab(type); setProductId(id); }
  function cancel(groupId, reason) {
    const next = cancelBatch(loadLedger(), groupId, reason);
    localStorage.setItem('stocktrack_ledger_v2', JSON.stringify(next));
    setLedger(next);
    setMessage('Entry cancelled. Stock adjusted and original records kept.');
  }
  return <div className="stock-app">
    <header><div className="brand-mark"><Package size={25} /></div><div><h1>StockTrack<span className="brand-dot">.</span></h1><p>Your stock, in one place.</p></div><span className="offline-badge"><i />Offline ready</span></header>
    <nav aria-label="Main navigation">{['STOCK', 'RECEIVED', 'DELIVERED', 'RECORDS'].map(t => { const Icon = t === 'STOCK' ? Package : t === 'RECEIVED' ? ArrowDownLeft : t === 'DELIVERED' ? ArrowUpRight : History; return <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => switchTab(t)}><Icon size={19} />{t === 'STOCK' ? 'Stock' : t === 'RECEIVED' ? 'Receive' : t === 'DELIVERED' ? 'Deliver' : 'Records'}</button>; })}</nav>
    <main>
      {message && <div className="notice" role="status">{message}</div>}
      {['RECEIVED', 'DELIVERED'].includes(tab) ? <section className="panel">
        <h2>{receiving ? 'Receive stock' : 'Deliver stock'}</h2>
        <p className="muted">{receiving ? 'Record the products and quantities received.' : 'Record the products and quantities sent out.'}</p>
        <BatchForm key={`${tab}-${productId}`} type={tab} products={ledger.products} initialProductId={productId} onSave={save} />
      </section> : <>
        {detail ? <section className="panel stock-detail" aria-labelledby="detail-title">
          <button className="back-button" onClick={() => { setDetailId(null); }}>← All stock</button>
          <div className="detail-heading"><div><p className="eyebrow">STOCK DETAILS</p><h2 id="detail-title">{detail.name}</h2></div><span className={`status-badge ${detail.stock === 0 ? 'empty-stock' : ''}`}>{detail.stock === 0 ? 'Out of stock' : 'In stock'}</span></div>
          {(detail.code || detail.category) && <p className="muted">{[detail.code, detail.category].filter(Boolean).join(' · ')}</p>}
          <div className="stock-balance"><span>Available now</span><strong>{detail.stock.toLocaleString()} <small>{detail.unit}</small></strong></div>
          <div className="stock-totals"><div><span>Total received</span><strong className="incoming">+{summary.received.toLocaleString()}</strong></div><div><span>Total delivered</span><strong className="outgoing">−{summary.delivered.toLocaleString()}</strong></div></div>
          <p className="muted">All-time totals in {detail.unit}. Cancelled entries are excluded.</p>
          <dl className="stock-meta"><div><dt>History entries</dt><dd>{summary.count}</dd></div><div><dt>Last movement</dt><dd>{summary.latest ? new Date(summary.latest.timestamp).toLocaleString() : 'No movements recorded'}</dd></div><div><dt>Unit</dt><dd>{detail.unit}</dd></div></dl>
          <div className="detail-actions"><button className="primary" onClick={() => detailAction('RECEIVED')}>Receive stock</button><button disabled={detail.stock === 0} onClick={() => detailAction('DELIVERED')}>Deliver stock</button></div>
        </section> : tab === 'STOCK' && <>
          <section className="panel inventory-panel">
            <div className="inventory-header">
              <span className="eyebrow overview-eyebrow">
                <Boxes size={13} strokeWidth={2.5} /> INVENTORY OVERVIEW
              </span>
              <h2>Available stock</h2>
              <p className="muted">Your current stock across all products.</p>
            </div>

            <div className="inventory-counts">
              <div className="inventory-stat-card total-products-card">
                <div className="stat-icon-pill">
                  <Package size={16} />
                </div>
                <strong>{ledger.products.length}</strong>
                <span>Total products</span>
              </div>
              <div className="inventory-stat-card in-stock-card">
                <div className="stat-icon-pill">
                  <CheckCircle2 size={16} />
                </div>
                <strong className="val-in-stock">{ledger.products.filter(p => p.stock > 0).length}</strong>
                <span>In stock</span>
              </div>
              <div className={`inventory-stat-card out-of-stock-card ${ledger.products.filter(p => p.stock === 0).length > 0 ? 'has-out-stock' : 'zero-out-stock'}`}>
                <div className="stat-icon-pill">
                  <AlertTriangle size={16} />
                </div>
                <strong className={ledger.products.filter(p => p.stock === 0).length > 0 ? 'val-out-stock' : ''}>
                  {ledger.products.filter(p => p.stock === 0).length}
                </strong>
                <span>Out of stock</span>
              </div>
            </div>

            <div className="unit-section">
              <div className="unit-heading-row">
                <div className="unit-title-group">
                  <span className="unit-section-icon"><Layers size={16} /></span>
                  <h3>Total available quantities</h3>
                </div>
                <p className="muted">Grouped by unit so boxes, pieces, and other units stay separate.</p>
              </div>

              <div className="unit-totals">
                {stockByUnit.map(([unitName, total]) => (
                  <div key={unitName} className={`unit-card ${total === 0 ? 'unit-card-zero' : 'unit-card-active'}`}>
                    <div className="unit-card-body">
                      <strong className="unit-number">{total.toLocaleString()}</strong>
                      <span className="unit-badge">{unitName}</span>
                    </div>
                  </div>
                ))}
              </div>
              {!stockByUnit.length && <p className="muted">Totals will appear after your first receipt.</p>}
            </div>

            {ledger.products.some(p => p.stock > 0) && (
              <a
                className="share-link stock-share whatsapp-stock-cta"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(availableStockText(ledger.products))}`}
              >
                <WhatsAppIcon size={19} color="#ffffff" />
                <span>Share all available stock on WhatsApp</span>
              </a>
            )}
          </section>
          <section className="panel"><h2>Stock list</h2><p className="muted">Tap a product to see its details and history.</p>
            <input aria-label="Search available stock" placeholder="Search product or code…" value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
            <SelectPicker label="Show products" value={availability} onChange={setAvailability} options={[{ value: 'all', label: 'All products' }, { value: 'available', label: 'In stock only' }, { value: 'empty', label: 'Out of stock only' }]} />
            <p className="muted">Showing {visibleProducts.length} of {ledger.products.length} products</p>
            {visibleProducts.map(p => <button className="stock-card" key={p.id} onClick={() => openDetail(p.id)}><span className="stock-card-name"><strong>{p.name}</strong><small>{p.stock === 0 ? 'Out of stock' : 'View stock details'} →</small></span><span className="stock-card-quantity">{p.stock.toLocaleString()}<small>{p.unit}</small></span></button>)}
            {!ledger.products.length ? <><p className="muted">No stock yet. Start by receiving stock.</p><button className="primary" onClick={() => switchTab('RECEIVED')}>Receive your first stock</button></> : !visibleProducts.length && <p className="muted">No products match these filters.</p>}
          </section>
        </>}
        {tab === 'RECORDS' && !detail && <DailySummary ledger={ledger} />}
        {(tab === 'RECORDS' || detail) && <section className="panel records-panel"><p className="eyebrow">YOUR ACTIVITY</p><div className="records-heading"><h2>{detail ? 'Movement history' : 'Stock records'}</h2><span className="result-count">{filteredTransactions.length} entries</span></div>
          <p className="muted">Every receipt, delivery, and correction. All in one timeline.</p>
          {!detail && <div className="search-field"><Search size={18} /><input aria-label="Search movement records" placeholder="Search products or receipt number…" value={search} onChange={e => setSearch(e.target.value)} /></div>}
          <div className="filter-chips" aria-label="Movement type">{[['all', 'All activity'], ['RECEIVED', 'Received'], ['DELIVERED', 'Delivered'], ['corrections', 'Corrections']].map(([value, label]) => <button type="button" key={value} aria-pressed={movementType === value} onClick={() => setMovementType(value)}>{label}</button>)}</div>
          <div className="record-filter-row"><span><CalendarDays size={16} /> Date range</span><div className="status-filter"><SlidersHorizontal size={16} /><SelectPicker compact label="Record status" value={recordStatus} onChange={setRecordStatus} options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Not cancelled' }, { value: 'cancelled', label: 'Cancelled' }]} /></div></div>
          <div className="filter-chips date-chips" aria-label="Movement dates">{[['all', 'All dates'], ['today', 'Today'], ['week', 'This week'], ['custom', 'Custom range']].map(([value, label]) => <button type="button" key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}</div>
          {period === 'custom' && <DateRangeCalendar from={from} to={to} onChange={(start, end) => { setFrom(start); setTo(end); }} />}
          {period === 'custom' && from && to && from > to && <p role="alert">End date must be on or after start date.</p>}
          <p className="filter-note">Local device time · Week starts Monday · Stock balances stay current</p>
          {filteredTransactions.map((t, index) => <React.Fragment key={t.id}>
            {(index === 0 || new Date(t.timestamp).toDateString() !== new Date(filteredTransactions[index - 1].timestamp).toDateString()) && <h3 className="timeline-date">{new Date(t.timestamp).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</h3>}
            <BatchRecord group={t} onCancel={cancel} detailId={detail?.id} /></React.Fragment>)}
          {!filteredTransactions.length && <div className="records-empty"><History size={32} /><h3>{ledger.transactions.length ? 'No matching activity' : 'Your story starts here'}</h3><p className="muted">{ledger.transactions.length ? 'Try a different date, movement type, or search.' : 'Receive or deliver stock to create your first record.'}</p>{!!ledger.transactions.length && <button onClick={() => { setSearch(''); setPeriod('all'); setMovementType('all'); setRecordStatus('all'); }}>Clear filters</button>}</div>}
        </section>}
      </>}
      <p className="device-note">Saved on this device. Works offline. Clearing app data or uninstalling removes records.</p>
    </main>
  </div>;
}
