import { useState, useEffect, useRef, useCallback } from 'react';

// ── States: idle → loading → playing → paused ──
export default function ListenButton({ getText }) {
  const [state, setState] = useState('idle');   // idle | loading | playing | paused
  const [progress, setProgress] = useState(0);  // 0–1 for progress ring
  const [visible, setVisible] = useState(true);  // fade on scroll
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const lastScrollY = useRef(0);

  // ── Scroll visibility ──
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // Hide when scrolling down past 80px
      if (y > 80 && y > lastScrollY.current) {
        setVisible(false);
      }
      // Show when scrolling up or near top
      if (y < lastScrollY.current || y < 80) {
        setVisible(true);
      }
      lastScrollY.current = y;

      // Also show after scroll stops for 1.5s
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setVisible(true), 1500);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // ── Progress tracking ──
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onEnded = () => {
      setState('idle');
      setProgress(0);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // ── Cleanup blob URL on unmount ──
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    const audio = audioRef.current;

    // Playing → pause
    if (state === 'playing') {
      audio?.pause();
      setState('paused');
      return;
    }

    // Paused → resume
    if (state === 'paused') {
      audio?.play();
      setState('playing');
      return;
    }

    // Idle → fetch and play
    setState('loading');
    try {
      const text = getText();
      if (!text) {
        setState('idle');
        return;
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);

      const blob = await res.blob();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      audio.src = url;
      await audio.play();
      setState('playing');
    } catch (err) {
      console.error('Listen error:', err);
      setState('idle');
    }
  }, [state, getText]);

  // ── Stop button (long press or secondary action) ──
  const handleStop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setState('idle');
    setProgress(0);
  }, []);

  // ── SVG constants ──
  const SIZE = 44;
  const STROKE = 2;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  return (
    <>
      <audio ref={audioRef} preload="none" />
      <div
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 1000,
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <button
          onClick={handleClick}
          onDoubleClick={state !== 'idle' ? handleStop : undefined}
          aria-label={
            state === 'idle' ? 'Listen to this entry' :
            state === 'loading' ? 'Loading audio...' :
            state === 'playing' ? 'Pause' : 'Resume'
          }
          style={{
            position: 'relative',
            width: SIZE,
            height: SIZE,
            borderRadius: '50%',
            border: '1px solid rgba(212,197,176,0.25)',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.3s ease, background 0.3s ease',
            padding: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(212,197,176,0.5)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(212,197,176,0.25)';
            e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
          }}
        >
          {/* Progress ring (behind icon) */}
          {(state === 'playing' || state === 'paused') && (
            <svg
              width={SIZE}
              height={SIZE}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: 'rotate(-90deg)',
              }}
            >
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke="rgba(212,197,176,0.35)"
                strokeWidth={STROKE}
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.3s linear' }}
              />
            </svg>
          )}

          {/* Icon */}
          {state === 'idle' && (
            // Headphones icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4c5b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
            </svg>
          )}

          {state === 'loading' && (
            // Spinning loader
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{
              animation: 'meridian-spin 1s linear infinite',
            }}>
              <circle cx="12" cy="12" r="9" stroke="rgba(212,197,176,0.2)" strokeWidth="2" />
              <path d="M12 3a9 9 0 0 1 9 9" stroke="#d4c5b0" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}

          {state === 'playing' && (
            // Pause icon
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#d4c5b0">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          )}

          {state === 'paused' && (
            // Play icon (resume)
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#d4c5b0">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </button>
      </div>

      {/* Keyframes for spinner */}
      <style>{`
        @keyframes meridian-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
