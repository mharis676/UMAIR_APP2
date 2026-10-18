import React, { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function DateRangeCalendar({ from, to, onChange, single = false, max }) {
  const [month, setMonth] = useState(() => {
    const date = from ? new Date(`${from}T12:00:00`) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [endpoint, setEndpoint] = useState('from');
  const offset = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const [today] = useState(() => dateKey(new Date()));
  function choose(key) {
    if (single) { onChange(key, key); return; }
    if (endpoint === 'from') {
      onChange(key, to && to >= key ? to : '');
      setEndpoint('to');
    } else if (from && key < from) {
      onChange(key, from);
      setEndpoint('from');
    } else {
      onChange(from || key, key);
      setEndpoint('from');
    }
  }
  return <div className="range-calendar">
    {!single && <div className="range-endpoints">
      {['from', 'to'].map(part => <button type="button" key={part} aria-pressed={endpoint === part} onClick={() => setEndpoint(part)}><span>{part === 'from' ? 'Start date' : 'End date'}</span><strong>{(part === 'from' ? from : to) ? new Date(`${part === 'from' ? from : to}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Choose date'}</strong></button>)}
    </div>}
    <div className="calendar-heading"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><strong aria-live="polite"><CalendarDays size={16} />{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div>
    <div className="calendar-grid">
      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => <span className="weekday" key={day}>{day}</span>)}
      {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
      {Array.from({ length: count }, (_, i) => {
        const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
        const key = dateKey(date);
        const selected = key === from || key === to;
        return <button type="button" disabled={!!max && key > max} key={key} className={`${selected ? 'selected-day' : ''} ${from && to && key > from && key < to ? 'in-range' : ''} ${key === today ? 'today' : ''}`} aria-label={date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} aria-pressed={selected} aria-current={key === today ? 'date' : undefined} onClick={() => choose(key)}>{i + 1}</button>;
      })}
    </div>
    <div className="calendar-footer"><span>{single ? 'Select a date' : `Select ${endpoint === 'from' ? 'a start' : 'an end'} date · dates are inclusive`}</span><button type="button" onClick={() => { const date = new Date(); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}>This month</button></div>
  </div>;
}
