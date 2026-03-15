import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

// ── DONE EGZAK — PA MODIFYE ────────────────────────────────
const PRIMES_GENERAL = [
  { code:'20',  type:'Borlette',            prime:'60|20|10', cat:'general' },
  { code:'30',  type:'Loto 3',              prime:'500',      cat:'general' },
  { code:'40',  type:'Mariage',             prime:'1000',     cat:'general' },
  { code:'41',  type:'L401',               prime:'5000',     cat:'general' },
  { code:'42',  type:'L402',               prime:'5000',     cat:'general' },
  { code:'43',  type:'L403',               prime:'5000',     cat:'general' },
  { code:'51',  type:'L501',               prime:'25000',    cat:'general' },
  { code:'52',  type:'L502',               prime:'25000',    cat:'general' },
  { code:'53',  type:'L503',               prime:'25000',    cat:'general' },
  { code:'44',  type:'Mariage Gratuit',     prime:'2000',     cat:'general' },
  { code:'105', type:'Tet fich loto3 dwat', prime:'0',        cat:'general' },
  { code:'106', type:'Tet fich mariaj dwat',prime:'0',        cat:'general' },
  { code:'107', type:'Tet fich loto3 gauch',prime:'0',        cat:'general' },
  { code:'108', type:'Tet fich mariaj gauch',prime:'0',       cat:'general' },
];

const TIRAGES_LIST = [
  'Florida matin','Florida soir',
  'New-york matin','New-york soir',
  'Georgia-Matin','Georgia-Soir',
  'Ohio matin','Ohio soir',
  'Chicago matin','Chicago soir',
  'Maryland midi','Maryland soir',
  'Tennessee matin','Tennessee soir',
];

// Kalkil egzanp — "60|20|10" → [60,20,10]
function parsePrime(str) {
  return String(str||'0').split('|').map(Number);
}
function calcGain(mise, primeStr, position=1) {
  const parts = parsePrime(primeStr);
  const mult  = parts[position-1] || parts[0] || 0;
  return Number(mise) * mult;
}

