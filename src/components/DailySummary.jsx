import React, { useState } from 'react';
import { dailySummary, localDateKey } from '../ledger';
import DateRangeCalendar from './DateRangeCalendar';

export default function DailySummary({ ledger }) {
  const [day, setDay] = useState(() => localDateKey());
  const [open, setOpen] = useState(false);
  const rows = dailySummary(ledger, day);
  return <section className="panel"><p className="eyebrow">DAY AT A GLANCE</p><h2>Daily summary</h2>
    <button className="entry-date" type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>Summary date <strong>{new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</strong><span>Change</span></button>
    {open && <DateRangeCalendar single from={day} to={day} max={localDateKey()} onChange={date => { setDay(date); setOpen(false); }} />}
    <p className="muted">Remaining is the closing stock for this date (so far for today). Corrections appear on the day they were made.</p>
    {rows.map(row => <article className="daily-product" key={row.id}><strong>{row.name}</strong><small>{row.unit} · Opening: {row.opening.toLocaleString()}</small><div className="daily-values"><div><span>Received</span><strong className="incoming">+{row.received.toLocaleString()}</strong></div><div><span>Delivered</span><strong className="outgoing">−{row.delivered.toLocaleString()}</strong></div><div><span>Remaining</span><strong>{row.remaining.toLocaleString()}</strong></div></div>{row.correction !== 0 && <p className="filter-note">Correction: {row.correction > 0 ? '+' : ''}{row.correction} {row.unit}</p>}</article>)}
    {!rows.length && <p className="muted">Receive your first stock to see a daily summary.</p>}
  </section>;
}
