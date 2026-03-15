import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const TIRAGES_PRIMES = ['60|20|10', '50|15|5', '70|25|15', 'Personnalisé'];

// ── Helper: lir fichye kòm base64 ──────────────────────────────
function readFileB64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result); // data:image/...;base64,...
    r.onerror = () => rej(new Error('Echèk lekti fichye'));
    r.readAsDataURL(file);
  });
}

// ── Composant upload logo ──────────────────────────────────────
function LogoUpload({ value, onChange, label='🖼️ Logo POS' }) {
  const ref = useRef();
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 400 * 1024) { alert('Logo twò gwo! Maks 400KB'); return; }
    try {
      const b64 = await readFileB64(file);
      onChange(b64);
    } catch { alert('Erè lekti fichye'); }
    e.target.value = '';
  };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontWeight:800, fontSize:12, marginBottom:8, color:'#7c3aed' }}>
        {label}
      </label>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        {/* Preview */}
        <div onClick={() => ref.current?.click()}
          style={{ width:64, height:64, borderRadius:10, overflow:'hidden', flexShrink:0,
            border: value ? '2px solid #7c3aed' : '2px dashed #d1d5db',
            background:'#f9fafb', display:'flex', alignItems:'center',
            justifyContent:'center', cursor:'pointer' }}>
          {value
            ? <img src={value} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:24 }}>🖼️</div>
                <div style={{ fontSize:9, color:'#aaa' }}>Chwazi</div>
              </div>
          }
        </div>
        <div style={{ flex:1 }}>
          {/* Bouton reyèl ki ouvri galri */}
          <button type="button" onClick={() => ref.current?.click()}
            style={{ width:'100%', padding:'11px', background:'#7c3aed', color:'white',
              border:'none', borderRadius:8, fontWeight:700, fontSize:13,
              cursor:'pointer', marginBottom:6 }}>
            📁 Chwazi Fichye / Galri
          </button>
          <p style={{ margin:0, fontSize:11, color:'#888', lineHeight:1.5 }}>
            PNG · JPG · GIF · Maks 400KB<br/>
            {value ? <span style={{ color:'#16a34a', fontWeight:700 }}>✓ Logo chwazi</span> : 'Pa gen logo pou kounye a'}
          </p>
        </div>
      </div>
      {value && (
        <button type="button" onClick={() => onChange('')}
          style={{ marginTop:8, padding:'6px 12px', background:'#fee2e2',
            color:'#dc2626', border:'none', borderRadius:6, fontSize:12,
            fontWeight:700, cursor:'pointer' }}>
          🗑️ Wete Logo
        </button>
      )}
      <input ref={ref} type="file" accept="image/*"
        
        style={{ display:'none' }} onChange={handleFile} />
    </div>
  );
}