export default function Primes() {
  const [tab,       setTab]      = useState('general');
  const [primes,    setPrimes]   = useState(PRIMES_GENERAL);
  const [loading,   setLoading]  = useState(true);
  const [saving,    setSaving]   = useState(false);
  const [msg,       setMsg]      = useState({ t:'', ok:true });

  // Onglet Par Tirage
  const [selTirage, setSelTirage]= useState('');
  const [tirageMap, setTirageMap]= useState({}); // { 'Florida matin': [...primes] }

  // Modal Modifier
  const [editing,   setEditing]  = useState(null);
  const [valEdit,   setValEdit]  = useState('');
  const [calcMise,  setCalcMise] = useState('10');

  // Menu déroulant Action
  const [menuOpen,  setMenuOpen] = useState(null);

  // Onglet Ajan Primes
  const [agents,    setAgents]   = useState([]);
  const [selAgent,  setSelAgent] = useState(null);
  const [agentPrimes,setAgentPrimes] = useState([]);
  const [agentSaving,setAgentSaving] = useState(false);
  const [agentEdit,  setAgentEdit]   = useState(null);
  const [agentVal,   setAgentVal]    = useState('');

  useEffect(() => {
    // Chaje primes global
    api.get('/api/admin/primes').then(r => {
      if (Array.isArray(r.data) && r.data.length > 0) {
        setPrimes(r.data.filter(p => (p.cat||'general')==='general'));
        // Rekonstwi tirageMap
        const tm = {};
        r.data.filter(p => p.cat==='tirage').forEach(p => {
          const t = p.tirage || 'Autre';
          if (!tm[t]) tm[t] = [];
          tm[t].push(p);
        });
        setTirageMap(tm);
      }
    }).catch(()=>{}).finally(()=>setLoading(false));

    // Chaje ajan yo
    api.get('/api/admin/agents').then(r => {
      setAgents(Array.isArray(r.data)?r.data:[]);
    }).catch(()=>{});
  }, []);

  const notify = (t, ok=true) => { setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3500); };

  // Sove primes global + tirage
  const saveAll = async (newGeneral, newTirageMap) => {
    const g  = (newGeneral||primes).map(p=>({...p,cat:'general'}));
    const tv = [];
    Object.entries(newTirageMap||tirageMap).forEach(([tirage,list]) => {
      list.forEach(p => tv.push({...p, cat:'tirage', tirage}));
    });
    try {
      await api.put('/api/admin/primes', [...g,...tv]);
      notify('✅ Sove avèk siksè!');
    } catch { notify('⚠️ Pa kapab sove', false); }
  };

  // Ouvri modal Modifier
  const openEdit = (p) => {
    setEditing(p); setValEdit(p.prime||'0'); setMenuOpen(null); setCalcMise('10');
  };

  const doSave = async () => {
    if (!valEdit.trim()) return;
    setSaving(true);
    let newGeneral = primes, newTirageMap = tirageMap;
    if (tab === 'general') {
      newGeneral = primes.map(p => p.code===editing.code ? {...p,prime:valEdit.trim()} : p);
      setPrimes(newGeneral);
    } else if (tab === 'tirage' && selTirage) {
      const updated = (tirageMap[selTirage]||[]).map(p =>
        p.code===editing.code ? {...p,prime:valEdit.trim()} : p
      );
      newTirageMap = {...tirageMap, [selTirage]: updated};
      setTirageMap(newTirageMap);
    }
    await saveAll(newGeneral, newTirageMap);
    setSaving(false);
    setEditing(null);
  };

  // Init primes pou tiraj si pa gen
  const initTiragePrimes = (tirage) => {
    if (!tirageMap[tirage]) {
      const base = primes.map(p => ({...p, tirage, cat:'tirage',
        prime: p.prime, code: `${p.code}_${tirage.replace(/\s/g,'').slice(0,4)}`}));
      setTirageMap(prev => ({...prev, [tirage]: base}));
    }
  };

  const handleSelectTirage = (t) => {
    setSelTirage(t);
    if (t) initTiragePrimes(t);
  };

  // Ajan — chaje primes li
  const loadAgentPrimes = async (agent) => {
    setSelAgent(agent);
    try {
      const r = await api.get(`/api/admin/agents/${agent._id||agent.id}/primes`);
      setAgentPrimes(Array.isArray(r.data)&&r.data.length>0 ? r.data : JSON.parse(JSON.stringify(primes)));
    } catch { setAgentPrimes(JSON.parse(JSON.stringify(primes))); }
  };

  const saveAgentPrimes = async () => {
    if (!selAgent) return;
    setAgentSaving(true);
    try {
      await api.put(`/api/admin/agents/${selAgent._id||selAgent.id}/primes`, agentPrimes);
      notify(`✅ Primes ${selAgent.username} sove!`);
    } catch { notify('❌ Erè', false); }
    setAgentSaving(false);
  };

  const TABS = [
    { key:'general', label:'Général',               color:'#1a73e8' },
    { key:'tirage',  label:'Par Tirage',             color:'#16a34a' },
    { key:'paire',   label:'Boule paire et grappe',  color:'#ca8a04' },
    { key:'ajan',    label:'👤 Primes pa Ajan',       color:'#7c3aed' },
  ];

  // Primes pou onglet Boule Paire (subset defòlt)
  const pairePrimes = [
    { code:'BP1', type:'Boule Pè (ex: 00,11,22...)', prime:'10',   cat:'paire' },
    { code:'BP2', type:'Grappe 3 Boul',               prime:'100',  cat:'paire' },
    { code:'BP3', type:'Grappe 4 Boul',               prime:'500',  cat:'paire' },
    { code:'BP4', type:'Grappe 5 Boul',               prime:'2000', cat:'paire' },
  ];

  const currentRows = tab==='general' ? primes
    : tab==='tirage' ? (selTirage ? (tirageMap[selTirage]||[]) : [])
    : tab==='paire'  ? pairePrimes
    : [];

  // Kalkil demo pou modal
  const gainCalc = editing ? calcGain(calcMise||0, valEdit||editing.prime, 1) : 0;
  const gain2    = editing ? calcGain(calcMise||0, valEdit||editing.prime, 2) : 0;
  const gain3    = editing ? calcGain(calcMise||0, valEdit||editing.prime, 3) : 0;
  const hasParts = editing ? (valEdit||'').includes('|') : false;

  return (
    <Layout>
      <div style={{ maxWidth:920, margin:'0 auto', padding:'0 8px 40px' }}
        onClick={() => menuOpen && setMenuOpen(null)}>

        {/* ── BANNIÈRE JÒNN ── */}
        <div style={{ background:'#f59e0b', borderRadius:12,
          padding:'12px 20px', marginBottom:16, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:16, color:'#111',
            letterSpacing:1 }}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        {/* ── TITRE ── */}
        <h1 style={{ fontSize:26, fontWeight:900, color:'#111',
          margin:'0 0 20px' }}>
          Primes
        </h1>

        {/* ── NOTIF ── */}
        {msg.t && (
          <div style={{ background:msg.ok?'#dcfce7':'#fef9c3',
            border:`1px solid ${msg.ok?'#16a34a':'#ca8a04'}`,
            color:msg.ok?'#166534':'#854d0e',
            padding:'10px 16px', borderRadius:8,
            marginBottom:14, fontWeight:700 }}>
            {msg.t}
          </div>
        )}

        {/* ── ONGLETS ── */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding:'10px 18px', borderRadius:8, border:'none',
                background: tab===t.key ? t.color : '#e5e7eb',
                color: tab===t.key ? 'white' : '#374151',
                fontWeight:700, fontSize:13, cursor:'pointer',
                transition:'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SÈLEKTÈ TIRAJ (Par Tirage tab) ── */}
        {tab === 'tirage' && (
          <div style={{ background:'white', borderRadius:10, padding:16,
            boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16 }}>
            <label style={{ display:'block', fontWeight:700, fontSize:13,
              color:'#555', marginBottom:8 }}>
              Chwazi Tiraj
            </label>
            <select value={selTirage} onChange={e=>handleSelectTirage(e.target.value)}
              style={{ width:'100%', padding:'11px 14px', border:'2px solid #16a34a',
                borderRadius:8, fontSize:14, fontWeight:700, color:'#111',
                background:'white', cursor:'pointer' }}>
              <option value="">— Chwazi yon tiraj —</option>
              {TIRAGES_LIST.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {!selTirage && (
              <div style={{ marginTop:10, color:'#888', fontSize:12, fontStyle:'italic' }}>
                Seleksyone yon tiraj pou wè ak modifye primes li yo
              </div>
            )}
          </div>
        )}

        {/* ── ONGLET AJAN ── */}
        {tab === 'ajan' ? (
          <div>
            {/* Chwazi ajan */}
            <div style={{ background:'white', borderRadius:10, padding:16,
              boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16 }}>
              <label style={{ display:'block', fontWeight:700, fontSize:13,
                color:'#555', marginBottom:8 }}>
                👤 Chwazi Ajan / POS
              </label>
              <select onChange={e => {
                  const a = agents.find(ag=>(ag._id||ag.id)===e.target.value);
                  if (a) loadAgentPrimes(a);
                }}
                style={{ width:'100%', padding:'11px 14px', border:'2px solid #7c3aed',
                  borderRadius:8, fontSize:14, fontWeight:700, color:'#111' }}>
                <option value="">— Chwazi ajan —</option>
                {agents.map(a => (
                  <option key={a._id||a.id} value={a._id||a.id}>
                    {a.username} — {a.prenom||''} {a.nom||''}
                  </option>
                ))}
              </select>
            </div>

            {selAgent && (
              <div style={{ background:'white', borderRadius:10,
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
                {/* Header */}
                <div style={{ background:'#7c3aed', padding:'12px 16px',
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'white', fontWeight:900, fontSize:14 }}>
                    Primes pou @{selAgent.username}
                  </span>
                  <button onClick={saveAgentPrimes} disabled={agentSaving}
                    style={{ background:'#f59e0b', color:'#111', border:'none',
                      borderRadius:8, padding:'7px 16px', fontWeight:800,
                      fontSize:13, cursor:'pointer' }}>
                    {agentSaving ? '⏳...' : '💾 Sove Primes Ajan'}
                  </button>
                </div>

                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                      {['Code','Type','Prime Ajan','Aksyon'].map(h => (
                        <th key={h} style={{ padding:'11px 14px', fontWeight:700,
                          fontSize:12, color:'#555', textAlign:'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agentPrimes.filter(p=>p.cat==='general'||!p.cat).map((p,i) => (
                      <tr key={p.code}
                        style={{ borderBottom:'1px solid #f0f0f0',
                          background:i%2===0?'white':'#fafafa' }}>
                        <td style={{ padding:'11px 14px', fontFamily:'monospace',
                          fontWeight:800, color:'#374151' }}>{p.code}</td>
                        <td style={{ padding:'11px 14px', fontWeight:600 }}>{p.type}</td>
                        <td style={{ padding:'11px 14px' }}>
                          {agentEdit===p.code ? (
                            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                              <input value={agentVal}
                                onChange={e=>setAgentVal(e.target.value)}
                                style={{ width:120, padding:'6px 10px',
                                  border:'2px solid #7c3aed', borderRadius:7,
                                  fontSize:14, fontWeight:700, fontFamily:'monospace' }} />
                              <button onClick={() => {
                                  setAgentPrimes(prev => prev.map(x =>
                                    x.code===p.code ? {...x,prime:agentVal} : x
                                  ));
                                  setAgentEdit(null);
                                }}
                                style={{ background:'#16a34a',color:'white',
                                  border:'none',borderRadius:6,padding:'6px 12px',
                                  fontWeight:700,cursor:'pointer',fontSize:12 }}>
                                ✓
                              </button>
                              <button onClick={()=>setAgentEdit(null)}
                                style={{ background:'#f3f4f6',color:'#555',
                                  border:'none',borderRadius:6,padding:'6px 8px',
                                  fontWeight:700,cursor:'pointer' }}>✕</button>
                            </div>
                          ) : (
                            <span style={{ fontWeight:800, fontSize:14, color:'#7c3aed' }}>
                              {p.prime}
                            </span>
                          )}
                        </td>
                        <td style={{ padding:'11px 14px' }}>
                          <button onClick={()=>{setAgentEdit(p.code);setAgentVal(p.prime);}}
                            style={{ background:'#1a73e8',color:'white',
                              border:'none',borderRadius:6,padding:'7px 14px',
                              fontWeight:700,cursor:'pointer',fontSize:12 }}>
                            ✏️ Modifier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Note kalkil */}
                <div style={{ background:'#f5f3ff', padding:'12px 16px',
                  borderTop:'1px solid #e5e7eb', fontSize:12, color:'#7c3aed',
                  fontWeight:700 }}>
                  ℹ️ Primes ajan sa pral remplace primes global pou li sèlman.
                  Lòt ajan ap kontinye itilize primes global yo.
                </div>
              </div>
            )}
          </div>

        ) : (
          /* ── TABLO PRIMES (Général / Par Tirage / Paire) ── */
          loading ? (
            <div style={{ background:'white', borderRadius:10, padding:48,
              textAlign:'center', color:'#888' }}>Chargement...</div>
          ) : (tab==='tirage' && !selTirage) ? null : (
            <div style={{ background:'white', borderRadius:10,
              boxShadow:'0 1px 4px rgba(0,0,0,0.09)', overflow:'visible' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                    {['Code','Type','Prime','Action'].map(h => (
                      <th key={h} style={{ padding:'12px 16px', fontWeight:700,
                        fontSize:12, color:'#555', textAlign:'left',
                        letterSpacing:0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding:32, textAlign:'center',
                      color:'#aaa', fontStyle:'italic' }}>
                      Pa gen primes pou seleksyon sa
                    </td></tr>
                  ) : currentRows.map((p, i) => (
                    <tr key={p.code}
                      style={{ borderBottom:'1px solid #f0f0f0',
                        background:i%2===0?'white':'#fafafa' }}>

                      <td style={{ padding:'12px 16px',
                        fontFamily:'monospace', fontWeight:800,
                        fontSize:14, color:'#374151' }}>
                        {p.code}
                      </td>

                      <td style={{ padding:'12px 16px',
                        fontWeight:600, fontSize:14, color:'#111' }}>
                        {p.type}
                      </td>

                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontWeight:800, fontSize:14, color:'#16a34a' }}>
                          {p.prime}
                        </span>
                      </td>

                      <td style={{ padding:'12px 16px', position:'relative' }}>
                        <button
                          onClick={e => { e.stopPropagation();
                            setMenuOpen(menuOpen===p.code?null:p.code); }}
                          style={{ background:'#1a73e8', color:'white', border:'none',
                            borderRadius:6, padding:'7px 16px', fontWeight:700,
                            fontSize:13, cursor:'pointer' }}>
                          Action ▾
                        </button>

                        {menuOpen === p.code && (
                          <div onClick={e=>e.stopPropagation()}
                            style={{ position:'absolute', top:'110%', left:0,
                              background:'white', borderRadius:8, zIndex:999,
                              boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
                              border:'1px solid #e5e7eb', minWidth:130,
                              overflow:'hidden' }}>
                            <button onClick={() => openEdit(p)}
                              style={{ width:'100%', padding:'11px 16px',
                                background:'none', border:'none', textAlign:'left',
                                fontWeight:700, fontSize:13, cursor:'pointer',
                                color:'#111', display:'block' }}
                              onMouseEnter={e=>e.currentTarget.style.background='#f0f0f0'}
                              onMouseLeave={e=>e.currentTarget.style.background='none'}>
                              ✏️ Modifier
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ════ MODAL MODIFIER ════ */}
        {editing && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
            zIndex:2000, display:'flex', alignItems:'center',
            justifyContent:'center', padding:20 }}
            onClick={() => setEditing(null)}>
            <div style={{ background:'white', borderRadius:16, padding:28,
              maxWidth:460, width:'100%' }}
              onClick={e=>e.stopPropagation()}>

              <div style={{ fontWeight:900, fontSize:18, marginBottom:4 }}>
                Modifier Prime
              </div>
              <div style={{ color:'#888', fontSize:13, marginBottom:18 }}>
                Code <strong>{editing.code}</strong> — {editing.type}
              </div>

              <label style={{ display:'block', fontWeight:700, fontSize:13,
                color:'#555', marginBottom:6 }}>
                Valeur de la prime
              </label>
              <input value={valEdit} onChange={e=>setValEdit(e.target.value)}
                autoFocus
                placeholder="ex: 60|20|10  ou  500"
                style={{ width:'100%', padding:'13px 16px',
                  border:'2px solid #1a73e8', borderRadius:8,
                  fontSize:16, fontWeight:700, fontFamily:'monospace',
                  boxSizing:'border-box', color:'#1a73e8' }} />

              {/* Fòmat eksplike */}
              <div style={{ background:'#eff6ff', borderRadius:8,
                padding:'10px 14px', marginTop:10, fontSize:12, color:'#1e40af' }}>
                <strong>Format:</strong> Yon sèl valè: <code>500</code> —
                Plizyè pozisyon: <code>1e|2e|3e</code> (ex: <code>60|20|10</code>)
              </div>

              {/* ── KALKIL OTOMATIK ── */}
              <div style={{ background:'#f0fdf4', borderRadius:10,
                padding:14, marginTop:14, border:'1px solid #bbf7d0' }}>
                <div style={{ fontWeight:800, fontSize:13, color:'#166534',
                  marginBottom:10 }}>
                  🧮 Kalkil Otomatik — Simulasyon
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <label style={{ fontSize:12, color:'#555', fontWeight:700,
                    flexShrink:0 }}>Mise (G):</label>
                  <input type="number" value={calcMise}
                    onChange={e=>setCalcMise(e.target.value)}
                    min="1"
                    style={{ width:80, padding:'7px 10px',
                      border:'1.5px solid #16a34a', borderRadius:7,
                      fontSize:14, fontWeight:700, textAlign:'right' }} />
                </div>
                <div style={{ display:'grid',
                  gridTemplateColumns: hasParts ? '1fr 1fr 1fr' : '1fr 1fr',
                  gap:8 }}>
                  <div style={{ background:'#dcfce7', borderRadius:8,
                    padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:'#166534',
                      fontWeight:700, marginBottom:3 }}>
                      {hasParts?'SI GENYEN (1e)':'SI GENYEN'}
                    </div>
                    <div style={{ fontSize:20, fontWeight:900, color:'#16a34a' }}>
                      {gainCalc.toLocaleString('fr')} G
                    </div>
                  </div>
                  {hasParts && (
                    <div style={{ background:'#fef9c3', borderRadius:8,
                      padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'#854d0e',
                        fontWeight:700, marginBottom:3 }}>SI GENYEN (2e)</div>
                      <div style={{ fontSize:20, fontWeight:900, color:'#ca8a04' }}>
                        {gain2.toLocaleString('fr')} G
                      </div>
                    </div>
                  )}
                  {hasParts && (
                    <div style={{ background:'#eff6ff', borderRadius:8,
                      padding:'10px', textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'#1e40af',
                        fontWeight:700, marginBottom:3 }}>SI GENYEN (3e)</div>
                      <div style={{ fontSize:20, fontWeight:900, color:'#1a73e8' }}>
                        {gain3.toLocaleString('fr')} G
                      </div>
                    </div>
                  )}
                  <div style={{ background:'#fee2e2', borderRadius:8,
                    padding:'10px', textAlign:'center',
                    gridColumn: hasParts ? '1 / -1' : 'auto' }}>
                    <div style={{ fontSize:10, color:'#991b1b',
                      fontWeight:700, marginBottom:3 }}>SI PEDI</div>
                    <div style={{ fontSize:20, fontWeight:900, color:'#dc2626' }}>
                      -{Number(calcMise||0).toLocaleString('fr')} G
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:18 }}>
                <button onClick={() => setEditing(null)}
                  style={{ flex:1, padding:'12px', background:'#f3f4f6',
                    border:'none', borderRadius:8, fontWeight:700,
                    cursor:'pointer', fontSize:14 }}>
                  Annuler
                </button>
                <button onClick={doSave} disabled={saving||!valEdit.trim()}
                  style={{ flex:2, padding:'12px',
                    background: saving ? '#ccc' : '#1a73e8',
                    color:'white', border:'none', borderRadius:8,
                    fontWeight:900, cursor:'pointer', fontSize:14 }}>
                  {saving ? '⏳...' : '✅ Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
