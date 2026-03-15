import WsBadge from '../components/WsBadge';
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useRouter } from 'next/router';
import { isLoggedIn } from '../utils/auth';

const ALL_TIRAGES = [
  { nom:'Georgia-Matin',    emoji:'🍑', color:'#16a34a' },
  { nom:'Georgia-Soir',     emoji:'🍑', color:'#16a34a' },
  { nom:'Florida matin',    emoji:'🌴', color:'#1a73e8' },
  { nom:'Florida soir',     emoji:'🌴', color:'#1a73e8' },
  { nom:'New-york matin',   emoji:'🗽', color:'#7c3aed' },
  { nom:'New-york soir',    emoji:'🗽', color:'#7c3aed' },
  { nom:'Ohio matin',       emoji:'🌻', color:'#f59e0b' },
  { nom:'Ohio soir',        emoji:'🌻', color:'#f59e0b' },
  { nom:'Chicago matin',    emoji:'🏙️', color:'#0891b2' },
  { nom:'Chicago soir',     emoji:'🏙️', color:'#0891b2' },
  { nom:'Maryland midi',    emoji:'🦀', color:'#dc2626' },
  { nom:'Maryland soir',    emoji:'🦀', color:'#dc2626' },
  { nom:'Tennessee matin',  emoji:'🎸', color:'#8b5cf6' },
  { nom:'Tennessee soir',   emoji:'🎸', color:'#8b5cf6' },
];

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background:'white', borderRadius:12, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
        borderTop:`4px solid ${color}`, cursor: onClick ? 'pointer' : 'default',
        transition:'transform 0.1s', flex:1, minWidth:0 }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform='translateY(-2px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform='none')}>
      <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:12, color:'#555', fontWeight:700, marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [mounted,    setMounted]    = useState(false);
  const [stats,      setStats]      = useState(null);
  const [resultats,  setResultats]  = useState({});
  const [rapport,    setRapport]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [fetching,   setFetching]   = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab,  setActiveTab]  = useState('overview');
  const [liveStats,   setLiveStats]   = useState({ newFiches:0, jwe:0, pete:0, totalLive:0 });
  const [transactions, setTransactions] = useState([]);
  const [wsLive,       setWsLive]       = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentModalType, setAgentModalType] = useState('actif'); // 'actif' | 'inactif'

  // Modal antre rezilta
  const [showModal,  setShowModal]  = useState(false);
  const [tirages,    setTirages]    = useState([]);
  const [selTirage,  setSelTirage]  = useState('');
  const [lot1, setLot1] = useState('');
  const [lot2, setLot2] = useState('');
  const [lot3, setLot3] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn()) { router.push('/'); return; }
    loadAll();
    const iv = setInterval(loadAll, 3 * 60 * 1000);

    // WebSocket tan reyèl
    let ws;
    const connectWS = () => {
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'https://web-production-9549c.up.railway.app')
          .replace('https://','wss://').replace('http://','ws://');
        ws = new WebSocket(`${base}/ws`);
        ws.onopen  = () => setWsLive(true);
        ws.onclose = () => { setWsLive(false); setTimeout(connectWS, 8000); };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'nouvelle_fiche') {
              setLiveStats(prev => ({
                newFiches: prev.newFiches + 1,
                jwe:  prev.jwe,      // jwe mete ajou lè rezilta antre
                pete: prev.pete + 1, // tout fich konte kòm pete jiska rezilta
                totalLive: prev.totalLive + (msg.total||0),
              }));
              setTransactions(prev => [
                { ...msg, type_tx:'fiche', icon:'🎫', label:`Fich ${msg.ticket}`, ts: Date.now() },
                ...prev
              ].slice(0, 30));
            } else if (msg.type === 'nouveau_resultat') {
              setTransactions(prev => [
                { type_tx:'resultat', icon:'🎯', label:`Rezilta ${msg.tirage}: ${msg.lot1}/${msg.lot2||'—'}/${msg.lot3||'—'}`, ts: Date.now(), tirage: msg.tirage },
                ...prev
              ].slice(0, 30));
            }
          } catch {}
        };
      } catch {}
    };
    connectWS();
    return () => { clearInterval(iv); try { ws?.close(); } catch {} };
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const [statsR, resR, rapR, tirR] = await Promise.allSettled([
        api.get('/api/admin/stats'),
        api.get('/api/admin/resultats'),
        api.get(`/api/rapport/journalier?date=${today}`),
        api.get('/api/tirages'),
      ]);

      if (statsR.status==='fulfilled') setStats(statsR.value.data);

      if (resR.status==='fulfilled') {
        const data = Array.isArray(resR.value.data) ? resR.value.data : [];
        const latest = {};
        data.forEach(r => {
          if (!latest[r.tirage] || new Date(r.date)>new Date(latest[r.tirage].date))
            latest[r.tirage] = r;
        });
        setResultats(latest);
        setLastUpdate(new Date());
      }

      if (rapR.status==='fulfilled') setRapport(rapR.value.data);
      if (tirR.status==='fulfilled') setTirages(Array.isArray(tirR.value.data) ? tirR.value.data : []);
    } catch {}
    setLoading(false);
  }, []);

  const handleFetchOnline = async () => {
    setFetching(true);
    try {
      await api.get('/api/resultats/fetch');
      await loadAll();
    } catch { alert('Pa ka chèche sou entènèt — antre manyèlman'); }
    setFetching(false);
  };

  const handleSaveResultat = async () => {
    if (!selTirage || !lot1) return alert('Tiraj ak 1e boul obligatwa!');
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.post('/api/admin/resultats', {
        tirage: selTirage,
        date: today,
        lot1: lot1.padStart(2,'0'),
        lot2: lot2 ? lot2.padStart(2,'0') : '',
        lot3: lot3 ? lot3.padStart(2,'0') : '',
      });
      setShowModal(false);
      setLot1(''); setLot2(''); setLot3(''); setSelTirage('');
      const nb = res.data?.gagnants || 0;
      alert(`✅ Rezilta sove!\nTiraj: ${selTirage}\n🏆 Gagnant jwenn: ${nb}`);
      loadAll();
    } catch(e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSaving(false);
  };

  const fmt = (n) => parseFloat(n||0).toLocaleString('fr-HT', { minimumFractionDigits:2 });
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'}) : '';

  const TABS = [
    { key:'overview', label:'Vue Générale' },
    { key:'resultats', label:'🎯 Rezilta' },
    { key:'agents', label:'👥 Ajan' },
    { key:'tirages', label:'📋 Tiraj' },
  ];

  // Anpeche SSR flash — tann client mount
  if (!mounted) return null;
  if (!isLoggedIn()) return null;

  const agentList = agentModalType === 'actif'
    ? (stats?.agentsActifList || [])
    : (stats?.agentsInactifList || []);

  return (
    <Layout>
      <div>
        {/* ── BANNIÈRE ── */}
        <div style={{ background:'linear-gradient(135deg,#1a73e8,#0d47a1)', borderRadius:12, padding:'16px 24px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ color:'white', fontWeight:900, fontSize:18, letterSpacing:1 }}>LA-PROBITE-BORLETTE</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:2 }}>
              {new Date().toLocaleDateString('fr-HT', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              {lastUpdate && <span style={{ marginLeft:12 }}>· Mizajou: {fmtTime(lastUpdate)}</span>}
              <span style={{ marginLeft:12, color: wsLive?'#86efac':'#fca5a5', fontWeight:700 }}>
                {wsLive ? '🔴 LIVE' : '⚪ Hòs Liy'}
              </span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleFetchOnline} disabled={fetching}
              style={{ background: fetching?'rgba(255,255,255,0.2)':'#16a34a', color:'white', border:'none', borderRadius:8, padding:'9px 16px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {fetching ? '🔄 Ap chèche...' : '🌐 Chèche Anliy'}
            </button>
            <button onClick={() => setShowModal(true)}
              style={{ background:'#f59e0b', color:'black', border:'none', borderRadius:8, padding:'9px 16px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              ✏️ Antre Rezilta
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding:'8px 18px', borderRadius:20, border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
                background: activeTab===t.key ? '#1a73e8' : '#f3f4f6',
                color: activeTab===t.key ? 'white' : '#374151' }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && !stats ? (
          <div style={{ textAlign:'center', padding:60, color:'#888' }}>⏳ Chajman done...</div>
        ) : <>

        {/* ════════════ TAB: VUE GÉNÉRALE ════════════ */}
        {activeTab === 'overview' && (
          <div>
            {/* STATS JODI A */}
            <div style={{ marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#888', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>📅 Jodi a</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <StatCard icon="💰" label="Vant Jodi" value={`${fmt(stats?.venteJodi)} G`} color="#16a34a"
                  sub={`${stats?.fichesJodi||0} fiches`} onClick={() => router.push('/rapport/journalier')} />
                <StatCard icon="💸" label="Komisyon" value={`${fmt(stats?.commJodi)} G`} color="#f59e0b"
                  sub="Tout ajan" />
                <StatCard icon="🏆" label="Gagnant" value={stats?.fichesGagnant||0} color="#dc2626"
                  sub={`${fmt(stats?.totalGagne)} G peye`} onClick={() => router.push('/surveillance/lots-gagnant')} />
                <StatCard icon="📊" label="Bilan Net" value={`${fmt(stats?.bilanJodi)} G`}
                  color={parseFloat(stats?.bilanJodi||0) >= 0 ? '#16a34a' : '#dc2626'}
                  sub={parseFloat(stats?.bilanJodi||0) >= 0 ? '✅ Profit' : '⚠️ Defisi'}
                  onClick={() => router.push('/rapport/defisi')} />
                <StatCard icon="📱" label="POS Anliy" value={`${stats?.posOnline||0} / ${stats?.totalPos||0}`} color="#0891b2"
                  sub="Dènye 5 minit" onClick={() => router.push('/surveillance/pos-connectes')} />
              </div>
            </div>

            {/* LIVE ACTIVITY */}
            {(liveStats.newFiches > 0 || transactions.length > 0) && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:800, color:'#888', marginBottom:10, textTransform:'uppercase', letterSpacing:1, display:'flex', alignItems:'center', gap:8 }}>
                  🔴 LIVE — Aktivite Tan Reyèl
                  <span style={{ background:'#dc2626', color:'white', borderRadius:10, padding:'1px 8px', fontSize:10 }}>LIVE</span>
                </div>
                <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap' }}>
                  {[
                    ['🎫 Nouvo Fich', liveStats.newFiches, '#1a73e8'],
                    ['💰 Vant Live', `${fmt(liveStats.totalLive)} G`, '#16a34a'],
                    ['🏆 Jwe/Gagnant', liveStats.jwe, '#f59e0b'],
                    ['💨 Pete (Pèdi)', liveStats.pete, '#6b7280'],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ background:'white', borderRadius:10, padding:'12px 16px', border:`2px solid ${c}22`, borderLeft:`4px solid ${c}`, flex:1, minWidth:120 }}>
                      <div style={{ fontSize:11, color:'#666', fontWeight:600 }}>{l}</div>
                      <div style={{ fontSize:20, fontWeight:900, color:c, marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {/* FLUX TRANSACTIONS */}
                {transactions.length > 0 && (
                  <div style={{ background:'white', borderRadius:10, padding:14, maxHeight:200, overflowY:'auto', border:'1px solid #f0f0f0' }}>
                    <div style={{ fontWeight:800, fontSize:12, color:'#333', marginBottom:8 }}>Dènye Aktivite:</div>
                    {transactions.map((tx, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #f8f9fa', fontSize:12 }}>
                        <span style={{ fontSize:16 }}>{tx.icon}</span>
                        <span style={{ flex:1, fontWeight:600 }}>{tx.label}</span>
                        {tx.total > 0 && <span style={{ color:'#16a34a', fontWeight:800 }}>{fmt(tx.total)} G</span>}
                        <span style={{ color:'#aaa', fontSize:10 }}>{tx.agent||''}</span>
                        <span style={{ color:'#ccc', fontSize:10 }}>{new Date(tx.ts).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STATS KIMILATIF */}
            <div style={{ marginBottom:20, marginTop:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#888', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>📊 Kimilatif</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <StatCard icon="✅" label="Ajan Aktif" value={stats?.agentsActif||stats?.totalAgents||0} color="#16a34a"
                  sub="Klike pou wè lis" onClick={() => { setAgentModalType('actif'); setShowAgentModal(true); }} />
                <StatCard icon="❌" label="Ajan Inaktif" value={stats?.agentsInactif||0} color="#dc2626"
                  sub="Klike pou wè lis" onClick={() => { setAgentModalType('inactif'); setShowAgentModal(true); }} />
                <StatCard icon="🎫" label="Total Fiches" value={stats?.totalFiches||0} color="#1a73e8"
                  sub={`Semèn: ${stats?.fichesSemaine||0}`} onClick={() => router.push('/rapport/fiches-vendu')} />
                <StatCard icon="💵" label="Total Vant" value={`${fmt(stats?.venteTotal)} G`} color="#16a34a"
                  sub={`Semèn: ${fmt(stats?.venteSemaine)} G`} />
                <StatCard icon="🚫" label="Elimine" value={stats?.fichesElimine||0} color="#6b7280"
                  onClick={() => router.push('/rapport/fiches-elimine')} />
              </div>
            </div>

            {/* VANT PA TIRAJ + TOP AJAN */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>

              {/* VANT PA TIRAJ */}
              <div className="card">
                <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800 }}>📋 Vant pa Tiraj — Jodi a</h3>
                {(!stats?.ventePaTiraj?.length) ? (
                  <p style={{ color:'#888', textAlign:'center', padding:20 }}>Pa gen vant jodi a</p>
                ) : stats.ventePaTiraj.map((t,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f0f0f0' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{t.nom}</div>
                      <div style={{ fontSize:11, color:'#888' }}>{t.fiches} fich</div>
                    </div>
                    <div style={{ fontWeight:900, color:'#16a34a' }}>{fmt(t.vente)} G</div>
                  </div>
                ))}
              </div>

              {/* TOP AJAN */}
              <div className="card">
                <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800 }}>🥇 Top Ajan — Jodi a</h3>
                {(!stats?.topAgents?.length) ? (
                  <p style={{ color:'#888', textAlign:'center', padding:20 }}>Pa gen vant jodi a</p>
                ) : stats.topAgents.map((a,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f0f0f0' }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:['#f59e0b','#9ca3af','#b45309','#1a73e8','#7c3aed'][i],
                      display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:13, flexShrink:0 }}>
                      {i+1}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{a.nom}</div>
                      <div style={{ fontSize:11, color:'#888' }}>{a.fiches} fich · comm: {fmt(a.vente * a.pct/100)} G</div>
                    </div>
                    <div style={{ fontWeight:900, color:'#16a34a' }}>{fmt(a.vente)} G</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RAPÒ JODI A */}
            {rapport && (
              <div className="card" style={{ marginBottom:20 }}>
                <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800 }}>📈 Rapò Konplè — Jodi a</h3>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
                  {[
                    ['Total Vant', `${fmt(rapport.vente)} HTG`, '#16a34a'],
                    ['Fiches Vann', rapport.fichesVendu||0, '#1a73e8'],
                    ['Komisyon', `${fmt(rapport.commission||0)} HTG`, '#f59e0b'],
                  ].map(([l,v,c]) => (
                    <div key={l} style={{ background:'#f8faff', border:`1px solid ${c}33`, borderRadius:8, padding:'10px 16px', flex:1, minWidth:120 }}>
                      <div style={{ fontSize:11, color:'#666', fontWeight:600 }}>{l}</div>
                      <div style={{ fontSize:18, fontWeight:900, color:c, marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {rapport.agents?.length > 0 && (
                  <table className="data-table">
                    <thead><tr>{['Ajan','Fiches','Vant','Komisyon'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {rapport.agents.map((a,i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:700 }}>{a.agent}</td>
                          <td>{a.fiches}</td>
                          <td style={{ fontWeight:800, color:'#16a34a' }}>{fmt(a.vente)} G</td>
                          <td style={{ color:'#f59e0b' }}>{fmt(a.commission)} G</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* AKSÈ RAPID */}
            <div className="card">
              <h3 style={{ margin:'0 0 14px', fontSize:15, fontWeight:800 }}>⚡ Aksè Rapid</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
                {[
                  ['🎫','Fiches Vendu','/rapport/fiches-vendu','#1a73e8'],
                  ['🏆','Lots Gagnant','/surveillance/lots-gagnant','#16a34a'],
                  ['📊','Statistiques','/surveillance/statistiques','#f59e0b'],
                  ['👥','Agents','/agents','#7c3aed'],
                  ['💰','Paiement','/paiement','#dc2626'],
                  ['🔍','Tracabilite','/surveillance/tracabilite','#0891b2'],
                  ['📱','POS Connectes','/surveillance/pos-connectes','#16a34a'],
                  ['🚫','Bloké Boule','/surveillance/blocage-boule','#dc2626'],
                  ['📋','Journalier','/rapport/journalier','#7c3aed'],
                  ['🗣️','Doleances','/doleances','#f59e0b'],
                ].map(([ic,lb,path,c]) => (
                  <button key={path} onClick={() => router.push(path)}
                    style={{ background:'#f8f9fa', border:`1.5px solid ${c}33`, borderRadius:10, padding:'12px 6px', cursor:'pointer', textAlign:'center' }}>
                    <div style={{ fontSize:22 }}>{ic}</div>
                    <div style={{ fontSize:10, fontWeight:700, color:c, marginTop:4 }}>{lb}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ TAB: REZILTA ════════════ */}
        {activeTab === 'resultats' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:900 }}>🎯 Rezilta Tiraj</h2>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleFetchOnline} disabled={fetching}
                  style={{ background:'#16a34a', color:'white', border:'none', borderRadius:8, padding:'9px 16px', fontWeight:700, cursor:'pointer' }}>
                  {fetching ? '🔄...' : '🌐 Chèche Anliy'}
                </button>
                <button onClick={() => setShowModal(true)}
                  style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:8, padding:'9px 16px', fontWeight:700, cursor:'pointer' }}>
                  ✏️ Antre Manyèl
                </button>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {ALL_TIRAGES.map((t,i) => {
                const res = resultats[t.nom];
                return (
                  <div key={i} style={{ background:'white', borderRadius:12, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', borderLeft:`4px solid ${t.color}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:24 }}>{t.emoji}</span>
                      <div>
                        <div style={{ fontWeight:800, fontSize:14 }}>{t.nom}</div>
                        <div style={{ fontSize:11, color:'#888' }}>
                          {res ? new Date(res.date).toLocaleDateString('fr') : 'Pa gen rezilta'}
                          {res?.source && <span style={{ marginLeft:6, background:'#dcfce7', color:'#16a34a', borderRadius:10, padding:'1px 6px', fontSize:9, fontWeight:700 }}>{res.source}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
                      {[res?.lot1, res?.lot2, res?.lot3].map((lot,j) => (
                        <div key={j} style={{ width:50, height:50, borderRadius:'50%',
                          background: lot ? [t.color,'#f59e0b','#dc2626'][j] : '#f0f0f0',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color: lot ? 'white':'#ccc', fontWeight:900, fontSize:16,
                          boxShadow: lot ? '0 2px 6px rgba(0,0,0,0.2)':'none' }}>
                          {lot || '--'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════ TAB: AJAN ════════════ */}
        {activeTab === 'agents' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:900 }}>👥 Ajan yo</h2>
              <button onClick={() => router.push('/agents')}
                style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:8, padding:'9px 16px', fontWeight:700, cursor:'pointer' }}>
                ⚙️ Jere Ajan
              </button>
            </div>
            <div className="card">
              <table className="data-table">
                <thead><tr>{['Ajan','Username','Balans','Fiches Jodi','Vant Jodi','Komisyon','Statut'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {(!stats?.topAgents?.length && !rapport?.agents?.length) ? (
                    <tr><td colSpan={7} style={{ padding:24, textAlign:'center', color:'#888' }}>Pa gen done ajan</td></tr>
                  ) : (rapport?.agents||[]).map((a,i) => (
                    <tr key={i}>
                      <td style={{ fontWeight:800 }}>{a.agent}</td>
                      <td style={{ fontFamily:'monospace', color:'#1a73e8', fontSize:12 }}>—</td>
                      <td style={{ fontWeight:800, color:'#f59e0b' }}>—</td>
                      <td>{a.fiches}</td>
                      <td style={{ fontWeight:800, color:'#16a34a' }}>{fmt(a.vente)} G</td>
                      <td style={{ color:'#f59e0b' }}>{fmt(a.commission)} G</td>
                      <td><span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:10, padding:'2px 8px', fontSize:11, fontWeight:700 }}>Aktif</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop:12, textAlign:'right' }}>
                <button onClick={() => router.push('/rapport/journalier')}
                  style={{ background:'#f3f4f6', border:'none', borderRadius:6, padding:'8px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                  Wè Rapò Konplè →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ TAB: TIRAJ ════════════ */}
        {activeTab === 'tirages' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ margin:0, fontSize:17, fontWeight:900 }}>📋 Tiraj yo</h2>
              <button onClick={() => router.push('/configurations/tirages')}
                style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:8, padding:'9px 16px', fontWeight:700, cursor:'pointer' }}>
                ⚙️ Konfigire Tiraj
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
              {tirages.map(t => {
                const res = resultats[t.nom];
                const tirInfo = ALL_TIRAGES.find(x => x.nom===t.nom) || { emoji:'🎯', color:'#1a73e8' };
                return (
                  <div key={t._id} style={{ background:'white', borderRadius:10, padding:14, boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
                    borderLeft:`4px solid ${t.actif ? tirInfo.color : '#ccc'}`, opacity: t.actif ? 1 : 0.6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:13 }}>{tirInfo.emoji} {t.nom}</div>
                        <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, fontWeight:700, marginTop:4, display:'inline-block',
                          background: t.actif ? '#dcfce7':'#fee2e2', color: t.actif ? '#16a34a':'#dc2626' }}>
                          {t.actif ? '🟢 Ouvè':'🔴 Fèmen'}
                        </span>
                      </div>
                    </div>
                    {res && (
                      <div style={{ display:'flex', gap:4, marginTop:10 }}>
                        {[res.lot1, res.lot2, res.lot3].filter(Boolean).map((b,j) => (
                          <div key={j} style={{ width:32, height:32, borderRadius:'50%',
                            background:[tirInfo.color,'#f59e0b','#dc2626'][j],
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'white', fontWeight:900, fontSize:12 }}>
                            {b}
                          </div>
                        ))}
                      </div>
                    )}
                    {!res && <div style={{ color:'#ccc', fontSize:11, marginTop:10 }}>Pa gen rezilta</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        </>}

        {/* ── MODAL ANTRE REZILTA ── */}
        {showModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'white', borderRadius:16, padding:28, width:'100%', maxWidth:480 }}>
              <h3 style={{ margin:'0 0 20px', fontWeight:900, fontSize:18 }}>🎯 Antre Rezilta Tiraj</h3>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>Chwazi Tiraj *</label>
                <select value={selTirage} onChange={e => setSelTirage(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }}>
                  <option value="">-- Chwazi --</option>
                  {tirages.filter(t=>t.actif).map(t => (
                    <option key={t._id} value={t.nom}>{t.nom}</option>
                  ))}
                </select>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:20 }}>
                {[['1e Boul *', lot1, setLot1,'#16a34a'],['2e Boul', lot2, setLot2,'#f59e0b'],['3e Boul', lot3, setLot3,'#dc2626']].map(([l,v,fn,c]) => (
                  <div key={l}>
                    <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:5, color:c }}>{l}</label>
                    <input type="number" min="0" max="99" value={v} onChange={e => fn(e.target.value)}
                      placeholder="00" maxLength={2}
                      style={{ width:'100%', padding:'12px', border:`2px solid ${v?c:'#ddd'}`, borderRadius:8, fontSize:20, fontWeight:900, textAlign:'center', boxSizing:'border-box', color:c }} />
                  </div>
                ))}
              </div>

              {selTirage && lot1 && (
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:12, marginBottom:16, fontSize:13, fontWeight:700, color:'#15803d' }}>
                  ✅ {selTirage} → {lot1.padStart(2,'0')} {lot2?`/ ${lot2.padStart(2,'0')}`:''} {lot3?`/ ${lot3.padStart(2,'0')}` :''}
                </div>
              )}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setShowModal(false); setLot1(''); setLot2(''); setLot3(''); setSelTirage(''); }}
                  style={{ flex:1, padding:'12px', background:'#f3f4f6', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                  Anile
                </button>
                <button onClick={handleSaveResultat} disabled={saving}
                  style={{ flex:2, padding:'12px', background: saving?'#ccc':'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:900, cursor:'pointer', fontSize:14 }}>
                  {saving ? '⏳ Ap sove...' : '✅ Sove + Kalkil Gagnant'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ══ MODAL AJAN ══ */}
      {showAgentModal && (
        <div onClick={() => setShowAgentModal(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
          zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'white', borderRadius:16, width:'100%', maxWidth:520,
            maxHeight:'80vh', display:'flex', flexDirection:'column',
            boxShadow:'0 20px 60px rgba(0,0,0,.3)', overflow:'hidden',
          }}>
            {/* Header modal */}
            <div style={{
              padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between',
              borderBottom:'1px solid #e5e7eb',
              background: agentModalType==='actif' ? 'linear-gradient(135deg,#dcfce7,#f0fdf4)' : 'linear-gradient(135deg,#fef2f2,#fff5f5)',
            }}>
              <div>
                <div style={{ fontWeight:900, fontSize:16, color:'#111' }}>
                  {agentModalType==='actif' ? '✅ Ajan Aktif' : '❌ Ajan Inaktif'}
                </div>
                <div style={{ fontSize:12, color:'#666', marginTop:2 }}>
                  {agentList.length} ajan {agentModalType==='actif' ? 'k ap travay' : 'dezaktive'}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button onClick={() => { setAgentModalType(agentModalType==='actif'?'inactif':'actif'); }}
                  style={{ background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', color:'#374151' }}>
                  {agentModalType==='actif' ? '❌ Wè Inaktif' : '✅ Wè Aktif'}
                </button>
                <button onClick={() => setShowAgentModal(false)}
                  style={{ background:'#f1f5f9', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16, fontWeight:900, color:'#374151' }}>×</button>
              </div>
            </div>

            {/* Lis ajan */}
            <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
              {agentList.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>
                    {agentModalType==='actif' ? '😴' : '🎉'}
                  </div>
                  <div style={{ fontWeight:700 }}>
                    {agentModalType==='actif' ? 'Pa gen ajan aktif' : 'Tout ajan yo aktif!'}
                  </div>
                </div>
              ) : agentList.map((a, i) => (
                <div key={a._id||i} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'12px 20px', borderBottom:'1px solid #f1f5f9',
                  transition:'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{
                    width:40, height:40, borderRadius:'50%', flexShrink:0,
                    background: agentModalType==='actif' ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#dc2626,#ef4444)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontWeight:900, fontSize:15,
                  }}>
                    {(a.prenom||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:'#111' }}>
                      {a.prenom} {a.nom}
                    </div>
                    <div style={{ fontSize:12, color:'#666', marginTop:1 }}>
                      @{a.username} {a.telephone ? `· ${a.telephone}` : ''}
                    </div>
                  </div>
                  <div style={{
                    padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800,
                    background: agentModalType==='actif' ? '#dcfce7' : '#fee2e2',
                    color: agentModalType==='actif' ? '#16a34a' : '#dc2626',
                  }}>
                    {agentModalType==='actif' ? 'AKTIF' : 'INAKTIF'}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding:'12px 20px', borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc' }}>
              <span style={{ fontSize:12, color:'#666' }}>{agentList.length} ajan total</span>
              <button onClick={() => { setShowAgentModal(false); router.push('/agents'); }}
                style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:8, padding:'8px 18px', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                ⚙️ Jere Ajan yo
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
