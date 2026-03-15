/**
 * useRealtime.js — Hook WebSocket + Auto-Polling
 * Itilize nan nenpòt paj pou done an tan reyèl
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = () =>
  (process.env.NEXT_PUBLIC_API_URL || 'https://borlette-backend-web-production.up.railway.app')
    .replace('https://','wss://').replace('http://','ws://') + '/ws';

export default function useRealtime({ onFiche, onResultat, onPOS, autoReload, reloadInterval=30000 } = {}) {
  const [wsLive,    setWsLive]    = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [eventCount,setEventCount]= useState(0);
  const wsRef    = useRef(null);
  const timerRef = useRef(null);
  const retryRef = useRef(null);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const ws = new WebSocket(WS_URL());
      wsRef.current = ws;
      ws.onopen  = () => setWsLive(true);
      ws.onclose = () => {
        setWsLive(false);
        retryRef.current = setTimeout(connect, 8000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          setLastEvent(msg);
          setEventCount(c => c + 1);
          if (msg.type === 'nouvelle_fiche'  && onFiche)    onFiche(msg);
          if (msg.type === 'nouveau_resultat' && onResultat) onResultat(msg);
          if (msg.type === 'pos_update'       && onPOS)      onPOS(msg);
          // Auto-reload sou evènman enpòtan
          if (autoReload && ['nouvelle_fiche','nouveau_resultat','pos_update'].includes(msg.type)) {
            autoReload();
          }
        } catch {}
      };
    } catch {}
  }, []);

  useEffect(() => {
    connect();
    if (autoReload && reloadInterval > 0) {
      timerRef.current = setInterval(autoReload, reloadInterval);
    }
    return () => {
      try { wsRef.current?.close(); } catch {}
      clearInterval(timerRef.current);
      clearTimeout(retryRef.current);
    };
  }, []);

  return { wsLive, lastEvent, eventCount };
}
