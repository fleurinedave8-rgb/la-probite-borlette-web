/**
 * gestion-pos.js — Jere POS yo + Limite Ajan
 * - Modifye ID POS, Nom, Adres, Tel, Logo (photo upload)
 * - Limite pa ajan (Borlette, Loto3, Mariage, L4-P1/P2/P3, Tete Fich...)
 */
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const LIMITE_FIELDS = [
  { key:'borlette',          label:'Borlette (mise max)' },
  { key:'loto3',             label:'Loto3 (mise max)' },
  { key:'mariage',           label:'Mariage (mise max)' },
  { key:'l4p1',              label:'L4-P1 (mise max)' },
  { key:'l4p2',              label:'L4-P2 (mise max)' },
  { key:'l4p3',              label:'L4-P3 (mise max)' },
  { key:'tetFichLoto3Dwat',  label:'Tèt Fich Loto3 Dwat' },
  { key:'tetFichMariaj',     label:'Tèt Fich Mariage' },
  { key:'tetFichLoto3Goch',  label:'Tèt Fich Loto3 Goch' },
  { key:'tetFichMariajGoch', label:'Tèt Fich Mariage Goch' },
];

export default function GestionPOS() {
  const [posList,    setPosList]    = useState([]);
  const [agents,     setAgents]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [msg,        setMsg]        = useState('');
  const [selPos,     setSelPos]     = useState(null);
  const [posForm,    setPosForm]    = useState({});
  const [logoPreview,setLogoPreview]= useState('');
  const [savingPos,  setSavingPos]  = useState(false);
  const [showPosModal,setShowPosModal] = useState(false);

  // Limite pa ajan
  const [showLimiteModal, setShowLimiteModal] = useState(false);
  const [selAgent,   setSelAgent]   = useState(null);
  const [limiteForm, setLimiteForm] = useState({});
  const [savingLim,  setSavingLim]  = useState(false);
  const [loadingLim, setLoadingLim] = useState(false);

  const fileRef = useRef();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rPos, rAgents] = await Promise.all([
        api.get('/api/admin/pos'),
        api.get('/api/admin/agents'),
      ]);
      setPosList(Array.isArray(rPos.data) ? rPos.data : rPos.data?.pos || []);
      setAgents(Array.isArray(rAgents.data) ? rAgents.data : []);
    } catch {}
    setLoading(false);
  };

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  // ─── OUVRE MODAL MODIFYE POS ─────────────────────────────
  const openPosModal = (pos) => {
    setSelPos(pos);
    setPosForm({
      nom:       pos.nom || '',
      posId:     pos.posId || '',
      adresse:   pos.adresse || '',
      telephone: pos.telephone || '',
    });
    setLogoPreview(pos.logo || '');
    setShowPosModal(true);
  };

  // ─── LOGO UPLOAD ──────────────────────────────────────────
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { alert('Logo dwe pi piti pase 500KB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      setPosForm(f => ({ ...f, logo: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // ─── SOVE POS ─────────────────────────────────────────────
  const savePOS = async () => {
    if (!selPos) return;
    setSavingPos(true);
    try {
      await api.put(`/api/admin/pos/${selPos._id}/full`, {
        ...posForm,
        logo: logoPreview || undefined,
      });
      notify('✅ POS mete ajou!');
      setShowPosModal(false);
      await loadAll();
    } catch (e) {
      notify('❌ Erè: ' + (e.response?.data?.message || e.message));
    }
    setSavingPos(false);
  };

  // ─── TOGGLE POS ───────────────────────────────────────────
  const togglePos = async (pos) => {
    try {
      await api.put(`/api/admin/pos/${pos._id}/toggle`);
      notify(`${pos.actif ? '🔴 Dezaktive' : '🟢 Aktive'} — ${pos.nom}`);
      loadAll();
    } catch (e) { notify('❌ ' + e.message); }
  };

  // ─── LIMITE AJAN ──────────────────────────────────────────
  const openLimiteModal = async (agent) => {
    setSelAgent(agent);
    setLimiteForm({});
    setLoadingLim(true);
    setShowLimiteModal(true);
    try {
      const r = await api.get(`/api/admin/agents/${agent._id||agent.id}/limites`);
      setLimiteForm(r.data.limites || {});
    } catch { setLimiteForm({}); }
    setLoadingLim(false);
  };

  const saveLimite = async () => {
    if (!selAgent) return;
    setSavingLim(true);
    try {
      await api.put(`/api/admin/agents/${selAgent._id||selAgent.id}/limites`, limiteForm);
      notify('✅ Limites ajan mete ajou!');
      setShowLimiteModal(false);
    } catch (e) {
      notify('❌ ' + (e.response?.data?.message || e.message));
    }
    setSavingLim(false);
  };

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ background:'#1a73e8', borderRadius:10, padding:'8px 16px' }}>
            <span style={{ color:'white', fontWeight:900, fontSize:16 }}>⚙️ Jere POS yo</span>
          </div>
        </div>

        {msg && (
          <div style={{ background: msg.startsWith('✅')?'#dcfce7':'#fee2e2',
            border:`1px solid ${msg.startsWith('✅')?'#16a34a':'#dc2626'}`,
            borderRadius:8, padding:12, marginBottom:14, fontWeight:700,
            color: msg.startsWith('✅')?'#16a34a':'#dc2626' }}>
            {msg}
          </div>
        )}

        {/* ════ SEKYON POS ════ */}
        <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:24 }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0f0f0',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:900, fontSize:15 }}>📟 Liste POS</span>
            <span style={{ color:'#888', fontSize:12 }}>{posList.length} POS total</span>
          </div>

          {loading
            ? <div style={{ padding:30, textAlign:'center', color:'#999' }}>⏳ Ap chaje...</div>
            : posList.length === 0
            ? <div style={{ padding:30, textAlign:'center', color:'#bbb' }}>Pa gen POS</div>
            : <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8f9fa' }}>
                    {['Logo','Nom POS','POS ID','Adres','Tel','Statut','Aksyon'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:800,
                        color:'#555', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posList.map((pos, i) => (
                    <tr key={pos._id||i}
                      style={{ background: i%2===0?'white':'#fafafa',
                        borderBottom:'1px solid #f0f0f0' }}>
                      <td style={{ padding:'10px 14px' }}>
                        {pos.logo
                          ? <img src={pos.logo} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:'cover', border:'1px solid #eee' }}/>
                          : <div style={{ width:40, height:40, borderRadius:8, background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <span style={{ fontSize:20 }}>🔑</span>
                            </div>
                        }
                      </td>
                      <td style={{ padding:'10px 14px', fontWeight:800 }}>{pos.nom||'—'}</td>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:'#1a73e8' }}>{pos.posId||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:'#888' }}>{pos.adresse||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:12 }}>{pos.telephone||'—'}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:12, fontSize:11, fontWeight:700,
                          background: pos.actif?'#dcfce7':'#fee2e2',
                          color: pos.actif?'#16a34a':'#dc2626' }}>
                          {pos.actif ? '🟢 Aktif' : '🔴 Inaktif'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => openPosModal(pos)}
                            style={{ padding:'5px 12px', background:'#1a73e8', color:'white',
                              border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:11 }}>
                            ✏️ Modifye
                          </button>
                          <button onClick={() => togglePos(pos)}
                            style={{ padding:'5px 10px', background: pos.actif?'#fee2e2':'#dcfce7',
                              color: pos.actif?'#dc2626':'#16a34a',
                              border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:11 }}>
                            {pos.actif ? '🔴' : '🟢'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* ════ SEKYON LIMITE AJAN ════ */}
        <div style={{ background:'white', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0f0f0' }}>
            <span style={{ fontWeight:900, fontSize:15 }}>👤 Limite pa Ajan</span>
            <div style={{ fontSize:12, color:'#888', marginTop:3 }}>
              Klike sou yon ajan pou modifye limit pèsonèl li yo
            </div>
          </div>
          <div style={{ padding:16, display:'flex', gap:10, flexWrap:'wrap' }}>
            {agents.filter(a => a.role !== 'admin').map(a => (
              <button key={a._id||a.id} onClick={() => openLimiteModal(a)}
                style={{ padding:'10px 18px', background:'white', border:'1.5px solid #1a73e8',
                  borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:13,
                  color:'#1a73e8', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:20 }}>👤</span>
                <span>{a.prenom||''} {a.nom||''}</span>
                <span style={{ color:'#aaa', fontSize:11 }}>({a.username})</span>
              </button>
            ))}
            {agents.filter(a => a.role !== 'admin').length === 0 && (
              <span style={{ color:'#bbb', fontSize:13 }}>Pa gen ajan</span>
            )}
          </div>
        </div>

      </div>

      {/* ══════ MODAL MODIFYE POS ══════ */}
      {showPosModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'white', borderRadius:16, padding:28, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <span style={{ fontWeight:900, fontSize:17 }}>✏️ Modifye POS</span>
              <button onClick={() => setShowPosModal(false)}
                style={{ background:'#f3f4f6', border:'none', borderRadius:'50%',
                  width:34, height:34, cursor:'pointer', fontWeight:700, fontSize:16 }}>✕</button>
            </div>

            {/* LOGO */}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:800, color:'#555', marginBottom:8 }}>
                🖼️ Logo POS (foto)
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:72, height:72, borderRadius:12, background:'#111',
                  display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
                  border:'2px solid #eee' }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <span style={{ fontSize:32 }}>🔑</span>
                  }
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange}
                    style={{ display:'none' }}/>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ padding:'8px 16px', background:'#eff6ff', color:'#1a73e8',
                      border:'1.5px solid #bfdbfe', borderRadius:8, fontWeight:700,
                      cursor:'pointer', fontSize:12, display:'block', marginBottom:6 }}>
                    📁 Chwazi Foto
                  </button>
                  {logoPreview && (
                    <button onClick={() => { setLogoPreview(''); setPosForm(f=>({...f,logo:''})); }}
                      style={{ padding:'4px 12px', background:'#fee2e2', color:'#dc2626',
                        border:'none', borderRadius:6, fontWeight:600, cursor:'pointer', fontSize:11 }}>
                      🗑 Retire Logo
                    </button>
                  )}
                  <div style={{ fontSize:10, color:'#999', marginTop:4 }}>Max 500KB — JPG/PNG</div>
                </div>
              </div>
            </div>

            {/* FIELDS */}
            {[
              ['nom',       'Nom POS',       'text',   'LA-PROBITE CENTER'],
              ['posId',     'ID POS',        'text',   'POS-XXXX-XXXX'],
              ['adresse',   'Adres POS',     'text',   'Port-au-Prince, Haiti'],
              ['telephone', 'Telefòn POS',   'text',   '+509 XXXX XXXX'],
            ].map(([key, label, type, ph]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:800, color:'#555', marginBottom:6 }}>
                  {label}
                </label>
                <input type={type} value={posForm[key]||''}
                  onChange={e => setPosForm(f => ({...f, [key]: e.target.value}))}
                  placeholder={ph}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd',
                    borderRadius:8, fontSize:13, boxSizing:'border-box',
                    outline:'none', fontWeight:600 }}/>
              </div>
            ))}

            <button onClick={savePOS} disabled={savingPos}
              style={{ width:'100%', padding:14, background: savingPos?'#ccc':'#1a73e8',
                color:'white', border:'none', borderRadius:10, fontWeight:900,
                cursor: savingPos?'not-allowed':'pointer', fontSize:15 }}>
              {savingPos ? '⏳ Ap sove...' : '💾 Sove POS'}
            </button>
          </div>
        </div>
      )}

      {/* ══════ MODAL LIMITE AJAN ══════ */}
      {showLimiteModal && selAgent && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'white', borderRadius:16, padding:28, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <span style={{ fontWeight:900, fontSize:17 }}>👤 Limites Ajan</span>
                <div style={{ fontSize:12, color:'#888', marginTop:2 }}>
                  {selAgent.prenom} {selAgent.nom} ({selAgent.username})
                </div>
              </div>
              <button onClick={() => setShowLimiteModal(false)}
                style={{ background:'#f3f4f6', border:'none', borderRadius:'50%',
                  width:34, height:34, cursor:'pointer', fontWeight:700, fontSize:16 }}>✕</button>
            </div>

            {loadingLim
              ? <div style={{ textAlign:'center', padding:30, color:'#999' }}>⏳ Ap chaje...</div>
              : <>
                  <div style={{ background:'#eff6ff', borderRadius:8, padding:10, marginBottom:16,
                    fontSize:12, color:'#1a73e8', fontWeight:600 }}>
                    💡 Mete 0 = pa gen limit. Valè yo ann HTG (goud).
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {LIMITE_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#555', marginBottom:5 }}>
                          {label}
                        </label>
                        <input type="number" min="0"
                          value={limiteForm[key] || ''}
                          onChange={e => setLimiteForm(f => ({...f, [key]: Number(e.target.value)}))}
                          placeholder="0"
                          style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd',
                            borderRadius:8, fontSize:14, fontWeight:700, boxSizing:'border-box' }}/>
                      </div>
                    ))}
                  </div>
                  <button onClick={saveLimite} disabled={savingLim}
                    style={{ width:'100%', marginTop:20, padding:14,
                      background: savingLim?'#ccc':'#16a34a', color:'white',
                      border:'none', borderRadius:10, fontWeight:900,
                      cursor: savingLim?'not-allowed':'pointer', fontSize:15 }}>
                    {savingLim ? '⏳ Ap sove...' : '💾 Sove Limites'}
                  </button>
                </>
            }
          </div>
        </div>
      )}
    </Layout>
  );
}
