import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X, Package, Plus } from 'lucide-react';

export default function SelectPicker({ label, value, options, onChange, searchable = false, placeholder = 'Select an option', compact = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dialog = useRef(null);
  const trigger = useRef(null);
  const id = useId();
  const selected = options.find(option => option.value === value);
  const filtered = options.filter(option => `${option.label} ${option.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!open) return;
    dialog.current.showModal();
    const triggerElement = trigger.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; triggerElement?.focus(); };
  }, [open]);
  function close() { setOpen(false); setQuery(''); }
  return <div className={`select-picker ${compact ? 'compact-picker' : ''}`}>
    {!compact && <span className="picker-label" id={`${id}-label`}>{label}</span>}
    <button ref={trigger} type="button" className="picker-trigger" aria-label={`${label}: ${selected?.label || placeholder}`} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <span className="picker-value"><strong>{selected?.label || placeholder}</strong>{selected?.description && <small>{selected.description}</small>}</span><ChevronDown size={17} />
    </button>
    {open && createPortal(<dialog className="picker-dialog" ref={dialog} aria-labelledby={`${id}-title`} onCancel={close} onClick={e => { if (e.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) close(); } }}>
      <div className="picker-handle" />
      <div className="picker-heading"><div><span>CHOOSE AN OPTION</span><h2 id={`${id}-title`}>{label}</h2></div><button type="button" aria-label="Close selection" onClick={close}><X size={20} /></button></div>
      {searchable && <div className="picker-search"><Search size={18} /><input autoFocus aria-label={`Search ${label.toLowerCase()}`} placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)} /></div>}
      <div className="picker-options">{filtered.map(option => <button key={option.value} type="button" className={`picker-option ${option.value === value ? 'is-selected' : ''}`} aria-pressed={option.value === value} onClick={() => { onChange(option.value); close(); }}>
        {searchable && <span className="picker-option-icon">{option.value === '' ? <Plus size={18} /> : <Package size={18} />}</span>}
        <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span><span className="picker-check">{option.value === value && <Check size={16} />}</span>
      </button>)}{!filtered.length && <p className="picker-empty">No matching products. Try another search.</p>}</div>
      <div className="picker-footer">{filtered.length} {filtered.length === 1 ? 'option' : 'options'} · Tap to select</div>
    </dialog>, document.body)}
  </div>;
}
