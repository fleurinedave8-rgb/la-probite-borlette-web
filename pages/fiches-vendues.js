/**
 * fiches-vendues.js — Paj Fiches Vendues (Admin)
 * - Tout fiches an jeneral
 * - Filtre pa ajan
 * - Detay fich + elimine + bloke
 */
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useRouter } from 'next/router';

const TYPE_COLORS = { P0:'#16a34a', P1:'#1a73e8', P2:'#7c3aed', P3:'#f59e0b', MAR:'#dc2626', L4:'#0891b2' };
const TYPE_LABELS = { P0:'Borlette', P1:'Loto3-P1', P2:'Loto3-P2', P3:'Loto3-P3', MAR:'Mariage', L4:'Loto 4' };

function fmt(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d)) return str;
  const p = n => String(n).padStart(2,'0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function FichesVendues() {
  const router = useRouter();
  const [tab,       setTab]       = useState('general'); // 'general' | 'agent'
  const [fiches,    setFiches]    = useState([]);
  const [agents,    setAgents]    = useState([]);
  const [selAgent,  setSelAgent]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [selFiche,  setSelFiche]  = useState(null);
  const [detailRows,setDetailRows]= useState([]);
  const [loadDetail,setLoadDetail]= useState(false);
  const [actioning, setActioning] = useState(false);
  const [msg,       setMsg]       = useState('');
  const [debut,     setDebut]     = useState('');
  const [fin,       setFin]       = useState('');

  useEffect(() => {
    // Default: jodi a
    const today = new Date();
    const p = n => String(n).padStart(2,'0');
    const iso = d => `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
    setDebut(iso(today));
    setFin(iso(today));
    loadAgents();
  }, []);

  useEffect(() => {
    if (debut && fin) loadFiches();
  }, [tab, selAgent, debut, fin]);

  const loadAgents = async () => {
    try {
      const r = await api.get('/api/admin/agents');
      setAgents(r.data || []);
    } catch {}
  };

  const loadFiches = async () => {
    setLoading(true);
    setFiches([]);
    try {
      if (tab === 'agent' && selAgent) {
        const r = await api.get(`/api/admin/fiches-agent/${selAgent._id || selAgent.id}?debut=${debut}&fin=${fin}`);
        setFiches(r.data.fiches || []);
      } else if (tab === 'general') {
        const r = await api.get(`/api/admin/fiches?debut=${debut}&fin=${fin}`);
        setFiches(r.data.fiches || []);
      }
    } catch { setFiches([]); }
    setLoading(false);
  };

  const openDetail = async (fiche) => {
    setSelFiche(fiche);
    setDetailRows([]);
    setLoadDetail(true);
    try {
      const r = await api.get(`/api/admin/fiches/${fiche.ticket}/rows`);
      setDetailRows(r.data.rows || fiche.rows || []);
    } catch {
      setDetailRows(fiche.rows || []);
    }
    setLoadDetail(false);
  };

  const doAction = async (action) => {
    if (!selFiche) return;
    const confirmed = confirm(`${action === 'elimine' ? 'Elimine' : 'Bloke'} fich #${selFiche.ticket}?`);
    if (!confirmed) return;
    setActioning(true);
    try {
      await api.put(`/api/admin/fiches/${selFiche.ticket}/${action}`);
      setMsg(`✅ Fich ${action === 'elimine' ? 'elimine' : 'bloke'} ak siksè!`);
      setSelFiche(null);
      await loadFiches();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setMsg('❌ Erè: ' + (e.response?.data?.message || e.message));
    }
    setActioning(false);
  };

  const statutStyle = (st) => ({
    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
    background: st==='gagnant'?'#fef3c7': st==='elimine'?'#fee2e2': st==='bloke'?'#f3f4f6':'#f0fdf4',
    color: st==='gagnant'?'#92400e': st==='elimine'?'#dc2626': st==='bloke'?'#374151':'#15803d',
  });

  const totalVente = fiches.reduce((t,f) => t + (parseFloat(f.total||0)), 0);

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* TITRE */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ background:'#1a73e8', borderRadius:10, padding:'8px 16px' }}>
            <span style={{ color:'white', fontWeight:900, fontSize:16 }}>🎫 Fiches Vendues</span>
          </div>
          <span style={{ color:'#888', fontSize:13 }}>{fiches.length} fich — {totalVente.toFixed(0)} HTG</span>
        </div>

        {/* MESSAGE */}
        {msg && (
          <div style={{ background: msg.startsWith('✅')?'#dcfce7':'#fee2e2',
            border:`1px solid ${msg.startsWith('✅')?'#16a34a':'#dc2626'}`,
            borderRadius:8, padding:12, marginBottom:12, fontWeight:700,
            color: msg.startsWith('✅')?'#16a34a':'#dc2626' }}>
            {msg}
          </div>
        )}

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[['general','📋 Tout Fiches'],['agent','👤 Pa Ajan']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding:'8px 20px', borderRadius:20, border:`1.5px solid ${tab===k?'#1a73e8':'#ddd'}`,
                background: tab===k?'#1a73e8':'white', color: tab===k?'white':'#555',
                fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {l}
            </button>
          ))}
        </div>

        {/* FILTRE AJAN (si tab=agent) */}
        {tab === 'agent' && (
          <div style={{ background:'#eff6ff', borderRadius:10, padding:14, marginBottom:14,
            border:'1.5px solid #bfdbfe' }}>
            <label style={{ fontWeight:700, fontSize:13, color:'#1a73e8', display:'block', marginBottom:8 }}>
              👤 Chwazi Ajan:
            </label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {agents.map(a => (
                <button key={a._id||a.id} onClick={() => setSelAgent(a)}
                  style={{ padding:'6px 16px', borderRadius:20, border:`1.5px solid ${selAgent?._id===a._id?'#1a73e8':'#ddd'}`,
                    background: selAgent?._id===a._id?'#1a73e8':'white',
                    color: selAgent?._id===a._id?'white':'#333',
                    fontWeight:600, cursor:'pointer', fontSize:12 }}>
                  {a.prenom||''} {a.nom||''} ({a.username})
                </button>
              ))}
              {agents.length === 0 && <span style={{ color:'#888', fontSize:12 }}>Ap chaje ajan yo...</span>}
            </div>
          </div>
        )}

        {/* FILTRE DAT */}
        <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
          <input type="date" value={debut} onChange={e => setDebut(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid #ddd', fontSize:13, fontWeight:600 }}/>
          <span style={{ color:'#888', fontWeight:700 }}>→</span>
          <input type="date" value={fin} onChange={e => setFin(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid #ddd', fontSize:13, fontWeight:600 }}/>
          <button onClick={loadFiches}
            style={{ padding:'8px 18px', background:'#1a73e8', color:'white', border:'none',
              borderRadius:8, fontWeight:700, cursor:'pointer' }}>
            🔍 Filtre
          </button>
        </div>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
          {[
            ['🎫 Fiches', fiches.length, '#1a73e8'],
            ['💰 Total', `${totalVente.toFixed(0)} G`, '#16a34a'],
            ['🏆 Gagnant', fiches.filter(f=>f.statut==='gagnant').length, '#f59e0b'],
            ['❌ Elimine', fiches.filter(f=>f.statut==='elimine').length, '#dc2626'],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:'white', borderRadius:10, padding:'12px 16px',
              borderTop:`3px solid ${c}`, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:18, fontWeight:900, color:c }}>{v}</div>
              <div style={{ fontSize:11, color:'#888', fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* TABLEAU */}
        <div style={{ background:'white', borderRadius:10, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          {loading
            ? <div style={{ padding:40, textAlign:'center', color:'#999' }}>⏳ Ap chaje...</div>
            : fiches.length === 0
            ? <div style={{ padding:40, textAlign:'center', color:'#bbb' }}>Okenn fich pou peryòd sa a</div>
            : <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#111' }}>
                    {['Ticket','Tiraj','Ajan','POS','Total','Statut','Dat',''].map(h => (
                      <th key={h} style={{ padding:'10px 12px', color:'white', fontWeight:800,
                        fontSize:11, textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fiches.map((f, i) => (
                    <tr key={f.ticket||i}
                      style={{ background: i%2===0?'white':'#fafafa',
                        transition:'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = i%2===0?'white':'#fafafa'}>
                      <td style={{ padding:'10px 12px', fontWeight:700, color:'#1a73e8',
                        fontSize:13, fontFamily:'monospace' }}>#{f.ticket}</td>
                      <td style={{ padding:'10px 12px', fontSize:12, color:'#555' }}>{f.tirage||'—'}</td>
                      <td style={{ padding:'10px 12px', fontSize:12 }}>{f.agent||'—'}</td>
                      <td style={{ padding:'10px 12px', fontSize:11, color:'#888', fontFamily:'monospace' }}>{f.posId||'—'}</td>
                      <td style={{ padding:'10px 12px', fontWeight:700, color:'#16a34a' }}>{f.total||0}G</td>
                      <td style={{ padding:'10px 12px' }}><span style={statutStyle(f.statut)}>{f.statut||'actif'}</span></td>
                      <td style={{ padding:'10px 12px', fontSize:11, color:'#888' }}>{fmt(f.date)}</td>
                      <td style={{ padding:'10px 12px' }}>
                        <button onClick={() => openDetail(f)}
                          style={{ padding:'4px 12px', background:'#1a73e8', color:'white',
                            border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:11 }}>
                          Detay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* ─── MODAL DETAY FICH ─── */}
        {selFiche && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}>
            <div style={{ background:'white', borderRadius:'20px 20px 0 0', padding:28,
              width:'100%', maxWidth:560, maxHeight:'85vh', overflowY:'auto' }}>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <span style={{ fontWeight:900, fontSize:18, fontFamily:'monospace', color:'#1a73e8' }}>
                  #{selFiche.ticket}
                </span>
                <button onClick={() => setSelFiche(null)}
                  style={{ background:'#f3f4f6', border:'none', borderRadius:'50%',
                    width:32, height:32, cursor:'pointer', fontWeight:700, fontSize:16 }}>✕</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  ['Tiraj', selFiche.tirage],
                  ['Ajan', selFiche.agent],
                  ['POS', selFiche.posId],
                  ['Dat', fmt(selFiche.date)],
                  ['Statut', selFiche.statut||'actif'],
                  ['Total', `${selFiche.total||0} HTG`],
                ].map(([l,v]) => (
                  <div key={l} style={{ background:'#f9f9f9', borderRadius:8, padding:'8px 12px' }}>
                    <div style={{ fontSize:10, color:'#888', fontWeight:700 }}>{l}</div>
                    <div style={{ fontSize:13, fontWeight:800, marginTop:2 }}>{v||'—'}</div>
                  </div>
                ))}
              </div>

              {/* ROWS */}
              <div style={{ background:'#f9f9f9', borderRadius:10, overflow:'hidden', marginBottom:14 }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#111' }}>
                      <th style={{ padding:'8px 12px', color:'white', fontWeight:800, fontSize:11, textAlign:'left' }}>TYPE</th>
                      <th style={{ padding:'8px 12px', color:'white', fontWeight:800, fontSize:11, textAlign:'left' }}>BOUL</th>
                      <th style={{ padding:'8px 12px', color:'white', fontWeight:800, fontSize:11, textAlign:'right' }}>MISE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadDetail
                      ? <tr><td colSpan={3} style={{ textAlign:'center', padding:16, color:'#999' }}>⏳</td></tr>
                      : (detailRows||[]).map((r,i) => (
                          <tr key={i} style={{ background: i%2===0?'white':'#fafafa' }}>
                            <td style={{ padding:'8px 12px', fontWeight:700, fontSize:12,
                              color: TYPE_COLORS[r.type]||'#333' }}>
                              {TYPE_LABELS[r.type]||r.type}
                            </td>
                            <td style={{ padding:'8px 12px', fontFamily:'monospace', fontWeight:900, fontSize:15 }}>
                              {r.boule||r.numero||'—'}
                            </td>
                            <td style={{ padding:'8px 12px', textAlign:'right', fontWeight:800,
                              color: r.gratuit?'#dc2626':'#16a34a' }}>
                              {r.gratuit ? 'GRATUI' : `${r.mise||0}G`}
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px',
                  background:'#111', color:'white' }}>
                  <span style={{ fontWeight:900 }}>TOTAL</span>
                  <span style={{ fontWeight:900, color:'#f59e0b', fontSize:16 }}>{selFiche.total||0} HTG</span>
                </div>
              </div>

              {/* AKSYON */}
              {selFiche.statut !== 'elimine' && selFiche.statut !== 'bloke' && (
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => doAction('elimine')} disabled={actioning}
                    style={{ flex:1, padding:12, background:actioning?'#ccc':'#dc2626', color:'white',
                      border:'none', borderRadius:10, fontWeight:800, cursor:'pointer', fontSize:13 }}>
                    ❌ Elimine Fich
                  </button>
                  <button onClick={() => doAction('bloke')} disabled={actioning}
                    style={{ flex:1, padding:12, background:actioning?'#ccc':'#374151', color:'white',
                      border:'none', borderRadius:10, fontWeight:800, cursor:'pointer', fontSize:13 }}>
                    🔒 Bloke Fich
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
