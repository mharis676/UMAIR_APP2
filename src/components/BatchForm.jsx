import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { UNIT_OPTIONS } from '../types';
import SelectPicker from './SelectPicker';
import DateRangeCalendar from './DateRangeCalendar';
import { localDateKey } from '../ledger';

const newItem = (productId = '') => ({ key: crypto.randomUUID(), productId, name: '', unit: 'pieces', quantity: '' });

export default function BatchForm({ type, products, initialProductId, onSave }) {
  const receiving = type === 'RECEIVED';
  const [items, setItems] = useState(() => [newItem(initialProductId)]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [entryDate, setEntryDate] = useState(() => localDateKey());
  const [calendarOpen, setCalendarOpen] = useState(false);
  function update(key, field, value) { setItems(rows => rows.map(row => row.key === key ? { ...row, [field]: value } : row)); }
  function save(e) {
    e.preventDefault();
    try {
      onSave({ type, items, notes, entryDate });
      setItems([newItem()]); setNotes(''); setError(''); setEntryDate(localDateKey()); setCalendarOpen(false);
    } catch (err) { setError(err.message); }
  }
  return <form onSubmit={save}>
    <button className="entry-date" type="button" aria-expanded={calendarOpen} onClick={() => setCalendarOpen(value => !value)}>Entry date <strong>{new Date(`${entryDate}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong><span>Change</span></button>
    {calendarOpen && <DateRangeCalendar single from={entryDate} to={entryDate} max={localDateKey()} onChange={date => { setEntryDate(date); setCalendarOpen(false); }} />}
    <p className="filter-note">Choose the day stock moved. Saving also records the actual entry time.</p>
    <p className="muted">Add all items for this {receiving ? 'receipt' : 'delivery'}. They will be saved together.</p>
    {items.map((item, index) => {
      const product = products.find(p => p.id === item.productId);
      const earlierQuantity = items.slice(0, index).filter(row => row.productId && row.productId === item.productId).reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
      const available = product ? product.stock - (receiving ? 0 : earlierQuantity) : 0;
      return <fieldset className="batch-item" key={item.key}><legend>Item {index + 1}</legend>
        {items.length > 1 && <button className="remove-item" type="button" aria-label={`Remove item ${index + 1}`} onClick={() => setItems(rows => rows.filter(row => row.key !== item.key))}><Trash2 size={16} />Remove</button>}
        <SelectPicker label="Product" searchable value={item.productId} onChange={value => update(item.key, 'productId', value)} placeholder="Select a product" options={[...(receiving ? [{ value: '', label: 'New product', description: 'Add a product to your stock' }] : []), ...products.map(p => ({ value: p.id, label: p.name, description: `${p.stock} ${p.unit} available` }))]} />
        {receiving && !item.productId && <div className="field-row"><label>Product name<input required maxLength={120} value={item.name} onChange={e => update(item.key, 'name', e.target.value)} placeholder="e.g. Water bottles" /></label><SelectPicker label="Unit" value={item.unit} onChange={value => update(item.key, 'unit', value)} options={UNIT_OPTIONS.map(unit => ({ value: unit, label: unit }))} /></div>}
        <label>Quantity {product ? `(${product.unit})` : ''}<input required type="number" inputMode="numeric" min="1" step="1" max={!receiving && product ? Math.max(0, available) : undefined} value={item.quantity} onChange={e => update(item.key, 'quantity', e.target.value)} placeholder="0" /></label>
        {product && <p className="muted">{receiving ? `Current stock: ${product.stock}` : `Available for this line: ${Math.max(0, available)}`} {product.unit}</p>}
      </fieldset>;
    })}
    <button className="add-item" type="button" onClick={() => setItems(rows => [...rows, newItem()])}><Plus size={18} />Add item</button>
    <label>Notes <span className="muted">(optional)</span><textarea rows="2" maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary" type="submit">Save {receiving ? 'receipt' : 'delivery'} · {items.length} {items.length === 1 ? 'item' : 'items'}</button>
  </form>;
}
