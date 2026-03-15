import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

function fmtAgo(d) {
  if (!d) return '—';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60)   return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff/60)}min`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}j`;
}

export default function PosConnectes() {
  const [posListe,   setPosListe]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [filtre,     setFiltre]     = useState('tous'); // tous | connecte | deconnecte
  const [search,     setSearch]     = useState('');
  const intervalRef = useRef(null);

  const load = async () => {
    try {
      // Chaje TOUT POS (pa sèlman connectés)
      const [allPosRes, connectesRes] = await Promise.all([
        api.get('/api/admin/pos'),
        api.get('/api/admin/pos-connectes'),
      ]);

      const allPos    = Array.isArray(allPosRes.data) ? allPosRes.data : [];
      const connectes = connectesRes.data?.pos || connectesRes.data || [];
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;

      // Mach chak POS avèk statut koneksyon reyèl
      const liste = allPos.map(p => ({
        ...p,
        connecte: p.lastSeen && new Date(p.lastSeen).getTime() > fiveMinAgo,
      }));

      setPosListe(liste);
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const filtered = posListe
    .filter(p => {
      if (filtre === 'connecte')   return p.connecte;
      if (filtre === 'deconnecte') return !p.connecte;
      return true;
    })
    .filter(p => !search || [p.nom, p.posId, p.adresse, p.succursale, p.agentUsername]
      .some(v => String(v||'').toLowerCase().includes(search.toLowerCase())));

  const nbConnect  = posListe.filter(p => p.connecte).length;
  const nbDeconnect = posListe.filter(p => !p.connecte).length;

  return (
    <Layout>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'0 4px' }}>

        {/* BANNIÈRE */}
        <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12, padding:'12px 16px', marginBottom:12,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:14, color:'white' }}>🖥️ POS — Statut Koneksyon</span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {lastUpdate && (
              <span style={{ fontSize:10, color:'#94a3b8' }}>
                {lastUpdate.toLocaleTimeString('fr')}
              </span>
            )}
            <button onClick={load}
              style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'white',
                borderRadius:8, padding:'5px 12px', fontWeight:700, fontSize:12, cursor:'pointer' }}>
              🔄
            </button>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
          {[
            { v:posListe.length, l:'Total POS', c:'#1a73e8', icon:'🖥️', k:'tous' },
            { v:nbConnect,       l:'Konekte',   c:'#16a34a', icon:'🟢', k:'connecte' },
            { v:nbDeconnect,     l:'Dekonekte', c:'#dc2626', icon:'🔴', k:'deconnecte' },
          ].map(st => (
            <div key={st.k} onClick={() => setFiltre(st.k)}
              style={{ background: filtre===st.k ? st.c : 'white',
                borderRadius:10, padding:'12px 10px', textAlign:'center',
                cursor:'pointer', border:`2px solid ${filtre===st.k?st.c:'#e5e7eb'}`,
                transition:'all 0.15s' }}>
              <div style={{ fontSize:18, marginBottom:2 }}>{st.icon}</div>
              <div style={{ fontWeight:900, fontSize:22,
                color: filtre===st.k ? 'white' : st.c }}>{st.v}</div>
              <div style={{ fontSize:11, fontWeight:700,
                color: filtre===st.k ? 'rgba(255,255,255,0.85)' : '#888' }}>{st.l}</div>
            </div>
          ))}
        </div>

        {/* RECHÈCH */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Non POS, ID, ajan, adrès..."
          style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #ddd',
            borderRadius:10, fontSize:13, marginBottom:12, boxSizing:'border-box' }} />

        {/* LIS POS — KARD */}
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#888' }}>⏳ Ap chaje...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, background:'white',
            borderRadius:12, color:'#888' }}>
            Pa gen POS
          </div>
        ) : filtered.map((p, i) => (
          <div key={p._id||i}
            style={{ background:'white', borderRadius:12, padding:'14px 16px',
              marginBottom:10, boxShadow:'0 1px 4px rgba(0,0,0,0.07)',
              borderLeft:`5px solid ${p.connecte?'#16a34a':'#dc2626'}` }}>

            {/* Liy 1: Logo + Non + Statut */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              {/* Logo / inityal */}
              <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden',
                flexShrink:0, background:'#f1f5f9',
                display:'flex', alignItems:'center', justifyContent:'center',
                border: `2px solid ${p.connecte?'#16a34a':'#e5e7eb'}` }}>
                {p.logo
                  ? <img src={p.logo} alt="logo"
                      style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontWeight:900, fontSize:15, color:'#94a3b8' }}>
                      {(p.nom||'?')[0].toUpperCase()}
                    </span>
                }
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:900, fontSize:15, color:'#111',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {p.nom || '—'}
                </div>
                <div style={{ fontFamily:'monospace', fontSize:12, color:'#1a73e8',
                  fontWeight:700 }}>
                  {p.posId || 'Pa gen ID'}
                </div>
              </div>

              {/* Statut badge */}
              <div style={{ flexShrink:0, textAlign:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%',
                    background: p.connecte ? '#16a34a' : '#dc2626',
                    boxShadow: p.connecte ? '0 0 8px #16a34a' : 'none' }} />
                  <span style={{ fontWeight:800, fontSize:12,
                    color: p.connecte ? '#16a34a' : '#dc2626' }}>
                    {p.connecte ? 'Konekte' : 'Dekonekte'}
                  </span>
                </div>
                {p.lastSeen && (
                  <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>
                    {fmtAgo(p.lastSeen)} ago
                  </div>
                )}
              </div>
            </div>

            {/* Liy 2: Detay */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
              gap:6, fontSize:11 }}>
              <div style={{ background:'#f8f9fa', borderRadius:6, padding:'6px 8px' }}>
                <div style={{ color:'#888', marginBottom:1 }}>Ajan</div>
                <div style={{ fontWeight:700, color:'#374151' }}>
                  {p.agentUsername || '—'}
                </div>
              </div>
              <div style={{ background:'#f8f9fa', borderRadius:6, padding:'6px 8px' }}>
                <div style={{ color:'#888', marginBottom:1 }}>Succursale</div>
                <div style={{ fontWeight:700, color:'#374151' }}>
                  {p.succursale || '—'}
                </div>
              </div>
              <div style={{ background:'#f8f9fa', borderRadius:6, padding:'6px 8px' }}>
                <div style={{ color:'#888', marginBottom:1 }}>Prime</div>
                <div style={{ fontWeight:700, color:'#1a73e8' }}>
                  {p.prime || '60|20|10'}
                </div>
              </div>
              <div style={{ background:'#f8f9fa', borderRadius:6, padding:'6px 8px' }}>
                <div style={{ color:'#888', marginBottom:1 }}>Adrès</div>
                <div style={{ fontWeight:700, color:'#374151', overflow:'hidden',
                  textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {p.adresse || '—'}
                </div>
              </div>
              <div style={{ background:'#f8f9fa', borderRadius:6, padding:'6px 8px' }}>
                <div style={{ color:'#888', marginBottom:1 }}>Kredi</div>
                <div style={{ fontWeight:700, color:'#374151' }}>
                  {p.credit || 'Illimité'}
                </div>
              </div>
              <div style={{ background: p.actif!==false ? '#f0fdf4' : '#fef2f2',
                borderRadius:6, padding:'6px 8px' }}>
                <div style={{ color:'#888', marginBottom:1 }}>Statut</div>
                <div style={{ fontWeight:800,
                  color: p.actif!==false ? '#16a34a' : '#dc2626' }}>
                  {p.actif!==false ? '🟢 Aktif' : '🔴 Inaktif'}
                </div>
              </div>
            </div>
          </div>
        ))}

        <p style={{ textAlign:'center', fontSize:11, color:'#9ca3af', marginTop:8 }}>
          Rafraîchi otomatik chak 30 sèkond
        </p>
      </div>
    </Layout>
  );
}
