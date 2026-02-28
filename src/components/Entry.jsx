import { useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { getEntry, formatDate } from '../data/entries';
import Sidebar from './Sidebar';
import ListenButton from './ListenButton';

function fmt(text) {
  const parts = [];
  let rem = text;
  let k = 0;
  while (rem.length > 0) {
    const bm = rem.match(/\*\*(.+?)\*\*/);
    if (bm) {
      const idx = rem.indexOf(bm[0]);
      if (idx > 0) parts.push(rem.slice(0, idx));
      parts.push(<strong key={k++} style={{ fontWeight: 500, color: '#fff' }}>{bm[1]}</strong>);
      rem = rem.slice(idx + bm[0].length);
      continue;
    }
    const im = rem.match(/\*(.+?)\*/);
    if (im) {
      const idx = rem.indexOf(im[0]);
      if (idx > 0) parts.push(rem.slice(0, idx));
      parts.push(<em key={k++}>{im[1]}</em>);
      rem = rem.slice(idx + im[0].length);
      continue;
    }
    parts.push(rem);
    break;
  }
  return parts;
}

function renderBody(text) {
  const lines = text.split('\n');
  const els = [];
  let cur = [];
  const flush = () => { if (cur.length) { els.push({ t: 'p', c: cur.join(' ') }); cur = []; } };
  lines.forEach(l => {
    const t = l.trim();
    if (!t) flush();
    else if (t === '---') { flush(); els.push({ t: 'hr' }); }
    else if (t.startsWith('> ')) { flush(); els.push({ t: 'bq', c: t.slice(2) }); }
    else cur.push(t);
  });
  flush();
  return els;
}

// Strip markdown formatting for plain text (TTS)
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^> /gm, '')
    .replace(/---/g, '')
    .trim();
}

export default function Entry() {
  const { date } = useParams();
  const entry = getEntry(date);

  // getText callback for ListenButton — returns clean plain text
  const getText = useCallback(() => {
    if (!entry) return '';
    const title = entry.title || '';
    const subtitle = entry.subtitle || '';
    const body = stripMarkdown(entry.body || '');
    // Compose a natural reading: title, pause, subtitle, pause, body, sign-off
    return `${title}. ${subtitle ? subtitle + '. ' : ''}${body} ... This has been Meridian.`;
  }, [entry]);

  if (!entry) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', color: '#888',
      fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.5rem'
    }}>
      This day has not been written yet
    </div>
  );

  const els = renderBody(entry.body);

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <Sidebar currentDate={date} />
      <ListenButton getText={getText} />
      <main className="main-content" style={{ minHeight: '100vh' }}>
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: 680, margin: '0 auto', padding: '4rem 1.5rem 6rem' }}
        >
          <div style={{
            fontSize: '0.75rem', color: '#555', letterSpacing: '0.15em',
            textTransform: 'uppercase', marginBottom: '2rem'
          }}>{formatDate(date)}</div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 300,
            lineHeight: 1.2, color: '#f5f0eb', marginBottom: '0.75rem'
          }}>{entry.title}</h1>

          {entry.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontSize: '1.15rem', fontWeight: 300, fontStyle: 'italic',
              color: '#888', marginBottom: '3rem'
            }}>{entry.subtitle}</p>
          )}

          <div style={{
            height: 1,
            background: 'linear-gradient(to right,transparent,#333,transparent)',
            marginBottom: '3rem'
          }} />

          <div>{els.map((el, i) => {
            if (el.t === 'p') return <p key={i} style={{ marginBottom: '1.5em' }}>{fmt(el.c)}</p>;
            if (el.t === 'hr') return <hr key={i} style={{ border: 'none', borderTop: '1px solid #222', margin: '2.5em 0' }} />;
            if (el.t === 'bq') return <blockquote key={i} style={{ borderLeft: '1px solid #d4c5b0', paddingLeft: '1.5em', margin: '2em 0', fontStyle: 'italic', color: '#aaa' }}>{fmt(el.c)}</blockquote>;
            return null;
          })}</div>

          <div style={{
            marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #111',
            fontSize: '0.8rem', color: '#444',
            fontFamily: "'Cormorant Garamond',Georgia,serif",
            letterSpacing: '0.1em', fontStyle: 'italic'
          }}>— Meridian</div>
        </motion.article>
      </main>
    </div>
  );
}