export default function AgentsPage() {
  const [activeTab,    setActiveTab]    = useState('branches');
  const [showForm,     setShowForm]     = useState(false);
  const [filter,       setFilter]       = useState('actif');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(0);
  const [pos,          setPos]          = useState([]);
  const [agents,       setAgents]       = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState('');
  const PER_PAGE = 10;

  // Formulaire ajout POS
  const emptyForm = {
    succursale:'', deviceId:'', zone:'', nom:'', prenom:'',
    telephone:'', identifiant:'', password:'',
    agentPct:0, supPct:0, credit:'Libre', balanceGain:'Libre',
    prime:'60|20|10', superviseurId:'',
    tete1:'', tete2:'', tete3:'', tete4:'Fich sa valid pou 90 jou',
    messageAdmin:'', logo:'',
  };
  const [form,   setForm]   = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Modal EDIT POS
  const [editPos,    setEditPos]    = useState(null);
  const [editForm,   setEditForm]   = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [posRes, agentsRes, supRes] = await Promise.all([
        api.get('/api/admin/pos').catch(() => ({ data: [] })),
        api.get('/api/admin/agents').catch(() => ({ data: [] })),
        api.get('/api/admin/superviseurs').catch(() => ({ data: [] })),
      ]);
      setPos(Array.isArray(posRes.data) ? posRes.data : []);
      setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
      setSuperviseurs(Array.isArray(supRes.data) ? supRes.data : []);
    } finally { setLoading(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.deviceId)    e.deviceId    = true;
    if (!form.nom)         e.nom         = true;
    if (!form.prenom)      e.prenom      = true;
    if (!form.identifiant) e.identifiant = true;
    if (!form.password)    e.password    = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // 1. Kreye ajan
      await api.post('/api/admin/agents', {
        nom: form.nom, prenom: form.prenom,
        username: form.identifiant, password: form.password,
        telephone: form.telephone, role: 'agent',
        credit: form.credit, limiteGain: form.balanceGain,
      });
      // 2. Kreye POS — avèk logo base64 si gen youn
      await api.post('/api/admin/pos', {
        posId:         form.deviceId,
        nom:           `${form.prenom} ${form.nom}`,
        adresse:       form.zone,
        telephone:     form.telephone,
        succursale:    form.succursale,
        prime:         form.prime,
        agentPct:      form.agentPct,
        supPct:        form.supPct,
        credit:        form.credit,
        agentUsername: form.identifiant,
        messageAdmin:  form.messageAdmin || '',
        logo:          form.logo || '',        // base64 string
        tete: {
          ligne1: form.tete1 || `${form.prenom} ${form.nom}`,
          ligne2: form.tete2 || form.zone     || '',
          ligne3: form.tete3 || form.telephone|| '',
          ligne4: form.tete4 || 'Fich sa valid pou 90 jou',
        }
      });
      setMsg('✅ POS kreye avèk siksè!');
      setShowForm(false);
      setForm(emptyForm);
      await loadData();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert('Erè: ' + (err?.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  // ── Ouvri modal edit POS ──────────────────────────────────────
  const openEditPos = (p) => {
    setEditPos(p);
    setEditForm({
      posId:        p.posId        || '',
      nom:          p.nom          || '',
      adresse:      p.adresse      || '',
      telephone:    p.telephone    || '',
      succursale:   p.succursale   || '',
      prime:        p.prime        || '60|20|10',
      agentPct:     p.agentPct     || 0,
      credit:       p.credit       || 'Illimité',
      messageAdmin: p.messageAdmin || '',
      logo:         p.logo         || '',
      tete1: p.tete?.ligne1 || p.nom      || '',
      tete2: p.tete?.ligne2 || p.adresse  || '',
      tete3: p.tete?.ligne3 || p.telephone|| '',
      tete4: p.tete?.ligne4 || 'Fich sa valid pou 90 jou',
    });
  };

  const saveEditPos = async () => {
    if (!editPos) return;
    if (!editForm.posId?.trim()) { alert('POS ID obligatwa!'); return; }
    setSavingEdit(true);
    try {
      // PUT /pos/:id aksepte $set: req.body — voye tout champ yo
      await api.put(`/api/admin/pos/${editPos._id}`, {
        posId:        editForm.posId.trim().toUpperCase(),
        nom:          editForm.nom,
        adresse:      editForm.adresse,
        telephone:    editForm.telephone,
        succursale:   editForm.succursale,
        prime:        editForm.prime,
        agentPct:     parseFloat(editForm.agentPct) || 0,
        credit:       editForm.credit,
        messageAdmin: editForm.messageAdmin,
        logo:         editForm.logo,           // base64 string
        tete: {
          ligne1: editForm.tete1,
          ligne2: editForm.tete2,
          ligne3: editForm.tete3,
          ligne4: editForm.tete4,
        },
      });
      setMsg('✅ POS mete ajou avèk siksè!');
      setEditPos(null);
      await loadData();
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSavingEdit(false);
  };

  const handleToggle = async (id) => {
    try { await api.put(`/api/admin/agents/${id}/toggle`); await loadData(); } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Efase POS sa a?')) return;
    try { await api.delete(`/api/admin/pos/${id}`); await loadData(); } catch {}
  };

  const filteredPos    = pos.filter(p    => filter==='actif' ? p.actif!==false : p.actif===false);
  const filteredAgents = agents.filter(a => filter==='actif' ? a.actif!==false : a.actif===false);
  const searched = (arr) => !search ? arr
    : arr.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())));

  const TABS = [
    { key:'branches',     label:'Branches POS' },
    { key:'appareils',    label:'Appareils POS' },
    { key:'agentspos',    label:'Agents & POS' },
    { key:'superviseurs', label:'Superviseurs' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#f59e0b', borderRadius:10, padding:'12px 20px',
          marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Agents / POS</span>
        </div>

        {msg && (
          <div style={{ background:'#dcfce7', border:'1px solid #16a34a', borderRadius:8,
            padding:12, marginBottom:12, color:'#16a34a', fontWeight:700 }}>
            {msg}
          </div>
        )}

        {/* BOUTONS PRENSIPAL */}
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          <button onClick={() => setShowForm(true)}
            style={{ background:'#16a34a', color:'white', border:'none', borderRadius:8,
              padding:'10px 20px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
            ➕ Ajouter POS
          </button>
          {['actif','inactif'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter===f ? (f==='actif'?'#1a73e8':'#dc2626') : 'white',
                color: filter===f ? 'white' : (f==='actif'?'#1a73e8':'#dc2626'),
                border:`1.5px solid ${f==='actif'?'#1a73e8':'#dc2626'}`,
                borderRadius:8, padding:'10px 18px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {f==='actif' ? '✅ Aktif' : '❌ Inaktif'}
            </button>
          ))}
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Chèche..."
            style={{ padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8,
              fontSize:13, marginLeft:'auto' }} />
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:0, borderBottom:'2px solid #dee2e6',
          overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding:'10px 16px', border:'none', whiteSpace:'nowrap',
                background: activeTab===t.key ? '#1a73e8' : '#f8f9fa',
                color: activeTab===t.key ? 'white' : '#444',
                fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background:'white', borderRadius:'0 0 8px 8px', padding:16,
          boxShadow:'0 1px 3px rgba(0,0,0,0.08)', overflowX:'auto' }}>

          {/* ── TAB BRANCHES POS ── */}
          {activeTab === 'branches' && (
            <PosTable
              data={searched(filteredPos)} loading={loading}
              cols={['Logo','Prime','Crédit','Suc/Adr','Statut','Action']}
              renderRow={(p,i) => (
                <tr key={p._id||i} style={{ borderBottom:'1px solid #f0f0f0',
                  background:i%2===0?'white':'#fafafa' }}>
                  <td style={{ padding:'8px 12px' }}>
                    {p.logo
                      ? <img src={p.logo} alt="logo"
                          style={{ width:40, height:40, objectFit:'cover', borderRadius:6 }} />
                      : <span style={{ fontSize:24 }}>🔑</span>
                    }
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ background:'#dbeafe', color:'#1a73e8', borderRadius:4,
                      padding:'2px 8px', fontWeight:700, fontSize:12 }}>
                      {p.prime||'60|20|10'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px', fontWeight:700 }}>{p.credit||'Illimité'}</td>
                  <td style={{ padding:'8px 12px', fontSize:12 }}>{p.succursale||p.adresse||'—'}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ background:p.actif!==false?'#dcfce7':'#fee2e2',
                      color:p.actif!==false?'#16a34a':'#dc2626',
                      borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                      {p.actif!==false ? '🟢 Aktif' : '🔴 Inaktif'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <button onClick={() => openEditPos(p)}
                      style={{ background:'#1a73e8', color:'white', border:'none',
                        borderRadius:6, padding:'6px 12px', cursor:'pointer',
                        fontSize:12, fontWeight:700 }}>
                      ✏️ Modifye
                    </button>
                  </td>
                </tr>
              )}
            />
          )}

          {/* ── TAB APPAREILS POS ── */}
          {activeTab === 'appareils' && (
            <PosTable
              data={searched(filteredPos)} loading={loading}
              cols={['Device/POS ID','Nom POS','%Agent','Statut','Action']}
              renderRow={(p,i) => (
                <tr key={p._id||i} style={{ borderBottom:'1px solid #f0f0f0',
                  background:i%2===0?'white':'#fafafa' }}>
                  <td style={{ padding:'8px 12px', fontFamily:'monospace',
                    fontSize:12, color:'#1a73e8', fontWeight:900 }}>
                    {p.posId||'—'}
                  </td>
                  <td style={{ padding:'8px 12px', fontWeight:700 }}>{p.nom||'—'}</td>
                  <td style={{ padding:'8px 12px' }}>{p.agentPct||0}%</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ background:p.actif!==false?'#dcfce7':'#fee2e2',
                      color:p.actif!==false?'#16a34a':'#dc2626',
                      borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                      {p.actif!==false ? '🟢 Aktif' : '🔴 Inaktif'}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => openEditPos(p)}
                        style={{ background:'#1a73e8', color:'white', border:'none',
                          borderRadius:6, padding:'6px 12px', cursor:'pointer',
                          fontSize:12, fontWeight:700 }}>
                        ✏️ Modifye
                      </button>
                      <button onClick={() => handleDelete(p._id)}
                        style={{ background:'#fee2e2', color:'#dc2626',
                          border:'1px solid #fca5a5', borderRadius:6,
                          padding:'6px 10px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            />
          )}

          {/* ── TAB AGENTS & POS ── */}
          {activeTab === 'agentspos' && (
            <PosTable
              data={searched(filteredAgents)} loading={loading}
              cols={['Ajan','Device ID','%Agent','Statut','Aksyon']}
              renderRow={(a,i) => {
                const posAgent = pos.find(p =>
                  p.agentUsername === a.username ||
                  p.agentId === (a.id||a._id) ||
                  p.nom?.includes(a.nom));
                return (
                  <tr key={a.id||a._id||i} style={{ borderBottom:'1px solid #f0f0f0',
                    background:i%2===0?'white':'#fafafa' }}>
                    <td style={{ padding:'8px 12px', fontWeight:700 }}>
                      {a.prenom} {a.nom}
                      <div style={{ fontSize:11, color:'#888' }}>{a.username}</div>
                    </td>
                    <td style={{ padding:'8px 12px', fontFamily:'monospace',
                      fontSize:12, color:'#1a73e8', fontWeight:700 }}>
                      {posAgent?.posId || '—'}
                    </td>
                    <td style={{ padding:'8px 12px' }}>{posAgent?.agentPct||0}%</td>
                    <td style={{ padding:'8px 12px' }}>
                      <span style={{ background:a.actif!==false?'#dcfce7':'#fee2e2',
                        color:a.actif!==false?'#16a34a':'#dc2626',
                        borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                        {a.actif!==false ? '🟢' : '🔴'}
                      </span>
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        {posAgent && (
                          <button onClick={() => openEditPos(posAgent)}
                            style={{ background:'#1a73e8', color:'white', border:'none',
                              borderRadius:6, padding:'6px 10px', cursor:'pointer',
                              fontSize:11, fontWeight:700 }}>
                            ✏️ POS
                          </button>
                        )}
                        <button onClick={() => handleToggle(a.id||a._id)}
                          style={{ background:a.actif!==false?'#f59e0b':'#16a34a',
                            color:'white', border:'none', borderRadius:6,
                            padding:'6px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                          {a.actif!==false ? 'Bloke' : 'Aktive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }}
            />
          )}

          {/* ── TAB SUPERVISEURS ── */}
          {activeTab === 'superviseurs' && (
            <SuperviseurTab superviseurs={superviseurs} agents={agents}
              onRefresh={loadData} api={api} />
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          MODAL AJOUTER POS — avec upload logo reyèl
      ════════════════════════════════════════════ */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
          zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, maxHeight:'95vh', overflowY:'auto' }}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3, margin:'12px auto 8px' }} />
            <div style={{ padding:'0 18px 8px', display:'flex', justifyContent:'space-between' }}>
              <h3 style={{ margin:0, fontWeight:900, fontSize:17, color:'#16a34a' }}>
                ➕ Ajouter Nouvo POS
              </h3>
              <button onClick={() => setShowForm(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            <div style={{ padding:'8px 18px 40px' }}>

              {/* DEVICE ID */}
              <div style={{ background:'#eff6ff', borderRadius:10, padding:14,
                marginBottom:16, border:'2px solid #1a73e8' }}>
                <label style={{ display:'block', fontWeight:900, fontSize:13,
                  marginBottom:8, color:'#1a73e8' }}>
                  🆔 POS ID — Nimewo Aparèy * <span style={{ color:'#dc2626' }}>OBLIGATWA</span>
                </label>
                <input
                  value={form.deviceId}
                  onChange={e => { setForm(f=>({...f,deviceId:e.target.value.toUpperCase()}));
                    setErrors(er=>({...er,deviceId:false})); }}
                  placeholder="POS-001 oswa kòd aparèy la..."
                  style={{ width:'100%', padding:'12px', border:`2px solid ${errors.deviceId?'#dc2626':'#1a73e8'}`,
                    borderRadius:8, fontSize:15, fontFamily:'monospace', fontWeight:900,
                    boxSizing:'border-box', letterSpacing:1, color:'#1a73e8' }}
                />
                <p style={{ color:'#555', fontSize:11, margin:'6px 0 0' }}>
                  💡 Ajan an ba ou ID li sou ekran akèy aplikasyon POS la
                </p>
              </div>

              {/* NOM + PRENOM */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                {[['prenom','Prenon *',true],['nom','Non *',true]].map(([name,label,req]) => (
                  <div key={name}>
                    <label style={{ display:'block', fontWeight:700, fontSize:12,
                      marginBottom:4, color:errors[name]?'#dc2626':'#444' }}>
                      {label}
                    </label>
                    <input value={form[name]}
                      onChange={e=>{ setForm(f=>({...f,[name]:e.target.value}));
                        setErrors(er=>({...er,[name]:false})); }}
                      style={{ width:'100%', padding:'10px', border:`1.5px solid ${errors[name]?'#dc2626':'#ddd'}`,
                        borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>

              {/* IDENTIFIANT + MODPAS */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    marginBottom:4, color:errors.identifiant?'#dc2626':'#444' }}>
                    Identifyan Login *
                  </label>
                  <input value={form.identifiant}
                    onChange={e=>{ setForm(f=>({...f,identifiant:e.target.value}));
                      setErrors(er=>({...er,identifiant:false})); }}
                    style={{ width:'100%', padding:'10px', border:`1.5px solid ${errors.identifiant?'#dc2626':'#ddd'}`,
                      borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    marginBottom:4, color:errors.password?'#dc2626':'#444' }}>
                    Modpas *
                  </label>
                  <input type="password" value={form.password}
                    onChange={e=>{ setForm(f=>({...f,password:e.target.value}));
                      setErrors(er=>({...er,password:false})); }}
                    style={{ width:'100%', padding:'10px', border:`1.5px solid ${errors.password?'#dc2626':'#ddd'}`,
                      borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              </div>

              {/* TELEFON + ZONE */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Telefòn</label>
                  <input value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))}
                    placeholder="+509..."
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Zone / Adrès</label>
                  <input value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))}
                    placeholder="Delmas 32..."
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              </div>

              {/* PRIME + SUCCURSALE */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Prime</label>
                  <select value={form.prime} onChange={e=>setForm(f=>({...f,prime:e.target.value}))}
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13 }}>
                    {TIRAGES_PRIMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Succursale</label>
                  <input value={form.succursale} onChange={e=>setForm(f=>({...f,succursale:e.target.value}))}
                    placeholder="CENTRAL, DELMAS..."
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              </div>

              {/* % AGENT */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>% Komisyon Ajan</label>
                  <input type="number" min="0" max="100" value={form.agentPct}
                    onChange={e=>setForm(f=>({...f,agentPct:e.target.value}))}
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Kredi Vant</label>
                  <input value={form.credit} onChange={e=>setForm(f=>({...f,credit:e.target.value}))}
                    placeholder="Libre..."
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              </div>

              {/* ── LOGO POS — Upload reyèl ── */}
              <div style={{ background:'#faf5ff', border:'1.5px solid #e9d5ff',
                borderRadius:10, padding:14, marginBottom:14 }}>
                <LogoUpload
                  value={form.logo}
                  onChange={v => setForm(f=>({...f, logo:v}))}
                  label="🖼️ Logo POS — pou soti sou ticket"
                />
              </div>

              {/* TETE FICH */}
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe',
                borderRadius:10, padding:14, marginBottom:14 }}>
                <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#1e40af' }}>
                  🖨️ Tete Fich (Enpresyon)
                </h4>
                {[
                  ['tete1', 'Liy 1 — Non POS'],
                  ['tete2', 'Liy 2 — Adrès'],
                  ['tete3', 'Liy 3 — Telefòn'],
                  ['tete4', 'Liy 4 — Pye fich'],
                ].map(([name, label]) => (
                  <div key={name} style={{ marginBottom:8 }}>
                    <label style={{ display:'block', fontWeight:700, fontSize:11,
                      marginBottom:3, color:'#1e40af' }}>{label}</label>
                    <input value={form[name]||''}
                      onChange={e => setForm(f=>({...f,[name]:e.target.value}))}
                      style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #bfdbfe',
                        borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>

              {/* MESSAGE ADMIN */}
              <div style={{ background:'#fffbeb', border:'1px solid #f59e0b',
                borderRadius:10, padding:14, marginBottom:16 }}>
                <h4 style={{ margin:'0 0 8px', fontSize:13, fontWeight:800, color:'#92400e' }}>
                  📢 Mesaj Admin pou POS sa a
                </h4>
                <textarea value={form.messageAdmin||''}
                  onChange={e => setForm(f=>({...f,messageAdmin:e.target.value}))}
                  placeholder="Mesaj ki ap parèt sou ekran ajan an..."
                  rows={2}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #f59e0b',
                    borderRadius:8, fontSize:13, resize:'vertical',
                    boxSizing:'border-box', fontFamily:'inherit' }}
                />
              </div>

              {/* BOUTONS */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:13, background:'#f3f4f6', border:'none',
                    borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                  Anile
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex:2, padding:13, background:saving?'#ccc':'#16a34a',
                    color:'white', border:'none', borderRadius:10,
                    fontWeight:900, cursor:saving?'default':'pointer', fontSize:15 }}>
                  {saving ? '⏳ Ap kreye...' : '✅ Kreye POS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MODAL EDIT POS — POS ID + Logo + tout champ
      ════════════════════════════════════════════ */}
      {editPos && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
          zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, maxHeight:'95vh', overflowY:'auto' }}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3, margin:'12px auto 0' }} />

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#1a73e8,#0d47a1)',
              padding:'14px 18px', marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ color:'white', fontWeight:900, fontSize:16 }}>✏️ Modifye POS</div>
                  <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12, marginTop:2,
                    fontFamily:'monospace' }}>
                    ID aktyèl: {editPos.posId || '(pa defini)'}
                  </div>
                </div>
                <button onClick={() => setEditPos(null)}
                  style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'white',
                    borderRadius:8, width:34, height:34, cursor:'pointer', fontSize:18 }}>✕</button>
              </div>
            </div>

            <div style={{ padding:'16px 18px 40px' }}>

              {/* ── POS ID — modifiab ── */}
              <div style={{ background:'#eff6ff', border:'2px solid #1a73e8',
                borderRadius:10, padding:14, marginBottom:16 }}>
                <label style={{ display:'block', fontWeight:900, fontSize:13,
                  marginBottom:8, color:'#1a73e8' }}>
                  🆔 POS ID — ou ka modifye l
                </label>
                <input
                  value={editForm.posId||''}
                  onChange={e => setEditForm(f=>({...f, posId:e.target.value.toUpperCase()}))}
                  placeholder="POS-001..."
                  style={{ width:'100%', padding:'12px', border:'2px solid #1a73e8',
                    borderRadius:8, fontSize:16, fontFamily:'monospace', fontWeight:900,
                    boxSizing:'border-box', letterSpacing:1, color:'#1a73e8' }}
                />
                <p style={{ margin:'6px 0 0', fontSize:11, color:'#1a73e8' }}>
                  ⚠️ Si ou chanje ID sa, ajan an dwe itilize nouvo ID la nan aplikasyon an
                </p>
              </div>

              {/* ── LOGO — Upload fichye ── */}
              <div style={{ background:'#faf5ff', border:'1.5px solid #e9d5ff',
                borderRadius:10, padding:14, marginBottom:14 }}>
                <LogoUpload
                  value={editForm.logo||''}
                  onChange={v => setEditForm(f=>({...f, logo:v}))}
                  label="🖼️ Logo POS — pou soti sou ticket"
                />
              </div>

              {/* INFOS DEBAZ */}
              <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#333' }}>
                📋 Enfòmasyon Debaz
              </h4>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  ['nom','Non POS'],['adresse','Adrès'],
                  ['telephone','Telefòn'],['succursale','Succursale'],
                ].map(([key,label]) => (
                  <div key={key}>
                    <label style={{ display:'block', fontWeight:700, fontSize:11,
                      marginBottom:4, color:'#555' }}>{label}</label>
                    <input value={editForm[key]||''}
                      onChange={e => setEditForm(f=>({...f,[key]:e.target.value}))}
                      style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd',
                        borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>

              {/* PARAMÈT */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:11, marginBottom:4 }}>Prime</label>
                  <select value={editForm.prime||'60|20|10'}
                    onChange={e => setEditForm(f=>({...f,prime:e.target.value}))}
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13 }}>
                    {['60|20|10','50|15|5','70|25|15'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:11, marginBottom:4 }}>% Ajan</label>
                  <input type="number" min="0" max="100" value={editForm.agentPct||0}
                    onChange={e => setEditForm(f=>({...f,agentPct:e.target.value}))}
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd',
                      borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:11, marginBottom:4 }}>Kredi</label>
                  <input value={editForm.credit||'Illimité'}
                    onChange={e => setEditForm(f=>({...f,credit:e.target.value}))}
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd',
                      borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              </div>

              {/* TETE FICH */}
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe',
                borderRadius:10, padding:12, marginBottom:14 }}>
                <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#1e40af' }}>
                  🖨️ Tete Fich
                </h4>
                {[['tete1','Liy 1'],['tete2','Liy 2'],['tete3','Liy 3'],['tete4','Liy 4']].map(([key,label]) => (
                  <div key={key} style={{ marginBottom:8 }}>
                    <label style={{ display:'block', fontWeight:700, fontSize:11,
                      marginBottom:3, color:'#1e40af' }}>{label}</label>
                    <input value={editForm[key]||''}
                      onChange={e => setEditForm(f=>({...f,[key]:e.target.value}))}
                      style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #bfdbfe',
                        borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>

              {/* MESSAGE ADMIN */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontWeight:800, fontSize:12,
                  marginBottom:6, color:'#92400e' }}>📢 Mesaj Admin</label>
                <textarea value={editForm.messageAdmin||''}
                  onChange={e => setEditForm(f=>({...f,messageAdmin:e.target.value}))}
                  rows={2}
                  style={{ width:'100%', padding:'10px', border:'1.5px solid #f59e0b',
                    borderRadius:8, fontSize:13, resize:'vertical',
                    boxSizing:'border-box', fontFamily:'inherit' }} />
              </div>

              {/* BOUTONS */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setEditPos(null)}
                  style={{ flex:1, padding:13, background:'#f3f4f6', border:'none',
                    borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                  Anile
                </button>
                <button onClick={saveEditPos} disabled={savingEdit}
                  style={{ flex:2, padding:13, background:savingEdit?'#ccc':'#1a73e8',
                    color:'white', border:'none', borderRadius:10,
                    fontWeight:900, cursor:savingEdit?'default':'pointer', fontSize:15 }}>
                  {savingEdit ? '⏳ Ap sove...' : '✅ Sove Tout Chanjman'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Composant table reusab ──────────────────────────────────────
function PosTable({ data, loading, cols, renderRow }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:'#f8f9fa' }}>
            {cols.map(h => (
              <th key={h} style={{ padding:'10px 12px', textAlign:'left',
                fontWeight:700, borderBottom:'2px solid #dee2e6', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? <tr><td colSpan={cols.length} style={{ padding:24, textAlign:'center', color:'#888' }}>
                ⏳ Ap chaje...
              </td></tr>
            : data.length === 0
            ? <tr><td colSpan={cols.length} style={{ padding:24, textAlign:'center',
                color:'#888', fontStyle:'italic' }}>
                Pa gen done — Klike "Ajouter POS"
              </td></tr>
            : data.map((r,i) => renderRow(r,i))
          }
        </tbody>
      </table>
    </div>
  );
}

// ── Composant Superviseur Tab ───────────────────────────────────
function SuperviseurTab({ superviseurs, agents, onRefresh, api }) {
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [form,     setForm]     = useState({
    nom:'', prenom:'', username:'', password:'', telephone:'', commission:0,
  });

  const handleSave = async () => {
    if (!form.nom || !form.prenom || !form.username || !form.password) {
      setMsg('❌ Ranpli tout chan obligatwa yo'); return;
    }
    setSaving(true);
    try {
      await api.post('/api/admin/agents', {
        nom:form.nom, prenom:form.prenom, username:form.username,
        password:form.password, telephone:form.telephone, role:'superviseur',
        commission:form.commission,
      });
      setMsg('✅ Superviseur kreye!');
      setShowForm(false);
      setForm({ nom:'', prenom:'', username:'', password:'', telephone:'', commission:0 });
      onRefresh();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Erè — eseye ankò'); }
    finally { setSaving(false); }
  };

  const seen = new Set();
  const uniqueSups = [...superviseurs, ...agents.filter(a => a.role==='superviseur')]
    .filter(s => { const k = s.id||s._id; if (seen.has(k)) return false; seen.add(k); return true; });

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <h3 style={{ margin:0, fontWeight:800, color:'#7c3aed' }}>👔 Superviseurs</h3>
        <button onClick={() => setShowForm(true)}
          style={{ background:'#7c3aed', color:'white', border:'none', borderRadius:8,
            padding:'9px 16px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
          ➕ Kreye
        </button>
      </div>
      {msg && <div style={{ background:msg.startsWith('✅')?'#dcfce7':'#fee2e2',
        borderRadius:8, padding:10, marginBottom:10, fontWeight:700,
        color:msg.startsWith('✅')?'#16a34a':'#dc2626' }}>{msg}</div>}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#f3e8ff' }}>
              {['Non','Prenon','Pseudo','Rôl',''].map(h => (
                <th key={h} style={{ padding:'10px 12px', textAlign:'left',
                  fontWeight:700, borderBottom:'2px solid #7c3aed', color:'#7c3aed' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueSups.length === 0
              ? <tr><td colSpan={5} style={{ padding:24, textAlign:'center', color:'#888', fontStyle:'italic' }}>
                  Pa gen superviseur
                </td></tr>
              : uniqueSups.map((s,i) => (
                <tr key={s.id||s._id||i} style={{ borderBottom:'1px solid #e9d5ff',
                  background:i%2===0?'white':'#faf5ff' }}>
                  <td style={{ padding:'9px 12px', fontWeight:700 }}>{s.nom}</td>
                  <td style={{ padding:'9px 12px' }}>{s.prenom}</td>
                  <td style={{ padding:'9px 12px', color:'#7c3aed', fontWeight:700 }}>{s.username}</td>
                  <td style={{ padding:'9px 12px' }}>
                    <span style={{ background:'#f3e8ff', color:'#7c3aed', borderRadius:12,
                      padding:'3px 10px', fontWeight:700, fontSize:11 }}>superviseur</span>
                  </td>
                  <td style={{ padding:'9px 12px' }}>
                    <button onClick={() => {
                      if (confirm(`Efase ${s.prenom} ${s.nom}?`))
                        api.delete(`/api/admin/agents/${s.id||s._id}`).then(onRefresh).catch(()=>alert('Erè'));
                    }} style={{ background:'#dc2626', color:'white', border:'none',
                      borderRadius:6, padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                      Efase
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:500, padding:'0 0 40px' }}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3, margin:'12px auto 8px' }} />
            <div style={{ padding:'0 18px 16px', display:'flex', justifyContent:'space-between' }}>
              <h3 style={{ margin:0, fontWeight:900, color:'#7c3aed' }}>👔 Kreye Superviseur</h3>
              <button onClick={() => setShowForm(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>✕</button>
            </div>
            <div style={{ padding:'0 18px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                {[['nom','Non'],['prenom','Prenon'],['username','Pseudo (Login)'],
                  ['telephone','Telefòn'],['commission','% Komisyon']].map(([key,label]) => (
                  <div key={key}>
                    <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>{label}</label>
                    <input value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                      style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd',
                        borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                  </div>
                ))}
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Modpas</label>
                  <input type="password" value={form.password}
                    onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                    style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd',
                      borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:10 }}>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex:1, padding:13, background:saving?'#ccc':'#7c3aed', color:'white',
                    border:'none', borderRadius:10, fontWeight:900, fontSize:14,
                    cursor:saving?'not-allowed':'pointer' }}>
                  {saving ? '⏳...' : '✅ Kreye'}
                </button>
                <button onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:13, background:'#f1f5f9', color:'#555',
                    border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                  Anile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
