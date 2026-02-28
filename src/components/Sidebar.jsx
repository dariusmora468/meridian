import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllDates, formatDateShort, getMonthYear } from '../data/entries';
export default function Sidebar({ currentDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const dates = getAllDates();
  const grouped = {};
  dates.forEach(d => { const k = getMonthYear(d); if (!grouped[k]) grouped[k] = []; grouped[k].push(d); });
  const nav = (
    <nav style={{ padding: '2rem 1.5rem', height: '100%', overflowY: 'auto' }}>
      <Link to="/"><div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.1rem', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d4c5b0', marginBottom: '0.5rem' }}>Meridian</div></Link>
      <div style={{ fontSize: '0.7rem', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '3rem' }}>A diary of the AI mind</div>
      {Object.entries(grouped).map(([month, mDates]) => (
        <div key={month} style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>{month}</div>
          {mDates.map(d => (
            <Link to={`/entry/${d}`} key={d} onClick={() => setIsOpen(false)}><div style={{ padding: '0.35rem 0', fontSize: '0.85rem', color: d === currentDate ? '#f5f0eb' : '#666', transition: 'color 0.2s', cursor: 'pointer', borderLeft: d === currentDate ? '1px solid #d4c5b0' : '1px solid transparent', paddingLeft: '0.75rem' }}>{formatDateShort(d)}</div></Link>
          ))}
        </div>
      ))}
    </nav>
  );
  return (
    <>
      <aside className="desktop-sidebar" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 200, borderRight: '1px solid #111', background: '#000', zIndex: 10, display: 'none' }}>{nav}</aside>
      <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)} style={{ position: 'fixed', top: '1.25rem', left: '1.25rem', zIndex: 100, background: 'none', border: 'none', color: '#888', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'Cormorant Garamond',Georgia,serif", padding: '0.5rem', display: 'none' }}>{isOpen ? 'Close' : 'Archive'}</button>
      <AnimatePresence>{isOpen && <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'tween', duration: 0.3 }} style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 280, background: '#000', borderRight: '1px solid #111', zIndex: 90 }}><div style={{ paddingTop: '3.5rem' }}>{nav}</div></motion.aside>}</AnimatePresence>
      <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 80 }} />}</AnimatePresence>
    </>
  );
}
