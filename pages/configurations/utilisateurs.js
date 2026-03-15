import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

async function getAgents()        { return api.get('/api/admin/agents'); }
async function createAgent(d)     { return api.post('/api/admin/agents', d); }
async function updateAgent(id, d) { return api.put(`/api/admin/agents/${id}`, d); }

export default function Utilisateurs() {
  const [users,     setUsers]    = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [search,    setSearch]   = useState('');
  const [filtre,    setFiltre]   = useState('tous');

  // Modal kreye/edite
  const [showModal, setShowModal]= useState(false);
  const [editUser,  setEditUser] = useState(null);
  const [form,      setForm]     = useState({ nom:'',prenom:'',username:'',password:'',role:'agent',telephone:'' });
  const [saving,    setSaving]   = useState(false);
  const [error,     setError]    = useState('');

  // Modal modpas sèlman
  const [showPwd,   setShowPwd]  = useState(false);
  const [pwdUser,   setPwdUser]  = useState(null);
  const [newPwd,    setNewPwd]   = useState('');
  const [confirmPwd,setConfirmPwd]=useState('');
  const [showPwdTxt,setShowPwdTxt]=useState(false);
  const [savingPwd, setSavingPwd]= useState(false);

  const [msg,       setMsg]      = useState({ t:'', ok:true });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const r = await getAgents(); setUsers(r.data||[]); } catch {}
    setLoading(false);
  };

  const notify = (t, ok=true) => { setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3500); };

  const openCreate = () => {
    setEditUser(null);
    setForm({nom:'',prenom:'',username:'',password:'',role:'agent',telephone:''});
    setError('');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({nom:u.nom,prenom:u.prenom||'',username:u.username,
             password:'',role:u.role||'agent',telephone:u.telephone||''});
    setError('');
    setShowModal(true);
  };

  const openPwd = (u) => {
    setPwdUser(u);
    setNewPwd(''); setConfirmPwd(''); setShowPwdTxt(false);
    setShowPwd(true);
  };

  const handleSave = async () => {
    if (!form.nom || !form.username) { setError('Non ak Username obligatwa!'); return; }
    if (!editUser && !form.password)  { setError('Modpas obligatwa pou nouvo ajan!'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // pa chanje si vid
      if (editUser) await updateAgent(editUser.id || editUser._id, payload);
      else          await createAgent(payload);
      setShowModal(false);
      await load();
      notify(editUser ? '✅ Itilizatè modifye!' : '✅ Itilizatè kreye!');
    } catch (err) { setError(err.response?.data?.message||'Erè sèvè'); }
    setSaving(false);
  };

  const handleChangePwd = async () => {
    if (!newPwd || newPwd.length < 4) {
      alert('Modpas dwe gen omwen 4 karaktè!'); return;
    }
    if (newPwd !== confirmPwd) {
      alert('Modpas yo pa menm!'); return;
    }
    setSavingPwd(true);
    try {
      await updateAgent(pwdUser.id || pwdUser._id, { password: newPwd });
      setShowPwd(false);
      notify(`🔐 Modpas ${pwdUser.username} chanje avèk siksè!`);
    } catch (e) {
      notify('❌ Erè — pa kapab chanje modpas', false);
    }
    setSavingPwd(false);
  };

  const handleToggle = async (u) => {
    try {
      await updateAgent(u.id||u._id, { actif: !u.actif });
      await load();
      notify(`✅ ${u.username} ${u.actif?'dezaktive':'aktive'}`);
    } catch { notify('❌ Erè', false); }
  };

  const filtered = users
    .filter(u => {
      if (filtre==='actif')   return u.actif!==false;
      if (filtre==='inactif') return u.actif===false;
      return true;
    })
    .filter(u => !search || [u.nom,u.prenom,u.username,u.role,u.telephone]
      .some(v => String(v||'').toLowerCase().includes(search.toLowerCase())));

  const ROLES = {
    admin:       { bg:'#fef3c7', color:'#92400e', label:'Admin' },
    agent:       { bg:'#eff6ff', color:'#1d4ed8', label:'Agent' },
    superviseur: { bg:'#f0fdf4', color:'#166534', label:'Superviseur' },
  };

  const inp = (key, label, type='text', ph='') => (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:'block', fontSize:12, color:'#555',
        marginBottom:4, fontWeight:700 }}>{label}</label>
      <input type={type} value={form[key]||''}
        onChange={e => setForm(p=>({...p,[key]:e.target.value}))}
        placeholder={ph}
        style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
          borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 8px 40px' }}>

        {/* BANNIÈRE */}
        <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12, padding:'14px 20px', marginBottom:14,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'#f59e0b', fontWeight:900, fontSize:18 }}>👥 ITILIZATÈ & AJAN</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>LA-PROBITE-BORLETTE</div>
          </div>
          <button onClick={openCreate}
            style={{ background:'#f59e0b', color:'#111', border:'none', borderRadius:10,
              padding:'10px 18px', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            ➕ Nouvo Itilizatè
          </button>
        </div>

        {/* NOTIF */}
        {msg.t && (
          <div style={{ background:msg.ok?'#dcfce7':'#fee2e2',
            border:`1.5px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color:msg.ok?'#166534':'#991b1b',
            padding:'10px 16px', borderRadius:10, marginBottom:12, fontWeight:700 }}>
            {msg.t}
          </div>
        )}

        {/* FILTÈ + RECHÈCH */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          {[['tous','Tout'],['actif','✅ Aktif'],['inactif','❌ Inaktif']].map(([k,l]) => (
            <button key={k} onClick={() => setFiltre(k)}
              style={{ padding:'9px 16px', borderRadius:10, fontWeight:700, fontSize:12,
                cursor:'pointer', border:'2px solid ' + (filtre===k?'#1a73e8':'#e5e7eb'),
                background: filtre===k?'#1a73e8':'white',
                color: filtre===k?'white':'#374151' }}>
              {l}
            </button>
          ))}
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Non, username, rôl..."
            style={{ flex:1, minWidth:180, padding:'9px 14px', border:'1.5px solid #ddd',
              borderRadius:10, fontSize:13 }} />
        </div>

        {/* TABLE */}
        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'#888' }}>⏳ Ap chaje...</div>
        ) : (
          <div style={{ background:'white', borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflow:'hidden' }}>
            <div style={{ background:'#1a73e8', padding:'12px 16px' }}>
              <span style={{ color:'white', fontWeight:900, fontSize:14 }}>
                👥 {filtered.length} itilizatè
              </span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                    {['#','Non Konplè','Username','Rôl','Téléfòn','Statut','Aksyon'].map(h => (
                      <th key={h} style={{ padding:'10px 12px', fontWeight:800,
                        fontSize:11, color:'#374151', textAlign:'left',
                        whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding:32, textAlign:'center',
                      color:'#aaa', fontStyle:'italic' }}>
                      Pa gen itilizatè
                    </td></tr>
                  ) : filtered.map((u, i) => {
                    const rCfg = ROLES[u.role||'agent'] || ROLES.agent;
                    return (
                      <tr key={u.id||u._id}
                        style={{ borderBottom:'1px solid #f3f4f6',
                          background: u.actif===false?'#fef2f2':i%2===0?'white':'#fafafa' }}>
                        <td style={{ padding:'11px 12px', color:'#888', fontWeight:700 }}>{i+1}</td>
                        <td style={{ padding:'11px 12px', fontWeight:700, color:'#111' }}>
                          {u.prenom||''} {u.nom||'—'}
                        </td>
                        <td style={{ padding:'11px 12px', fontFamily:'monospace',
                          fontWeight:800, color:'#1a73e8' }}>
                          {u.username}
                        </td>
                        <td style={{ padding:'11px 12px' }}>
                          <span style={{ background:rCfg.bg, color:rCfg.color,
                            borderRadius:20, padding:'3px 10px',
                            fontSize:11, fontWeight:800 }}>
                            {rCfg.label}
                          </span>
                        </td>
                        <td style={{ padding:'11px 12px', color:'#555', fontSize:12 }}>
                          {u.telephone||'—'}
                        </td>
                        <td style={{ padding:'11px 12px' }}>
                          <span style={{ background: u.actif!==false?'#dcfce7':'#fee2e2',
                            color: u.actif!==false?'#166534':'#991b1b',
                            borderRadius:20, padding:'3px 10px',
                            fontSize:11, fontWeight:800 }}>
                            {u.actif!==false?'✅ Aktif':'❌ Inaktif'}
                          </span>
                        </td>
                        <td style={{ padding:'11px 12px' }}>
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            {/* Modifye info */}
                            <button onClick={() => openEdit(u)}
                              style={{ background:'#f59e0b', color:'white', border:'none',
                                borderRadius:7, padding:'6px 10px', fontWeight:700,
                                cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}>
                              ✏️ Modifye
                            </button>
                            {/* Chanje modpas — bouton SEPARE ki parèt kla */}
                            <button onClick={() => openPwd(u)}
                              style={{ background:'#7c3aed', color:'white', border:'none',
                                borderRadius:7, padding:'6px 10px', fontWeight:700,
                                cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}>
                              🔐 Modpas
                            </button>
                            {/* Toggle aktif */}
                            <button onClick={() => handleToggle(u)}
                              style={{ background: u.actif!==false?'#fee2e2':'#dcfce7',
                                color: u.actif!==false?'#dc2626':'#16a34a', border:'none',
                                borderRadius:7, padding:'6px 8px', fontWeight:700,
                                cursor:'pointer', fontSize:13 }}>
                              {u.actif!==false?'🔒':'🔓'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════ MODAL KREYE / EDITE ════ */}
        {showModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowModal(false)}>
            <div style={{ background:'white', borderRadius:'20px 20px 0 0',
              width:'100%', maxWidth:500, padding:'0 0 44px',
              maxHeight:'90vh', overflowY:'auto' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ position:'sticky', top:0, background:'white',
                padding:'12px 20px 14px', borderBottom:'1px solid #f0f0f0',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ width:44,height:5,background:'#ddd',
                    borderRadius:3,margin:'0 auto 10px'}} />
                  <div style={{ fontWeight:900, fontSize:17 }}>
                    {editUser ? `✏️ Modifye: ${editUser.username}` : '➕ Nouvo Itilizatè'}
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  style={{ background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#888' }}>
                  ✕
                </button>
              </div>
              <div style={{ padding:'16px 20px' }}>
                {error && (
                  <div style={{ background:'#fef2f2', border:'1px solid #dc2626',
                    borderRadius:8, padding:'10px 14px', marginBottom:14,
                    color:'#dc2626', fontSize:13, fontWeight:700 }}>
                    ❌ {error}
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {inp('nom','Non *','text','Dupont')}
                  {inp('prenom','Prénom','text','Jean')}
                </div>
                {inp('username','Username *','text','ex: dave')}
                {inp('telephone','Téléfòn','tel','ex: 509-3700-0000')}

                {/* Modpas — obligatwa sèlman pou kreye */}
                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:12, color:'#555',
                    marginBottom:4, fontWeight:700 }}>
                    {editUser ? '🔑 Nouvo Modpas (kite vid pou pa chanje)' : '🔑 Modpas *'}
                  </label>
                  <input type="password" value={form.password}
                    onChange={e => setForm(p=>({...p,password:e.target.value}))}
                    placeholder={editUser ? '—— pa chanje ——' : 'Minimum 4 karaktè'}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                      borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                  {editUser && (
                    <div style={{ fontSize:11, color:'#888', marginTop:3 }}>
                      ℹ️ Kite vid si ou pa vle chanje modpas la. Itilize bouton <strong>🔐 Modpas</strong> pou reset rapid.
                    </div>
                  )}
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontSize:12, color:'#555',
                    marginBottom:4, fontWeight:700 }}>Rôl</label>
                  <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                      borderRadius:8, fontSize:14 }}>
                    <option value="agent">Agent (POS)</option>
                    <option value="superviseur">Superviseur</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button onClick={handleSave} disabled={saving}
                  style={{ width:'100%', padding:'14px',
                    background: saving?'#ccc':'#1a73e8',
                    color:'white', border:'none', borderRadius:12,
                    fontWeight:900, fontSize:15, cursor: saving?'default':'pointer' }}>
                  {saving ? '⏳...' : editUser ? '✅ Sove Chanjman' : '✅ Kreye Itilizatè'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ MODAL CHANJE MODPAS ════ */}
        {showPwd && pwdUser && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
            zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center',
            padding:20 }} onClick={() => setShowPwd(false)}>
            <div style={{ background:'white', borderRadius:16, padding:28,
              maxWidth:400, width:'100%' }} onClick={e=>e.stopPropagation()}>

              {/* Header */}
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:48, marginBottom:8 }}>🔐</div>
                <div style={{ fontWeight:900, fontSize:18 }}>Chanje Modpas</div>
                <div style={{ background:'#eff6ff', borderRadius:8, padding:'8px 14px',
                  marginTop:8, display:'inline-block' }}>
                  <span style={{ fontFamily:'monospace', fontWeight:900,
                    fontSize:16, color:'#1a73e8' }}>@{pwdUser.username}</span>
                  <span style={{ fontSize:12, color:'#888', marginLeft:6 }}>
                    {pwdUser.prenom} {pwdUser.nom}
                  </span>
                </div>
              </div>

              {/* Nouvo modpas */}
              <div style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12,
                  marginBottom:4, color:'#555' }}>Nouvo Modpas *</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPwdTxt ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Minimum 4 karaktè"
                    autoComplete="new-password"
                    style={{ width:'100%', padding:'11px 44px 11px 12px',
                      border:'2px solid #7c3aed', borderRadius:10,
                      fontSize:15, fontWeight:700, boxSizing:'border-box',
                      fontFamily:'monospace' }} />
                  <button onClick={() => setShowPwdTxt(v=>!v)}
                    style={{ position:'absolute', right:10, top:'50%',
                      transform:'translateY(-50%)', background:'none',
                      border:'none', cursor:'pointer', fontSize:18, color:'#888' }}>
                    {showPwdTxt ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Konfime */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12,
                  marginBottom:4, color:'#555' }}>Konfime Modpas *</label>
                <input
                  type={showPwdTxt ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repete menm modpas la"
                  autoComplete="new-password"
                  style={{ width:'100%', padding:'11px 12px',
                    border: `2px solid ${confirmPwd && confirmPwd!==newPwd ? '#dc2626' : confirmPwd===newPwd && confirmPwd ? '#16a34a' : '#ddd'}`,
                    borderRadius:10, fontSize:15, fontWeight:700,
                    boxSizing:'border-box', fontFamily:'monospace' }} />
                {confirmPwd && confirmPwd !== newPwd && (
                  <div style={{ color:'#dc2626', fontSize:12, marginTop:3, fontWeight:700 }}>
                    ❌ Modpas yo pa menm!
                  </div>
                )}
                {confirmPwd && confirmPwd === newPwd && (
                  <div style={{ color:'#16a34a', fontSize:12, marginTop:3, fontWeight:700 }}>
                    ✅ Modpas yo matche!
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowPwd(false)}
                  style={{ flex:1, padding:'12px', background:'#f3f4f6', border:'none',
                    borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 }}>
                  Anile
                </button>
                <button onClick={handleChangePwd} disabled={savingPwd}
                  style={{ flex:2, padding:'12px',
                    background: savingPwd||!newPwd||newPwd!==confirmPwd ? '#ccc' : '#7c3aed',
                    color:'white', border:'none', borderRadius:10,
                    fontWeight:900, cursor: savingPwd?'default':'pointer', fontSize:14 }}>
                  {savingPwd ? '⏳...' : '🔐 Chanje Modpas'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
