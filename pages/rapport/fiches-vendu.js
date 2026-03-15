import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES = ['Tout','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir',
  'New-york matin','New-york soir','Ohio matin','Ohio soir','Chicago matin','Chicago soir',
  'Maryland midi','Maryland soir','Tennessee matin','Tennessee soir'];

const TYPE_LABELS = { P0:'Borlette', P1:'Loto3-P1', P2:'Loto3-P2', P3:'Loto3-P3', MAR:'Mariage', L4:'Loto 4' };
const TYPE_COLORS = { P0:'#16a34a', P1:'#1a73e8', P2:'#7c3aed', P3:'#f59e0b', MAR:'#dc2626', L4:'#0891b2' };

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  const p = n => String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

function StatutBadge({ s }) {
  const c = s==='gagnant'  ? { bg:'#fef9c3', col:'#854d0e', lbl:'🏆 JWE'     }
          : s==='elimine'  ? { bg:'#fee2e2', col:'#dc2626', lbl:'❌ Elimine'  }
          : s==='bloke'    ? { bg:'#fef3c7', col:'#d97706', lbl:'🔒 Bloke'    }
          :                  { bg:'#f1f5f9', col:'#64748b', lbl:'💨 Pete'     };
  return <span style={{ background:c.bg, color:c.col, borderRadius:20,
    padding:'3px 10px', fontWeight:800, fontSize:11, whiteSpace:'nowrap' }}>{c.lbl}</span>;
}

