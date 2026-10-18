import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, History, Share2, Ban, ChevronDown } from 'lucide-react';
import { batchReceiptText } from '../ledger';

export default function BatchRecord({ group, onCancel, detailId }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const receiving = group.type === 'RECEIVED';
  const delivering = group.type === 'DELIVERED';
  const items = detailId ? group.items.filter(item => item.productId === detailId) : group.items;
  function cancel(e) {
    e.preventDefault();
    try { onCancel(group.id, reason); setCancelling(false); setReason(''); setError(''); }
    catch (err) { setError(err.message); }
  }
  return <article className={`record ${group.reversed ? 'cancelled-record' : ''}`}>
    <div className="record-topline"><span className={`movement-badge ${receiving ? 'received-badge' : delivering ? 'delivered-badge' : 'correction-badge'}`}>{receiving ? <ArrowDownLeft size={14} /> : delivering ? <ArrowUpRight size={14} /> : <History size={14} />}{receiving ? 'Received' : delivering ? 'Delivered' : 'Correction'}</span><time dateTime={group.timestamp}>{new Date(group.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time>{group.reversed && <span className="cancelled-label">Cancelled</span>}</div>
    <div className="stock-row"><strong>{items.length === 1 ? items[0].productName : `${items.length} items`}</strong><span className="receipt-reference">#{group.id.slice(0, 8)}</span></div>
    <p className="record-party">{receiving ? 'Stock added' : delivering ? 'Stock sent out' : 'Stock adjusted'} · {items.length} {items.length === 1 ? 'item' : 'items'}</p>
    <button type="button" className="expand-receipt" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Hide items' : `View ${items.length} ${items.length === 1 ? 'item' : 'items'}`}<ChevronDown size={16} /></button>
    {expanded && <div className="receipt-lines">{items.map(item => <div className="receipt-line" key={item.id}><div className="stock-row"><strong>{item.productName}</strong><span className={receiving ? 'incoming' : delivering ? 'outgoing' : ''}>{receiving ? '+' : delivering ? '−' : ''}{item.quantity} {item.unit}</span></div><div className="record-balances"><span>Balance when saved</span><strong>{item.prevBalance} → {item.newBalance} {item.unit}</strong></div>{item.reversed && <p className="record-note">Cancelled: {item.reversalReason || 'See correction record'}</p>}</div>)}</div>}
    {group.recordedAt && new Date(group.recordedAt).toDateString() !== new Date(group.timestamp).toDateString() && <p className="filter-note">Entered later: {new Date(group.recordedAt).toLocaleString()}</p>}
    {detailId && group.items.length > items.length && <p className="filter-note">Part of a {group.items.length}-item receipt. Sharing and cancellation apply to the complete receipt.</p>}
    {group.notes && <p className="record-note">{group.notes}</p>}
    <div className="record-actions"><a className="share-link" href={`https://wa.me/?text=${encodeURIComponent(batchReceiptText(group))}`} target="_blank" rel="noopener noreferrer"><Share2 size={15} />WhatsApp receipt</a>{!group.reversed && (receiving || delivering) && <button className="cancel-entry" type="button" onClick={() => { setCancelling(true); setError(''); }}><Ban size={15} />Cancel {receiving ? 'receipt' : 'delivery'}</button>}</div>
    {cancelling && <form className="cancel-form" onSubmit={cancel}><p>This cancels the complete {group.items.length}-item {receiving ? 'receipt' : 'delivery'}, {receiving ? 'removing' : 'returning'} its stock. Original records stay visible.</p><label>Cancellation reason<textarea autoFocus required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} /></label>{error && <p role="alert">{error}</p>}<div className="record-actions"><button type="submit">Confirm cancellation</button><button type="button" onClick={() => setCancelling(false)}>Keep entry</button></div></form>}
  </article>;
}
