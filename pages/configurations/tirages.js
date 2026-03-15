import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const ETATS = ['Florida','New-York','Georgia','Ohio','Chicago','Maryland','Tennessee','Connecticut'];

const DEFOLT = [
  { nom:'Florida matin',   etat:'Florida',   ouverture:'10:00', fermeture:'10:30', actif:true },
  { nom:'Florida soir',    etat:'Florida',   ouverture:'21:00', fermeture:'21:30', actif:true },
  { nom:'New-york matin',  etat:'New-York',  ouverture:'12:29', fermeture:'12:30', actif:true },
  { nom:'New-york soir',   etat:'New-York',  ouverture:'22:30', fermeture:'23:00', actif:true },
  { nom:'Georgia-Matin',   etat:'Georgia',   ouverture:'12:29', fermeture:'12:30', actif:true },
  { nom:'Georgia-Soir',    etat:'Georgia',   ouverture:'18:00', fermeture:'18:30', actif:true },
  { nom:'Ohio matin',      etat:'Ohio',      ouverture:'10:30', fermeture:'11:00', actif:true },
  { nom:'Ohio soir',       etat:'Ohio',      ouverture:'22:00', fermeture:'22:30', actif:true },
  { nom:'Chicago matin',   etat:'Chicago',   ouverture:'09:00', fermeture:'09:30', actif:true },
  { nom:'Chicago soir',    etat:'Chicago',   ouverture:'20:00', fermeture:'20:30', actif:true },
  { nom:'Maryland midi',   etat:'Maryland',  ouverture:'13:00', fermeture:'13:30', actif:true },
  { nom:'Maryland soir',   etat:'Maryland',  ouverture:'19:00', fermeture:'19:30', actif:true },
  { nom:'Tennessee matin', etat:'Tennessee', ouverture:'11:00', fermeture:'11:30', actif:true },
  { nom:'Tennessee soir',  etat:'Tennessee', ouverture:'21:30', fermeture:'22:00', actif:true },
];

// Statut otomatik selon lè aktyèl
function statutAuto(t) {
  if (!t.ouverture || !t.fermeture) return 'unknown';
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = t.ouverture.split(':').map(Number);
  const [fh, fm] = t.fermeture.split(':').map(Number);
  const openM = oh * 60 + om;
  const closeM = fh * 60 + fm;
  if (nowM >= openM && nowM <= closeM) return 'ouvert';
  if (nowM > closeM) return 'ferme';
  return 'bientot';
}

// Statut final (manyèl priyorite sou oto)
function statutFinal(t) {
  if (t.ouvertManyel === true)  return 'ouvert';
  if (t.ferméManyel === true)   return 'ferme';
  if (!t.actif) return 'desaktive';
  return statutAuto(t);
}

const STATUT_CFG = {
  ouvert:    { label:'🟢 Ouvè',      bg:'#dcfce7', color:'#16a34a', border:'#bbf7d0' },
  ferme:     { label:'🔴 Fèmen',     bg:'#fee2e2', color:'#dc2626', border:'#fecaca' },
  bientot:   { label:'🟡 Byento',    bg:'#fef9c3', color:'#854d0e', border:'#fde68a' },
  desaktive: { label:'⚫ Dezaktive', bg:'#f3f4f6', color:'#6b7280', border:'#e5e7eb' },
};