export default function FichesVendu() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,   setDebut]      = useState(today);
  const [fin,     setFin]        = useState(today);
  const [tirage,  setTirage]     = useState('Tout');
  const [result,  setResult]     = useState(null);
  const [loading, setLoading]    = useState(false);
  const [search,  setSearch]     = useState('');
  const [page,    setPage]       = useState(0);
  const [vue,     setVue]        = useState('liste');   // 'liste' | 'ajan'
  const [selFich, setSelFich]    = useState(null);      // modal detay fich
  const [selAjan, setSelAjan]    = useState(null);      // modal detay ajan
  const [loadingRows, setLoadingRows] = useState(false);// chaje rows fich
  const [wsConn,  setWsConn]    = useState(false);
  const [newFiches, setNewFiches] = useState([]);
  const [filtreAjan, setFiltreAjan] = useState('Tout');
  const [agents,  setAgents]    = useState([]);
  const [actioning, setActioning] = useState(false);
  const PER_PAGE = 20;

  // WebSocket tan reyèl
  useEffect(() => {
    let ws;
    const connect = () => {
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'https://borlette-backend-web-production.up.railway.app')
          .replace('https://','wss://').replace('http://','ws://');
        ws = new WebSocket(`${base}/ws`);
        ws.onopen  = () => setWsConn(true);
        ws.onclose = () => { setWsConn(false); setTimeout(connect, 8000); };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const m = JSON.parse(e.data);
            if (m.type === 'nouvelle_fiche')
              setNewFiches(p => [m, ...p].slice(0, 50));
          } catch {}
        };
      } catch {}
    };
    connect();
    return () => { try { ws?.close(); } catch {} };
  }, []);

  // Chaje lis ajan pou filtre
  useEffect(() => {
    api.get('/api/admin/agents').then(r => {
      setAgents(Array.isArray(r.data)
        ? r.data.filter(a => a.role !== 'admin' && a.role !== 'superadmin') : []);
    }).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true); setNewFiches([]);
    try {
      const params = { debut, fin };
      if (tirage !== 'Tout') params.tirage = tirage;
      if (filtreAjan !== 'Tout') params.agent = filtreAjan;
      const r = await api.get('/api/admin/fiches', { params });
      const fiches = r.data?.fiches || r.data || [];
      setResult(Array.isArray(fiches) ? fiches : []);
      setPage(0);
    } catch { setResult([]); }
    finally { setLoading(false); }
  };

  // Klike sou yon fich → chaje rows konplè depi backend
  const openFich = async (f) => {
    // Mete fich la tousuit (pou modal ouvri)
    setSelFich({ ...f, rows: f.rows || [] });
    // Si rows yo vid, chaje yo depi backend
    if (!f.rows || f.rows.length === 0) {
      setLoadingRows(true);
      try {
        const r = await api.get(`/api/admin/fiches/${f.ticket}/rows`);
        const rows = r.data?.rows || r.data?.fiche?.rows || [];
        setSelFich(prev => prev ? { ...prev, rows } : null);
      } catch {}
      setLoadingRows(false);
    }
  };

  // Aksyon admin
  const doAction = async (action, fich) => {
    const msgs = {
      elimine: `Elimine fich #${fich.ticket}?\nAksyon sa pa ka derefè.`,
      bloke:   `Bloke fich #${fich.ticket}?`,
      debloke: `Debloke fich #${fich.ticket}?`,
    };
    if (!confirm(msgs[action])) return;
    setActioning(true);
    try {
      if (action === 'elimine') {
        await api.put(`/api/admin/fiches/${fich.ticket}/elimine`);
      } else if (action === 'bloke') {
        await api.put(`/api/admin/fiches/${fich.ticket}/bloke`);
      } else {
        // debloke — retounen aktif
        await api.put(`/api/admin/fiches/${fich.ticket}/elimine`, { annule: true })
          .catch(() => api.put(`/api/admin/fiches/${fich.ticket}/statut`, { statut:'actif' }));
      }
      setSelFich(null);
      load();
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setActioning(false);
  };

  const allFiches = (() => {
    if (!result) return [];
    const existing = new Set((result||[]).map(f => f.ticket));
    return [...newFiches.filter(f => !existing.has(f.ticket)), ...(result||[])];
  })();

  const filtered = allFiches.filter(f =>
    !search || [f.ticket,f.agent,f.tirage,f.posId,f.posNom]
      .some(v => String(v||'').toLowerCase().includes(search.toLowerCase()))
  );
  const paginated  = filtered.slice(page * PER_PAGE, (page+1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const totalVente = filtered.reduce((s,f) => s + parseFloat(f.vente||f.total||0), 0);
  const totalJwe   = filtered.filter(f => f.statut === 'gagnant').length;

  // Rezime pa ajan
  const ajanMap = filtered.reduce((acc, f) => {
    const key = f.agent || '—';
    if (!acc[key]) acc[key] = { nom:key, posId:f.posId||'—', count:0, total:0, fiches:[] };
    acc[key].count++;
    acc[key].total += parseFloat(f.vente||f.total||0);
    acc[key].fiches.push(f);
    return acc;
  }, {});

  return (
    <Layout>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'0 4px' }}>

        {/* BANNIÈRE */}
        <div style={{ background:'linear-gradient(135deg,#1a73e8,#0d47a1)',
          borderRadius:12, padding:'12px 16px', marginBottom:12,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:14, color:'white' }}>📋 Fichè Vann</span>
          <span style={{ fontSize:11, color: wsConn?'#86efac':'#fca5a5', fontWeight:700 }}>
            {wsConn ? '🟢 Live' : '🔴 Hòs Liy'}
          </span>
        </div>

        {/* FILTRES */}
        <div style={{ background:'white', borderRadius:12, padding:14, marginBottom:12,
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            {[['📅 Debut',debut,setDebut],['📅 Fin',fin,setFin]].map(([l,v,s]) => (
              <div key={l}>
                <label style={{ display:'block', fontWeight:700, fontSize:11, marginBottom:4, color:'#555' }}>{l}</label>
                <input type="date" value={v} onChange={e => s(e.target.value)}
                  style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd',
                    borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:11, marginBottom:4, color:'#555' }}>🎯 Tiraj</label>
              <select value={tirage} onChange={e => setTirage(e.target.value)}
                style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13 }}>
                {TIRAGES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:11, marginBottom:4, color:'#16a34a' }}>👤 Ajan</label>
              <select value={filtreAjan} onChange={e => setFiltreAjan(e.target.value)}
                style={{ width:'100%', padding:'10px', border:'1.5px solid #16a34a', borderRadius:8, fontSize:13 }}>
                <option value="Tout">Tout Ajan</option>
                {agents.map(a => (
                  <option key={a._id||a.id} value={a.username}>
                    {a.prenom} {a.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            style={{ width:'100%', padding:'13px', background:loading?'#ccc':'#1a73e8',
              color:'white', border:'none', borderRadius:10, fontWeight:900,
              fontSize:15, cursor:loading?'not-allowed':'pointer' }}>
            {loading ? '⏳ Ap chaje...' : '🔍 Chèche Fichè'}
          </button>
        </div>

        {/* STATS */}
        {result !== null && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
            {[
              { v:filtered.length, l:'Total Fichè', c:'#1a73e8', icon:'🎫' },
              { v:`${totalVente.toFixed(0)}G`, l:'Total Vant', c:'#16a34a', icon:'💰' },
              { v:totalJwe, l:'Jwe', c:'#f59e0b', icon:'🏆' },
            ].map(st => (
              <div key={st.l} style={{ background:'white', borderRadius:10,
                padding:'12px 10px', borderLeft:`4px solid ${st.c}`,
                boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize:16, marginBottom:2 }}>{st.icon}</div>
                <div style={{ fontWeight:900, fontSize:18, color:st.c }}>{st.v}</div>
                <div style={{ fontSize:10, color:'#888', fontWeight:700 }}>{st.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* LIVE */}
        {newFiches.length > 0 && (
          <div style={{ background:'#f0fdf4', border:'2px solid #16a34a',
            borderRadius:10, padding:12, marginBottom:12 }}>
            <div style={{ fontWeight:800, fontSize:12, color:'#16a34a', marginBottom:8 }}>
              🔴 LIVE — {newFiches.length} nouvèl fich:
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {newFiches.slice(0,6).map((f,i) => (
                <div key={i} onClick={() => openFich(f)}
                  style={{ background:'white', border:'1px solid #bbf7d0',
                    borderRadius:8, padding:'8px 12px', cursor:'pointer', minWidth:120 }}>
                  <div style={{ fontWeight:900, color:'#f59e0b', fontFamily:'monospace', fontSize:12 }}>{f.ticket}</div>
                  <div style={{ color:'#555', fontSize:11 }}>{f.agent}</div>
                  <div style={{ color:'#16a34a', fontWeight:700, fontSize:12 }}>{f.total}G</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result !== null && (
          <div style={{ background:'white', borderRadius:12, padding:14,
            boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>

            {/* VUE TABS */}
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              {[['liste','📋 Pa Fich'],['ajan','👤 Pa Ajan']].map(([k,l]) => (
                <button key={k} onClick={() => setVue(k)}
                  style={{ flex:1, padding:'10px 0', border:'none', borderRadius:8,
                    fontWeight:700, fontSize:13, cursor:'pointer',
                    background: vue===k?'#1a73e8':'#f3f4f6',
                    color: vue===k?'white':'#555' }}>
                  {l}
                </button>
              ))}
            </div>

            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="🔍 ticket, ajan, POS..."
              style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                borderRadius:8, fontSize:13, marginBottom:12, boxSizing:'border-box' }} />

            {/* ── LISTE PA FICH ── */}
            {vue === 'liste' && (
              <div>
                {paginated.length === 0
                  ? <div style={{ textAlign:'center', padding:'32px 0', color:'#888' }}>
                      Pa gen fichè — klike Chèche
                    </div>
                  : paginated.map((f, i) => {
                    const isNew = newFiches.some(n => n.ticket === f.ticket);
                    return (
                      <div key={f.ticket||i} onClick={() => openFich(f)}
                        style={{ borderRadius:10, padding:'12px 14px', marginBottom:8,
                          border: isNew ? '2px solid #16a34a' : '1px solid #e5e7eb',
                          background: isNew ? '#f0fdf4' : 'white',
                          cursor:'pointer', position:'relative' }}>
                        {isNew && (
                          <span style={{ position:'absolute', top:8, right:8,
                            background:'#16a34a', color:'white', borderRadius:8,
                            padding:'1px 7px', fontSize:10, fontWeight:800 }}>LIVE</span>
                        )}
                        <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'center', marginBottom:5 }}>
                          <span style={{ fontWeight:900, fontFamily:'monospace',
                            fontSize:15, color:'#f59e0b' }}>#{f.ticket||'—'}</span>
                          <span style={{ fontWeight:900, fontSize:16, color:'#16a34a' }}>
                            {parseFloat(f.vente||f.total||0).toFixed(0)}G
                          </span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between',
                          alignItems:'center', marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>
                            👤 {f.agent||'—'}
                          </span>
                          <span style={{ fontSize:12, color:'#6b7280' }}>{f.tirage||'—'}</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:11, color:'#9ca3af' }}>
                            {f.heure || fmtDate(f.date)}
                          </span>
                          <StatutBadge s={f.statut} />
                        </div>
                      </div>
                    );
                  })
                }

                {filtered.length > 0 && (
                  <div style={{ background:'#0f172a', borderRadius:10,
                    padding:'12px 16px', display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginTop:4, marginBottom:12 }}>
                    <span style={{ color:'#94a3b8', fontWeight:700, fontSize:13 }}>
                      {filtered.length} fichè total
                    </span>
                    <span style={{ color:'#f59e0b', fontWeight:900, fontSize:18 }}>
                      {totalVente.toFixed(0)} G
                    </span>
                  </div>
                )}

                {totalPages > 1 && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                    <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0}
                      style={{ flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:8,
                        background:'white', cursor:page===0?'default':'pointer',
                        color:page===0?'#ccc':'#333', fontWeight:700 }}>← Anvan</button>
                    <span style={{ padding:'10px 16px', background:'#1a73e8', color:'white',
                      borderRadius:8, fontWeight:700, fontSize:13 }}>{page+1} / {totalPages}</span>
                    <button onClick={() => setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                      style={{ flex:1, padding:'10px', border:'1px solid #ddd', borderRadius:8,
                        background:'white', cursor:page>=totalPages-1?'default':'pointer',
                        color:page>=totalPages-1?'#ccc':'#333', fontWeight:700 }}>Suiv →</button>
                  </div>
                )}
              </div>
            )}

            {/* ── VUE PA AJAN ── */}
            {vue === 'ajan' && (
              <div>
                {Object.values(ajanMap).length === 0
                  ? <div style={{ textAlign:'center', padding:'32px 0', color:'#888' }}>Pa gen done</div>
                  : Object.values(ajanMap).sort((a,b) => b.total-a.total).map(aj => (
                    <div key={aj.nom} onClick={() => setSelAjan(aj)}
                      style={{ borderRadius:10, padding:'14px', marginBottom:10,
                        border:'1px solid #e5e7eb', background:'white', cursor:'pointer' }}>
                      <div style={{ display:'flex', justifyContent:'space-between',
                        alignItems:'center', marginBottom:5 }}>
                        <span style={{ fontWeight:900, fontSize:15, color:'#1e293b' }}>
                          👤 {aj.nom}
                        </span>
                        <span style={{ fontWeight:900, fontSize:17, color:'#16a34a' }}>
                          {aj.total.toFixed(0)} G
                        </span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:11, color:'#6b7280' }}>POS: {aj.posId}</span>
                        <span style={{ background:'#eff6ff', color:'#1a73e8',
                          borderRadius:20, padding:'2px 10px', fontSize:12, fontWeight:700 }}>
                          {aj.count} fichè
                        </span>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          MODAL DETAY FICH — boul egzak jan yo vann
      ═══════════════════════════════════════════════ */}
      {selFich && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setSelFich(null)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0',
            width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3,
              margin:'12px auto 0' }} />

            {/* Header nwa */}
            <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)',
              padding:'14px 18px', marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ color:'white', fontWeight:900, fontSize:18, fontFamily:'monospace' }}>
                    #{selFich.ticket}
                  </div>
                  <div style={{ color:'#94a3b8', fontSize:11, marginTop:3 }}>
                    👤 {selFich.agent||'—'} · 🖥️ {selFich.posId||'—'}
                  </div>
                  <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>
                    🎯 {selFich.tirage||'—'} · {selFich.heure || fmtDate(selFich.date)}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:'#f59e0b', fontWeight:900, fontSize:22 }}>
                    {parseFloat(selFich.vente||selFich.total||0).toFixed(0)}G
                  </div>
                  <StatutBadge s={selFich.statut} />
                </div>
              </div>
            </div>

            <div style={{ padding:'16px 18px 36px' }}>

              {/* ── BOUL YO — egzak jan yo te vann ── */}
              <div style={{ marginBottom:18 }}>
                <div style={{ fontWeight:900, fontSize:14, marginBottom:10, color:'#111',
                  display:'flex', alignItems:'center', gap:8 }}>
                  🎯 Boul jwe yo
                  {loadingRows && (
                    <span style={{ fontSize:11, color:'#1a73e8', fontWeight:700 }}>
                      ⏳ Ap chaje...
                    </span>
                  )}
                </div>

                {(!selFich.rows || selFich.rows.length === 0) && !loadingRows
                  ? <div style={{ background:'#f8f9fa', borderRadius:8, padding:16,
                      textAlign:'center', color:'#888', fontSize:13 }}>
                      Pa gen boul — done pa disponib
                    </div>
                  : <>
                      {/* Entete */}
                      <div style={{ display:'grid', gridTemplateColumns:'2.5fr 2fr 1.5fr',
                        background:'#0f172a', borderRadius:'10px 10px 0 0',
                        padding:'9px 14px' }}>
                        {['TIP JEU','BOUL','MISE'].map(h => (
                          <span key={h} style={{ color:'#94a3b8', fontWeight:900,
                            fontSize:11, letterSpacing:0.8 }}>{h}</span>
                        ))}
                      </div>

                      {/* Rows */}
                      {(selFich.rows||[]).map((r, i) => (
                        <div key={i} style={{ display:'grid',
                          gridTemplateColumns:'2.5fr 2fr 1.5fr',
                          padding:'11px 14px',
                          background: i%2===0 ? '#f8faff' : 'white',
                          borderBottom:'1px solid #e5e7eb',
                          borderLeft:'1px solid #e5e7eb',
                          borderRight:'1px solid #e5e7eb' }}>
                          {/* Type */}
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ width:8, height:8, borderRadius:'50%',
                              background: TYPE_COLORS[r.type]||'#999',
                              display:'inline-block', flexShrink:0 }} />
                            <span style={{ fontSize:12, fontWeight:800,
                              color: TYPE_COLORS[r.type]||'#555' }}>
                              {TYPE_LABELS[r.type]||r.type||'—'}
                            </span>
                          </div>
                          {/* Boul */}
                          <span style={{ fontFamily:'monospace', fontWeight:900,
                            fontSize:17, color:'#111', letterSpacing:1.5 }}>
                            {r.boule||r.numero||'—'}
                          </span>
                          {/* Mise */}
                          <span style={{ fontWeight:800, fontSize:14,
                            color: r.gratuit?'#dc2626':'#16a34a' }}>
                            {r.gratuit ? 'GRATUI' : `${r.mise||r.montant||0}G`}
                          </span>
                        </div>
                      ))}

                      {/* Total */}
                      <div style={{ display:'grid', gridTemplateColumns:'2.5fr 2fr 1.5fr',
                        padding:'11px 14px', background:'#0f172a',
                        borderRadius:'0 0 10px 10px' }}>
                        <span style={{ color:'white', fontWeight:900, fontSize:13,
                          gridColumn:'1/3' }}>TOTAL MISE:</span>
                        <span style={{ color:'#f59e0b', fontWeight:900, fontSize:17 }}>
                          {parseFloat(selFich.vente||selFich.total||0).toFixed(0)}G
                        </span>
                      </div>
                    </>
                }
              </div>

              {/* AKSYON ADMIN */}
              {selFich.statut !== 'elimine' && (
                <div style={{ borderTop:'1.5px solid #f0f0f0', paddingTop:14 }}>
                  <div style={{ fontSize:12, color:'#888', fontWeight:700, marginBottom:10 }}>
                    ⚡ Aksyon Admin
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <button disabled={actioning}
                      onClick={() => doAction('elimine', selFich)}
                      style={{ padding:'13px', background:'#dc2626', color:'white',
                        border:'none', borderRadius:10, fontWeight:800, cursor:'pointer',
                        fontSize:14, opacity:actioning?0.6:1 }}>
                      🗑️ Elimine
                    </button>
                    <button disabled={actioning}
                      onClick={() => doAction(
                        selFich.statut==='bloke' ? 'debloke' : 'bloke', selFich
                      )}
                      style={{ padding:'13px',
                        background: selFich.statut==='bloke' ? '#16a34a' : '#f59e0b',
                        color:'white', border:'none', borderRadius:10, fontWeight:800,
                        cursor:'pointer', fontSize:14, opacity:actioning?0.6:1 }}>
                      {selFich.statut==='bloke' ? '🔓 Debloke' : '🔒 Bloke'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          MODAL DETAY AJAN — tout fich li + boul chak fich
      ═══════════════════════════════════════════════ */}
      {selAjan && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setSelAjan(null)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0',
            width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3,
              margin:'12px auto 0' }} />

            {/* Header ajan */}
            <div style={{ background:'linear-gradient(135deg,#16a34a,#14532d)',
              padding:'14px 18px', marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ color:'white', fontWeight:900, fontSize:18 }}>
                    👤 {selAjan.nom}
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginTop:3 }}>
                    POS: {selAjan.posId} · {selAjan.count} fichè
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:'#fef9c3', fontWeight:900, fontSize:24 }}>
                    {selAjan.total.toFixed(0)}G
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>Total Vant</div>
                </div>
              </div>
            </div>

            <div style={{ padding:'16px 18px 40px' }}>
              {selAjan.fiches.map((f, i) => (
                <div key={f.ticket||i}
                  onClick={() => { setSelAjan(null); setTimeout(() => openFich(f), 100); }}
                  style={{ borderRadius:10, padding:'12px 14px', marginBottom:10,
                    border:'1px solid #e5e7eb', background:'white', cursor:'pointer' }}>

                  {/* Ticket + Total */}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:5 }}>
                    <span style={{ fontWeight:900, fontFamily:'monospace',
                      fontSize:14, color:'#f59e0b' }}>#{f.ticket}</span>
                    <span style={{ fontWeight:900, fontSize:15, color:'#16a34a' }}>
                      {parseFloat(f.vente||f.total||0).toFixed(0)}G
                    </span>
                  </div>

                  {/* Tiraj + Dat */}
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:7 }}>
                    <span style={{ fontSize:12, color:'#374151', fontWeight:700 }}>{f.tirage||'—'}</span>
                    <span style={{ fontSize:11, color:'#9ca3af' }}>{f.heure || fmtDate(f.date)}</span>
                  </div>

                  {/* Boul preview — chak boul yon chip */}
                  {(f.rows||[]).length > 0 ? (
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:7 }}>
                      {(f.rows||[]).map((r, j) => (
                        <div key={j} style={{ background:'#f1f5f9', borderRadius:8,
                          padding:'4px 8px', display:'flex', alignItems:'center', gap:4,
                          border:`1px solid ${TYPE_COLORS[r.type]||'#ddd'}20` }}>
                          <span style={{ fontSize:9, fontWeight:800,
                            color: TYPE_COLORS[r.type]||'#555',
                            textTransform:'uppercase' }}>
                            {TYPE_LABELS[r.type]||r.type}
                          </span>
                          <span style={{ fontFamily:'monospace', fontWeight:900,
                            fontSize:14, color:'#111' }}>
                            {r.boule||r.numero}
                          </span>
                          <span style={{ fontSize:11, fontWeight:700,
                            color: r.gratuit?'#dc2626':'#16a34a' }}>
                            {r.gratuit ? 'G' : `${r.mise||0}G`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize:11, color:'#ccc', marginBottom:7 }}>
                      Tap pou wè boul yo →
                    </div>
                  )}

                  <StatutBadge s={f.statut} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
