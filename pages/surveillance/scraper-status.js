import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const ALL_TIRAGES = [
  'Georgia-Matin','Georgia-Soir','Florida matin','Florida soir',
  'New-york matin','New-york soir','Ohio matin','Ohio soir',
  'Chicago matin','Chicago soir','Maryland midi','Maryland soir',
  'Tennessee matin','Tennessee soir',
];
const TIRAGE_COLOR = {
  'Georgia-Matin':'#16a34a','Georgia-Soir':'#0891b2',
  'Florida matin':'#7c3aed','Florida soir':'#dc2626',
  'New-york matin':'#f59e0b','New-york soir':'#1a73e8',
  'Ohio matin':'#16a34a','Ohio soir':'#0891b2',
  'Chicago matin':'#7c3aed','Chicago soir':'#dc2626',
  'Maryland midi':'#f59e0b','Maryland soir':'#1a73e8',
  'Tennessee matin':'#16a34a','Tennessee soir':'#0891b2',
};

export default function ScraperStatus() {
  const [status,    setStatus]   = useState(null);
  const [latest,    setLatest]   = useState({});
  const [loading,   setLoading]  = useState(false);
  const [fetching,  setFetching] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        api.get('/api/resultats/status').then(r=>r.data).catch(()=>null),
        api.get('/api/resultats/latest').then(r=>r.data).catch(()=>({})),
      ]);
      setStatus(s);
      setLatest(l || {});
      setLastRefresh(new Date());
    } catch {}
    setLoading(false);
  };

  const forceFetch = async () => {
    setFetching(true);
    try {
      const r = await api.get('/api/resultats/fetch');
      await load();
      alert(`✅ ${r.data.saved} nouvo rezilta jwenn ak sove!`);
    } catch (e) {
      alert('Erè: ' + e.message);
    }
    setFetching(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    const p = n => String(n).padStart(2,'0');
    return `${p(dt.getDate())}/${p(dt.getMonth()+1)} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
  };

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* HEADER */}
        <div style={{ background:'#1e293b', borderRadius:8, padding:'14px 20px', marginBottom:16,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <span style={{ fontWeight:900, fontSize:16, color:'white' }}>🤖 Scraper Otomatik — Rezilta Tiraj</span>
            <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>
              Otomatik: chak 15min 10h-23h + egzakteman lè tiraj yo
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {lastRefresh && <span style={{ color:'#64748b', fontSize:11 }}>Aktualize: {fmtDate(lastRefresh)}</span>}
            <button onClick={load} disabled={loading}
              style={{ background:'#334155', color:'white', border:'none', borderRadius:6, padding:'8px 16px', fontWeight:700, cursor:'pointer', fontSize:12 }}>
              {loading ? '⏳' : '🔄 Aktualize'}
            </button>
            <button onClick={forceFetch} disabled={fetching}
              style={{ background: fetching ? '#555' : '#f59e0b', color:'white', border:'none', borderRadius:6, padding:'8px 16px', fontWeight:800, cursor:'pointer', fontSize:12 }}>
              {fetching ? '⏳ Ap chèche...' : '⚡ Fòse Fetch Kounye a'}
            </button>
          </div>
        </div>

        {/* STATUS CARDS */}
        {status && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            {[
              { label:'Dènye Run',     val: fmtDate(status.lastRun) || 'Poko', icon:'⏰', color:'#1a73e8' },
              { label:'Kouvèti Jodi',  val: status.coverage,                   icon:'📊', color:'#16a34a' },
              { label:'Tiraj Jwenn',   val: status.todayCount,                 icon:'✅', color:'#16a34a' },
              { label:'Tiraj Total',   val: status.totalTirages,               icon:'🎯', color:'#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ background:'white', borderRadius:8, padding:'14px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderLeft:`4px solid ${s.color}` }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontWeight:900, fontSize:18, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* GRILLE TIRAJ YO */}
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:16 }}>🎯 Eta Chak Tiraj — Jodi a</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {ALL_TIRAGES.map(tirage => {
              const r = latest[tirage];
              const color = TIRAGE_COLOR[tirage] || '#555';
              return (
                <div key={tirage} style={{
                  border: `1.5px solid ${r ? color+'44' : '#e5e7eb'}`,
                  borderRadius:10, overflow:'hidden',
                  background: r ? '#fff' : '#fafafa'
                }}>
                  {/* HEADER */}
                  <div style={{ background: r ? color : '#e5e7eb', padding:'8px 14px',
                    display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color: r ? 'white' : '#888', fontWeight:800, fontSize:13 }}>{tirage}</span>
                    <span style={{ background: r ? 'rgba(255,255,255,0.2)' : '#ddd', color: r ? 'white' : '#888',
                      borderRadius:10, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
                      {r ? `✅ ${r.source||'auto'}` : '⏳ Poko'}
                    </span>
                  </div>
                  {/* RÉSULTAT */}
                  <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    {r ? (
                      <>
                        <div style={{ display:'flex', gap:8 }}>
                          {[r.lot1, r.lot2, r.lot3].filter(Boolean).map((lot, j) => (
                            <div key={j} style={{ background:color, borderRadius:8, width:40, height:40,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color:'white', fontWeight:900, fontSize:16 }}>
                              {lot}
                            </div>
                          ))}
                        </div>
                        <span style={{ color:'#888', fontSize:11 }}>{fmtDate(r.date)}</span>
                      </>
                    ) : (
                      <span style={{ color:'#ccc', fontStyle:'italic', fontSize:12 }}>Pa gen rezilta pou jodi a</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* HORAIRE */}
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', marginTop:16 }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:12 }}>⏰ Orè Tiraj & Fetch Otomatik</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, fontSize:12 }}>
            {[
              ['Georgia',   'Georgia-Matin',   '12:29', 'Georgia-Soir',   '18:29'],
              ['Florida',   'Florida matin',   '13:30', 'Florida soir',   '18:00'],
              ['New-York',  'New-york matin',  '14:30', 'New-york soir',  '22:30'],
              ['Ohio',      'Ohio matin',      '12:29', 'Ohio soir',      '19:29'],
              ['Chicago',   'Chicago matin',   '12:40', 'Chicago soir',   '21:00'],
              ['Maryland',  'Maryland midi',   '13:00', 'Maryland soir',  '20:00'],
              ['Tennessee', 'Tennessee matin', '11:00', 'Tennessee soir', '18:00'],
            ].map(([state, k1, t1, k2, t2]) => (
              <div key={state} style={{ background:'#f8f9fa', borderRadius:8, padding:10 }}>
                <div style={{ fontWeight:800, color:'#333', marginBottom:6 }}>{state}</div>
                <div style={{ display:'flex', justifyContent:'space-between', color:'#555' }}>
                  <span>Maten:</span><span style={{ fontWeight:700, color: latest[k1]?'#16a34a':'#f59e0b' }}>{t1} {latest[k1]?'✅':'⏳'}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', color:'#555', marginTop:3 }}>
                  <span>Swa:</span><span style={{ fontWeight:700, color: latest[k2]?'#16a34a':'#f59e0b' }}>{t2} {latest[k2]?'✅':'⏳'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