export default function TiragesPage() {
  const [tab,     setTab]    = useState('statut');
  const [tirages, setTirages]= useState([]);
  const [loading, setLoading]= useState(true);
  const [now,     setNow]    = useState(new Date());
  const [msg,     setMsg]    = useState({ t:'', ok:true });
  const [showAdd, setShowAdd]= useState(false);
  const [form,    setForm]   = useState({ nom:'', etat:'Florida', ouverture:'10:00', fermeture:'10:30' });
  const [editing, setEditing]= useState(null);
  const [editForm,setEditForm]= useState({});
  const [saving,  setSaving] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/tirages');
      const data = Array.isArray(r.data) ? r.data : [];
      if (data.length === 0) {
        // Init avèk defòlt si vid
        for (const t of DEFOLT) {
          await api.post('/api/tirages', t).catch(() => {});
        }
        const r2 = await api.get('/api/tirages');
        setTirages(Array.isArray(r2.data) ? r2.data : DEFOLT);
      } else {
        setTirages(data);
      }
    } catch { setTirages(DEFOLT); }
    setLoading(false);
  };

  const notify = (t, ok=true) => { setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3000); };

  // ── TOGGLE AKTIF/INAKTIF ──
  const handleToggle = async (t) => {
    setSaving(t._id+'tog');
    try {
      await api.put(`/api/tirages/${t._id}`, { actif: !t.actif });
      await load();
      notify(`✅ ${t.nom} ${!t.actif ? 'aktive' : 'dezaktive'}`);
    } catch { notify('❌ Erè', false); }
    setSaving('');
  };

  // ── OUVRI MANYÈL ──
  const handleOuvri = async (t) => {
    setSaving(t._id+'ouv');
    try {
      await api.put(`/api/tirages/${t._id}/ouvri`);
      await load();
      notify(`🟢 ${t.nom} — OUVRI pa admin`);
    } catch { notify('❌ Erè', false); }
    setSaving('');
  };

  // ── FÈMEN MANYÈL ──
  const handleFemen = async (t) => {
    setSaving(t._id+'fem');
    try {
      await api.put(`/api/tirages/${t._id}/femen`);
      await load();
      notify(`🔴 ${t.nom} — FÈMEN pa admin`);
    } catch { notify('❌ Erè', false); }
    setSaving('');
  };

  // ── RETOUNEN OTOMATIK ──
  const handleAuto = async (t) => {
    setSaving(t._id+'aut');
    try {
      await api.put(`/api/tirages/${t._id}/auto`);
      await load();
      notify(`🔄 ${t.nom} — Retounen nan mode otomatik`);
    } catch { notify('❌ Erè', false); }
    setSaving('');
  };

  // ── AJOUTE ──
  const handleAdd = async () => {
    if (!form.nom.trim()) { alert('Mete non tiraj la!'); return; }
    setSaving('add');
    try {
      await api.post('/api/tirages', { ...form, actif: true });
      setShowAdd(false);
      setForm({ nom:'', etat:'Florida', ouverture:'10:00', fermeture:'10:30' });
      await load();
      notify('✅ Tiraj ajoute!');
    } catch { notify('❌ Erè', false); }
    setSaving('');
  };

  // ── MODIFYE ──
  const handleSaveEdit = async (t) => {
    setSaving(t._id+'edit');
    try {
      await api.put(`/api/tirages/${t._id}`, editForm);
      setEditing(null);
      await load();
      notify('✅ Tiraj modifye!');
    } catch { notify('❌ Erè', false); }
    setSaving('');
  };

  // ── EFASE ──
  const handleDelete = async (t) => {
    if (!confirm(`Efase "${t.nom}"?`)) return;
    try {
      await api.delete(`/api/tirages/${t._id}`);
      await load();
      notify('🗑️ Tiraj efase');
    } catch { notify('❌ Erè', false); }
  };

  const padT = s => String(s).padStart(2,'0');
  const nowStr = `${padT(now.getHours())}:${padT(now.getMinutes())}`;

  const ouvert  = tirages.filter(t => statutFinal(t) === 'ouvert');
  const ferme   = tirages.filter(t => statutFinal(t) === 'ferme');
  const bientot = tirages.filter(t => statutFinal(t) === 'bientot');
  const dezaktive = tirages.filter(t => statutFinal(t) === 'desaktive');

  const TABS = [
    { key:'statut',  label:'🟢 Statut Reyèl-Tan' },
    { key:'liste',   label:'⚙️ Jere Tiraj'       },
    { key:'horaires',label:'🕐 Orè'               },
  ];

  const StatCard = ({ label, count, color, bg }) => (
    <div style={{ background:bg, borderRadius:12, padding:'14px 16px',
      borderLeft:`4px solid ${color}`, textAlign:'center' }}>
      <div style={{ fontWeight:900, fontSize:28, color }}>{count}</div>
      <div style={{ fontSize:12, color:'#555', fontWeight:700, marginTop:2 }}>{label}</div>
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 8px 40px' }}>

        {/* BANNIÈRE */}
        <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12, padding:'14px 20px', marginBottom:14,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'#f59e0b', fontWeight:900, fontSize:18 }}>🎰 JESYON TIRAJ</div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>LA-PROBITE-BORLETTE</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'white', fontWeight:900, fontSize:22 }}>{nowStr}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11 }}>
              {now.toLocaleDateString('fr',{weekday:'short',day:'2-digit',month:'short'})}
            </div>
          </div>
        </div>

        {/* NOTIFIKASYON */}
        {msg.t && (
          <div style={{ background:msg.ok?'#dcfce7':'#fee2e2',
            border:`1.5px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color:msg.ok?'#166534':'#991b1b',
            padding:'10px 16px', borderRadius:10, marginBottom:12, fontWeight:700 }}>
            {msg.t}
          </div>
        )}

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:'11px 8px',
                background: tab===t.key ? '#1a73e8' : 'white',
                color: tab===t.key ? 'white' : '#374151',
                border:'2px solid ' + (tab===t.key ? '#1a73e8' : '#e5e7eb'),
                borderRadius:12, fontWeight:800, cursor:'pointer', fontSize:13,
                transition:'all .15s' }}>
              {t.label}
            </button>
          ))}
          <button onClick={() => setShowAdd(true)}
            style={{ padding:'11px 18px', background:'#f59e0b', color:'#111',
              border:'none', borderRadius:12, fontWeight:900, cursor:'pointer', fontSize:13 }}>
            ➕ Ajoute
          </button>
          <button onClick={load}
            style={{ padding:'11px 14px', background:'#f3f4f6', color:'#374151',
              border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:16 }}>
            ↻
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'#888', fontSize:16 }}>⏳ Ap chaje...</div>
        ) : (

          /* ══════ TAB STATUT ══════ */
          tab === 'statut' ? (
            <div>
              {/* MINI STATS */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                <StatCard label="🟢 Ouvè"     count={ouvert.length}   color="#16a34a" bg="#f0fdf4" />
                <StatCard label="🟡 Byento"   count={bientot.length}  color="#854d0e" bg="#fefce8" />
                <StatCard label="🔴 Fèmen"    count={ferme.length}    color="#dc2626" bg="#fef2f2" />
                <StatCard label="⚫ Dezaktive" count={dezaktive.length} color="#6b7280" bg="#f9fafb" />
              </div>

              {/* GWOUPE PA STATUT */}
              {[
                { label:'🟢 TIRAJ OUVÈ KOUNYE A', list:ouvert,   cfg:STATUT_CFG.ouvert   },
                { label:'🟡 OUVÈTI BYENTO',       list:bientot,  cfg:STATUT_CFG.bientot  },
                { label:'🔴 TIRAJ FÈMEN',          list:ferme,    cfg:STATUT_CFG.ferme    },
                { label:'⚫ DEZAKTIVE',             list:dezaktive,cfg:STATUT_CFG.desaktive},
              ].map(grp => grp.list.length === 0 ? null : (
                <div key={grp.label} style={{ marginBottom:16 }}>
                  <div style={{ fontWeight:800, fontSize:13, color:grp.cfg.color,
                    marginBottom:8, paddingLeft:4 }}>{grp.label} ({grp.list.length})</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:10 }}>
                    {grp.list.map(t => {
                      const sf = statutFinal(t);
                      const sc = STATUT_CFG[sf] || STATUT_CFG.ferme;
                      const isManyel = t.ouvertManyel === true || t.ferméManyel === true;
                      const busy = id => saving.startsWith(id);
                      return (
                        <div key={t._id||t.nom}
                          style={{ background:'white', borderRadius:12, padding:16,
                            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                            borderLeft:`5px solid ${sc.color}` }}>
                          {/* En-tête */}
                          <div style={{ display:'flex', justifyContent:'space-between',
                            alignItems:'flex-start', marginBottom:10 }}>
                            <div>
                              <div style={{ fontWeight:900, fontSize:15 }}>{t.nom}</div>
                              <div style={{ fontSize:11, color:'#888', marginTop:2 }}>
                                {t.etat} · {t.ouverture} – {t.fermeture}
                              </div>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              <span style={{ background:sc.bg, color:sc.color,
                                borderRadius:20, padding:'4px 12px',
                                fontSize:11, fontWeight:800 }}>
                                {sc.label}
                              </span>
                              {isManyel && (
                                <div style={{ color:'#7c3aed', fontSize:9, fontWeight:700, marginTop:3 }}>
                                  ✋ MANYÈL
                                </div>
                              )}
                            </div>
                          </div>

                          {/* BOUTON AKSYON */}
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            {sf !== 'ouvert' && (
                              <button onClick={() => handleOuvri(t)}
                                disabled={!!saving}
                                style={{ flex:1, padding:'9px 8px',
                                  background: saving===t._id+'ouv' ? '#ccc' : '#16a34a',
                                  color:'white', border:'none', borderRadius:8,
                                  fontWeight:800, cursor:'pointer', fontSize:12,
                                  whiteSpace:'nowrap' }}>
                                🟢 Ouvri
                              </button>
                            )}
                            {sf !== 'ferme' && sf !== 'desaktive' && (
                              <button onClick={() => handleFemen(t)}
                                disabled={!!saving}
                                style={{ flex:1, padding:'9px 8px',
                                  background: saving===t._id+'fem' ? '#ccc' : '#dc2626',
                                  color:'white', border:'none', borderRadius:8,
                                  fontWeight:800, cursor:'pointer', fontSize:12,
                                  whiteSpace:'nowrap' }}>
                                🔴 Fèmen
                              </button>
                            )}
                            {isManyel && (
                              <button onClick={() => handleAuto(t)}
                                disabled={!!saving}
                                style={{ flex:1, padding:'9px 8px',
                                  background: saving===t._id+'aut' ? '#ccc' : '#7c3aed',
                                  color:'white', border:'none', borderRadius:8,
                                  fontWeight:700, cursor:'pointer', fontSize:11,
                                  whiteSpace:'nowrap' }}>
                                🔄 Otomatik
                              </button>
                            )}
                          </div>

                          {/* Info aksyon */}
                          {t.aksyonPar && (
                            <div style={{ fontSize:10, color:'#aaa', marginTop:6 }}>
                              Dènye aksyon pa: <strong>{t.aksyonPar}</strong>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          /* ══════ TAB LISTE / JERE ══════ */
          ) : tab === 'liste' ? (
            <div style={{ background:'white', borderRadius:12,
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
              <div style={{ background:'#1a73e8', padding:'12px 16px' }}>
                <span style={{ color:'white', fontWeight:900, fontSize:14 }}>
                  ⚙️ Jere Tiraj — {tirages.length} tiraj
                </span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                      {['Non','Eta','Ouvèti','Fèmti','Statut','Aktif','Aksyon'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', fontWeight:800,
                          fontSize:11, color:'#374151', textAlign:'left', whiteSpace:'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tirages.map((t, i) => {
                      const sf = statutFinal(t);
                      const sc = STATUT_CFG[sf] || STATUT_CFG.ferme;
                      const isEdit = editing === (t._id||t.nom);
                      return (
                        <tr key={t._id||t.nom}
                          style={{ borderBottom:'1px solid #f3f4f6',
                            background: i%2===0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding:'10px 12px', fontWeight:700 }}>
                            {isEdit
                              ? <input value={editForm.nom||''} onChange={e=>setEditForm(f=>({...f,nom:e.target.value}))}
                                  style={{ width:140, padding:'5px 8px', border:'1.5px solid #1a73e8',
                                    borderRadius:6, fontSize:13 }} />
                              : t.nom}
                          </td>
                          <td style={{ padding:'10px 12px', fontSize:12, color:'#555' }}>
                            {isEdit
                              ? <select value={editForm.etat||''} onChange={e=>setEditForm(f=>({...f,etat:e.target.value}))}
                                  style={{ padding:'5px', border:'1.5px solid #ddd', borderRadius:6, fontSize:12 }}>
                                  {ETATS.map(e=><option key={e}>{e}</option>)}
                                </select>
                              : t.etat}
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            {isEdit
                              ? <input type="time" value={editForm.ouverture||''} onChange={e=>setEditForm(f=>({...f,ouverture:e.target.value}))}
                                  style={{ padding:'5px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }} />
                              : <span style={{ fontFamily:'monospace', fontWeight:700, color:'#16a34a' }}>{t.ouverture}</span>}
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            {isEdit
                              ? <input type="time" value={editForm.fermeture||''} onChange={e=>setEditForm(f=>({...f,fermeture:e.target.value}))}
                                  style={{ padding:'5px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }} />
                              : <span style={{ fontFamily:'monospace', fontWeight:700, color:'#dc2626' }}>{t.fermeture}</span>}
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background:sc.bg, color:sc.color,
                              borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <button onClick={() => handleToggle(t)}
                              style={{ background: t.actif!==false ? '#dcfce7' : '#fee2e2',
                                color: t.actif!==false ? '#16a34a' : '#dc2626',
                                border:'none', borderRadius:20, padding:'4px 12px',
                                fontWeight:800, cursor:'pointer', fontSize:11 }}>
                              {t.actif!==false ? '✅ Aktif' : '❌ Non'}
                            </button>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            {isEdit ? (
                              <div style={{ display:'flex', gap:5 }}>
                                <button onClick={() => handleSaveEdit(t)}
                                  style={{ background:'#16a34a', color:'white', border:'none',
                                    borderRadius:7, padding:'6px 12px', fontWeight:700,
                                    cursor:'pointer', fontSize:11 }}>
                                  ✅ Sove
                                </button>
                                <button onClick={() => setEditing(null)}
                                  style={{ background:'#f3f4f6', color:'#555', border:'none',
                                    borderRadius:7, padding:'6px 10px', fontWeight:700,
                                    cursor:'pointer', fontSize:11 }}>✕</button>
                              </div>
                            ) : (
                              <div style={{ display:'flex', gap:5 }}>
                                <button onClick={() => { setEditing(t._id||t.nom); setEditForm({nom:t.nom,etat:t.etat,ouverture:t.ouverture,fermeture:t.fermeture}); }}
                                  style={{ background:'#f59e0b', color:'white', border:'none',
                                    borderRadius:7, padding:'6px 10px', fontWeight:700,
                                    cursor:'pointer', fontSize:11 }}>✏️</button>
                                <button onClick={() => handleDelete(t)}
                                  style={{ background:'#fee2e2', color:'#dc2626', border:'none',
                                    borderRadius:7, padding:'6px 10px', fontWeight:700,
                                    cursor:'pointer', fontSize:11 }}>🗑</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          /* ══════ TAB ORÈ ══════ */
          ) : (
            <div style={{ background:'white', borderRadius:12,
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
              <div style={{ background:'#7c3aed', padding:'12px 16px' }}>
                <span style={{ color:'white', fontWeight:900, fontSize:14 }}>🕐 Orè Tiraj — {nowStr}</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                      {['Non Tiraj','Eta','🟢 Ouvèti','🔴 Fèmti','Statut kounye a','Mode'].map(h=>(
                        <th key={h} style={{ padding:'10px 12px', fontWeight:800,
                          fontSize:11, color:'#374151', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tirages.filter(t=>t.actif!==false).map((t,i) => {
                      const sf = statutFinal(t);
                      const sc = STATUT_CFG[sf] || STATUT_CFG.ferme;
                      const isManyel = t.ouvertManyel===true || t.ferméManyel===true;
                      return (
                        <tr key={t._id||t.nom}
                          style={{ borderBottom:'1px solid #f3f4f6',
                            background: sf==='ouvert' ? '#f0fdf4' : i%2===0?'white':'#fafafa' }}>
                          <td style={{ padding:'10px 12px', fontWeight:700 }}>{t.nom}</td>
                          <td style={{ padding:'10px 12px', fontSize:12, color:'#888' }}>{t.etat}</td>
                          <td style={{ padding:'10px 12px',fontFamily:'monospace',
                            fontWeight:700, color:'#16a34a' }}>{t.ouverture}</td>
                          <td style={{ padding:'10px 12px',fontFamily:'monospace',
                            fontWeight:700, color:'#dc2626' }}>{t.fermeture}</td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background:sc.bg, color:sc.color, borderRadius:20,
                              padding:'4px 12px', fontSize:12, fontWeight:800 }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            {isManyel
                              ? <span style={{ background:'#f5f3ff', color:'#7c3aed',
                                  borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                                  ✋ Manyèl
                                </span>
                              : <span style={{ color:'#aaa', fontSize:11 }}>🤖 Oto</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* ══════ MODAL AJOUTE ══════ */}
        {showAdd && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
            zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowAdd(false)}>
            <div style={{ background:'white', borderRadius:'20px 20px 0 0',
              width:'100%', maxWidth:500, padding:'0 0 40px' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ width:44,height:5,background:'#ddd',borderRadius:3,margin:'12px auto 16px'}} />
              <div style={{ padding:'0 20px 16px', display:'flex',
                justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:900, fontSize:17 }}>➕ Nouvo Tiraj</span>
                <button onClick={() => setShowAdd(false)}
                  style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>✕</button>
              </div>
              <div style={{ padding:'0 20px' }}>
                {[['Non Tiraj *','nom','text'],['Ouvèti *','ouverture','time'],['Fèmti *','fermeture','time']].map(([l,k,t])=>(
                  <div key={k} style={{ marginBottom:12 }}>
                    <label style={{ display:'block', fontWeight:700, fontSize:12,
                      marginBottom:4, color:'#555' }}>{l}</label>
                    <input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                        borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                  </div>
                ))}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    marginBottom:4, color:'#555' }}>Eta</label>
                  <select value={form.etat} onChange={e=>setForm(f=>({...f,etat:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                      borderRadius:8, fontSize:14 }}>
                    {ETATS.map(e=><option key={e}>{e}</option>)}
                  </select>
                </div>
                <button onClick={handleAdd} disabled={saving==='add'}
                  style={{ width:'100%', padding:'14px', background:saving==='add'?'#ccc':'#f59e0b',
                    color:'#111', border:'none', borderRadius:12,
                    fontWeight:900, fontSize:15, cursor:'pointer' }}>
                  {saving==='add'?'⏳...':'✅ Ajoute Tiraj'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
