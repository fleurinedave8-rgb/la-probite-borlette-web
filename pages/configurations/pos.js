import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const FIELDS_CREATE = [
  { key:'posId',      label:'POS ID *',        type:'text',   ph:'ex: POS-001' },
  { key:'nom',        label:'Non POS *',        type:'text',   ph:'ex: POS Delmas 31' },
  { key:'adresse',    label:'Adrès',            type:'text',   ph:'ex: Rue Delmas 31' },
  { key:'telephone',  label:'Téléfòn',          type:'tel',    ph:'ex: 509-3700-0000' },
  { key:'agentUsername', label:'Username Ajan', type:'text',   ph:'ex: dave' },
  { key:'agentPct',   label:'% Komisyon Ajan',  type:'number', ph:'ex: 10' },
  { key:'supPct',     label:'% Komisyon Sup',   type:'number', ph:'ex: 5' },
  { key:'succursale', label:'Succursale',        type:'text',   ph:'ex: Central' },
  { key:'credit',     label:'Kredi',            type:'text',   ph:'Illimité' },
];

const FIELDS_EDIT = [
  ...FIELDS_CREATE,
  { key:'tete_ligne1', label:'Tèt Fich — Liy 1', type:'text', ph:'Non POS sou fich' },
  { key:'tete_ligne2', label:'Tèt Fich — Liy 2', type:'text', ph:'Adrès sou fich' },
  { key:'tete_ligne3', label:'Tèt Fich — Liy 3', type:'text', ph:'Téléfòn sou fich' },
  { key:'messageAdmin', label:'📢 Mesaj Admin', type:'text',   ph:'Mesaj pou ajan an' },
];

const DEF = { posId:'', nom:'', adresse:'', telephone:'', agentUsername:'',
              agentPct:'', supPct:'', succursale:'', credit:'Illimité',
              tete_ligne1:'', tete_ligne2:'', tete_ligne3:'', messageAdmin:'',
              newPassword:'', confirmPassword:'' };

export default function PosPage() {
  const [pos,       setPos]     = useState([]);
  const [loading,   setLoading] = useState(true);
  const [search,    setSearch]  = useState('');
  const [filtre,    setFiltre]  = useState('tous');
  const [showAdd,   setShowAdd] = useState(false);
  const [editPos,   setEditPos] = useState(null);
  const [form,      setForm]    = useState(DEF);
  const [saving,    setSaving]  = useState(false);
  const [msg,       setMsg]     = useState({ t:'', ok:true });
  const [tab,       setTab]     = useState('liste'); // liste | stats
  const [delConf,   setDelConf] = useState(null);
  const fileRef = useRef();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/pos');
      setPos(Array.isArray(r.data) ? r.data : []);
    } catch { setPos([]); }
    setLoading(false);
  };

  const notify = (t, ok=true) => { setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3500); };

  const openAdd = () => {
    setForm(DEF); setEditPos(null);
    setShowAdd(true);
  };

  const openEdit = (p) => {
    setForm({
      posId:       p.posId||'',
      nom:         p.nom||'',
      adresse:     p.adresse||'',
      telephone:   p.telephone||'',
      agentUsername: p.agentUsername||'',
      agentPct:    p.agentPct||'',
      supPct:      p.supPct||'',
      succursale:  p.succursale||'',
      credit:      p.credit||'Illimité',
      tete_ligne1: p.tete?.ligne1||p.nom||'',
      tete_ligne2: p.tete?.ligne2||p.adresse||'',
      tete_ligne3: p.tete?.ligne3||p.telephone||'',
      messageAdmin:p.messageAdmin||'',
      logo:        p.logo||'',
      newPassword:    '',
      confirmPassword:'',
    });
    setEditPos(p);
    setShowAdd(true);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { notify('⚠️ Imaj twò gwo (max 500KB)', false); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({...f, logo: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.posId.trim() || !form.nom.trim()) {
      notify('⚠️ POS ID ak Non obligatwa!', false); return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      notify('⚠️ Modpas yo pa menm!', false); return;
    }
    if (form.newPassword && form.newPassword.length < 4) {
      notify('⚠️ Modpas dwe gen omwen 4 karaktè!', false); return;
    }
    setSaving(true);
    try {
      // Retire champ UI ki pa ale nan backend
      const { newPassword, confirmPassword, ...formData } = form;
      const payload = {
        ...formData,
        agentPct: Number(form.agentPct)||0,
        supPct:   Number(form.supPct)||0,
        tete: {
          ligne1: form.tete_ligne1 || form.nom,
          ligne2: form.tete_ligne2 || form.adresse,
          ligne3: form.tete_ligne3 || form.telephone,
          ligne4: 'Fich sa valid pou 90 jou',
        },
      };
      if (editPos) {
        await api.put(`/api/admin/pos/${editPos._id}`, payload);
        // Si admin bay nouvo modpas — chanje modpas ajan an tou
        if (form.newPassword && form.agentUsername) {
          try {
            // Chèche ajan pa username
            const agRes = await api.get('/api/admin/agents');
            const agent = (agRes.data||[]).find(a => a.username===form.agentUsername);
            if (agent) {
              await api.put(`/api/admin/agents/${agent.id||agent._id}`,
                { password: form.newPassword });
            }
          } catch {}
        }
        notify('✅ POS modifye avèk siksè!');
      } else {
        await api.post('/api/admin/pos', payload);
        notify('✅ POS kreye avèk siksè!');
      }
      setShowAdd(false);
      await load();
    } catch (e) {
      notify(`❌ ${e?.response?.data?.message || 'Erè sèvè'}`, false);
    }
    setSaving(false);
  };

  const handleToggle = async (p) => {
    try {
      await api.put(`/api/admin/pos/${p._id}/toggle`);
      await load();
      notify(`✅ ${p.nom} ${p.actif?'dezaktive':'aktive'}`);
    } catch { notify('❌ Erè', false); }
  };

  const handleDelete = async (p) => {
    try {
      await api.delete(`/api/admin/pos/${p._id}`);
      setDelConf(null);
      await load();
      notify('🗑️ POS efase');
    } catch { notify('❌ Erè', false); }
  };

  const fiveMinAgo = Date.now() - 5*60*1000;
  const filtered = pos
    .filter(p => {
      if (filtre==='actif')     return p.actif!==false;
      if (filtre==='inactif')   return p.actif===false;
      if (filtre==='connecte')  return p.lastSeen && new Date(p.lastSeen).getTime()>fiveMinAgo;
      return true;
    })
    .filter(p => !search || [p.nom,p.posId,p.adresse,p.agentUsername,p.succursale]
      .some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));

  const nbActif    = pos.filter(p=>p.actif!==false).length;
  const nbConnect  = pos.filter(p=>p.lastSeen&&new Date(p.lastSeen).getTime()>fiveMinAgo).length;

  const inp = (key, label, type='text', ph='') => (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:'block', fontWeight:700, fontSize:12,
        marginBottom:4, color:'#555' }}>{label}</label>
      <input type={type} value={form[key]||''}
        onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
        placeholder={ph}
        style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
          borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 8px 40px' }}>

        {/* ── BANNIÈRE ── */}
        <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12, padding:'14px 20px', marginBottom:14,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'#f59e0b', fontWeight:900, fontSize:18 }}>🖥️ JESYON POS</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>LA-PROBITE-BORLETTE</div>
          </div>
          <button onClick={openAdd}
            style={{ background:'#f59e0b', color:'#111', border:'none', borderRadius:10,
              padding:'10px 18px', fontWeight:900, fontSize:13, cursor:'pointer' }}>
            ➕ Ajoute POS
          </button>
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

        {/* STATS KARD */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
          {[
            { v:pos.length,   l:'Total POS',   c:'#1a73e8', k:'tous' },
            { v:nbActif,      l:'✅ Aktif',     c:'#16a34a', k:'actif' },
            { v:pos.length-nbActif, l:'❌ Inaktif', c:'#dc2626', k:'inactif' },
            { v:nbConnect,    l:'🟢 Konekte',  c:'#7c3aed', k:'connecte' },
          ].map(st => (
            <div key={st.k} onClick={() => setFiltre(filtre===st.k?'tous':st.k)}
              style={{ background: filtre===st.k ? st.c : 'white',
                borderRadius:10, padding:'12px 10px', textAlign:'center',
                cursor:'pointer', border:`2px solid ${filtre===st.k?st.c:'#e5e7eb'}`,
                transition:'all .15s' }}>
              <div style={{ fontWeight:900, fontSize:24,
                color: filtre===st.k?'white':st.c }}>{st.v}</div>
              <div style={{ fontSize:11, fontWeight:700,
                color: filtre===st.k?'rgba(255,255,255,0.85)':'#888' }}>{st.l}</div>
            </div>
          ))}
        </div>

        {/* RECHÈCH */}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Rechèch pa non, ID, ajan, adrès..."
          style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #ddd',
            borderRadius:10, fontSize:13, marginBottom:12, boxSizing:'border-box' }} />

        {/* LIS POS */}
        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'#888' }}>⏳ Ap chaje...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:48, background:'white',
            borderRadius:12, color:'#aaa' }}>Pa gen POS</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:12 }}>
            {filtered.map(p => {
              const connecte = p.lastSeen && new Date(p.lastSeen).getTime() > fiveMinAgo;
              return (
                <div key={p._id}
                  style={{ background:'white', borderRadius:12, padding:16,
                    boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                    borderLeft:`5px solid ${connecte?'#16a34a':p.actif!==false?'#1a73e8':'#dc2626'}` }}>

                  {/* Header */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    {/* Logo */}
                    <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden',
                      flexShrink:0, background:'#f1f5f9',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      border:'2px solid #e5e7eb' }}>
                      {p.logo
                        ? <img src={p.logo} alt="logo"
                            style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontWeight:900, fontSize:20, color:'#94a3b8' }}>
                            {(p.nom||'?')[0].toUpperCase()}
                          </span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:900, fontSize:16, color:'#111',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {p.nom}
                      </div>
                      <div style={{ fontFamily:'monospace', fontSize:12,
                        color:'#1a73e8', fontWeight:700 }}>{p.posId}</div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%',
                          background: connecte?'#16a34a':'#9ca3af',
                          boxShadow: connecte?'0 0 6px #16a34a':'none' }} />
                        <span style={{ fontSize:11, fontWeight:700,
                          color: connecte?'#16a34a':'#9ca3af' }}>
                          {connecte?'Online':'Offline'}
                        </span>
                      </div>
                      <span style={{ background: p.actif!==false?'#dcfce7':'#fee2e2',
                        color: p.actif!==false?'#16a34a':'#dc2626',
                        borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:800 }}>
                        {p.actif!==false?'✅ Aktif':'❌ Inaktif'}
                      </span>
                    </div>
                  </div>

                  {/* Detay */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6,
                    fontSize:11, marginBottom:12 }}>
                    {[
                      ['👤 Ajan',    p.agentUsername||'—'],
                      ['🏢 Sucursal', p.succursale||'—'],
                      ['📍 Adrès',   p.adresse||'—'],
                      ['📞 Tél',     p.telephone||'—'],
                      ['💰 %Ajan',   `${p.agentPct||0}%`],
                      ['💼 %Sup',    `${p.supPct||0}%`],
                    ].map(([l,v]) => (
                      <div key={l} style={{ background:'#f8f9fa', borderRadius:6, padding:'5px 8px' }}>
                        <div style={{ color:'#888', marginBottom:1, fontSize:10 }}>{l}</div>
                        <div style={{ fontWeight:700, color:'#374151',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tèt Fich si konfigire */}
                  {p.tete?.ligne1 && (
                    <div style={{ background:'#f0fdf4', borderRadius:6, padding:'6px 10px',
                      marginBottom:10, fontSize:11, borderLeft:'3px solid #16a34a' }}>
                      <div style={{ color:'#666', marginBottom:2, fontWeight:700 }}>🖨️ Tèt Fich:</div>
                      <div style={{ color:'#166534', fontWeight:700 }}>{p.tete.ligne1}</div>
                      {p.tete.ligne2 && <div style={{ color:'#166534' }}>{p.tete.ligne2}</div>}
                    </div>
                  )}

                  {/* Aksyon */}
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openEdit(p)}
                      style={{ flex:1, background:'#1a73e8', color:'white', border:'none',
                        borderRadius:8, padding:'9px', fontWeight:700,
                        cursor:'pointer', fontSize:12 }}>
                      ✏️ Modifye
                    </button>
                    <button onClick={() => handleToggle(p)}
                      style={{ flex:1, background: p.actif!==false?'#fef9c3':'#dcfce7',
                        color: p.actif!==false?'#854d0e':'#166534', border:'none',
                        borderRadius:8, padding:'9px', fontWeight:700,
                        cursor:'pointer', fontSize:12 }}>
                      {p.actif!==false?'🔒 Dezaktive':'🔓 Aktive'}
                    </button>
                    <button onClick={() => setDelConf(p)}
                      style={{ background:'#fee2e2', color:'#dc2626', border:'none',
                        borderRadius:8, padding:'9px 12px', fontWeight:700,
                        cursor:'pointer', fontSize:14 }}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ MODAL AJOUTE / MODIFYE ════ */}
        {showAdd && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            zIndex:2000, display:'flex', alignItems:'flex-end',
            justifyContent:'center' }}
            onClick={() => setShowAdd(false)}>
            <div style={{ background:'white', borderRadius:'20px 20px 0 0',
              width:'100%', maxWidth:580, maxHeight:'92vh', overflowY:'auto',
              padding:'0 0 50px' }}
              onClick={e => e.stopPropagation()}>

              <div style={{ position:'sticky', top:0, background:'white',
                padding:'12px 20px 16px', borderBottom:'1px solid #f0f0f0',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                zIndex:10 }}>
                <div>
                  <div style={{ width:44,height:5,background:'#ddd',
                    borderRadius:3,margin:'0 auto 10px'}} />
                  <div style={{ fontWeight:900, fontSize:17 }}>
                    {editPos ? `✏️ Modifye: ${editPos.nom}` : '➕ Nouvo POS'}
                  </div>
                </div>
                <button onClick={() => setShowAdd(false)}
                  style={{ background:'none', border:'none', fontSize:24,
                    cursor:'pointer', color:'#888', padding:4 }}>✕</button>
              </div>

              <div style={{ padding:'16px 20px' }}>

                {/* LOGO */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    marginBottom:6, color:'#555' }}>🖼️ Logo POS (opsyonèl)</label>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:64, height:64, borderRadius:10,
                      background:'#f1f5f9', border:'2px dashed #ddd',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      overflow:'hidden', flexShrink:0 }}>
                      {form.logo
                        ? <img src={form.logo} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontSize:28, color:'#ccc' }}>🖥️</span>}
                    </div>
                    <div>
                      <input type="file" ref={fileRef} style={{ display:'none' }}
                        accept="image/*" onChange={handleLogoUpload} />
                      <button onClick={() => fileRef.current?.click()}
                        style={{ background:'#1a73e8', color:'white', border:'none',
                          borderRadius:8, padding:'8px 16px', fontWeight:700,
                          cursor:'pointer', fontSize:12, marginBottom:4 }}>
                        📁 Chwazi Imaj
                      </button>
                      {form.logo && (
                        <button onClick={() => setForm(f=>({...f,logo:''}))}
                          style={{ background:'#fee2e2', color:'#dc2626', border:'none',
                            borderRadius:8, padding:'8px 12px', fontWeight:700,
                            cursor:'pointer', fontSize:12, marginLeft:6 }}>
                          ✕ Retire
                        </button>
                      )}
                      <div style={{ fontSize:11, color:'#888', marginTop:3 }}>
                        Max 500KB · PNG, JPG, WEBP
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEKYON INFO PRENSIPAL */}
                <div style={{ fontWeight:800, fontSize:13, color:'#1a73e8',
                  marginBottom:10, paddingBottom:6, borderBottom:'2px solid #eff6ff' }}>
                  📋 Enfòmasyon Debaz
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                  {inp('posId','POS ID *','text','ex: POS-001')}
                  {inp('nom','Non POS *','text','ex: POS Delmas 31')}
                </div>
                {inp('adresse','Adrès','text','ex: Rue Delmas 31')}
                {inp('telephone','Téléfòn','tel','ex: 509-3700-0000')}
                {inp('succursale','Succursale','text','ex: Central')}

                <div style={{ fontWeight:800, fontSize:13, color:'#16a34a',
                  margin:'14px 0 10px', paddingBottom:6, borderBottom:'2px solid #f0fdf4' }}>
                  👤 Ajan & Komisyon
                </div>
                {inp('agentUsername','Username Ajan','text','ex: dave')}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {inp('agentPct','% Komisyon Ajan','number','ex: 10')}
                  {inp('supPct','% Komisyon Sup','number','ex: 5')}
                </div>
                {inp('credit','Kredi','text','Illimité')}

                {editPos && (
                  <>
                    <div style={{ fontWeight:800, fontSize:13, color:'#7c3aed',
                      margin:'14px 0 10px', paddingBottom:6, borderBottom:'2px solid #f5f3ff' }}>
                      🖨️ Tèt Fich (Enpresyon)
                    </div>
                    {inp('tete_ligne1','Liy 1 — Non sou fich','text','Non POS')}
                    {inp('tete_ligne2','Liy 2 — Adrès sou fich','text','Adrès')}
                    {inp('tete_ligne3','Liy 3 — Téléfòn sou fich','text','Téléfòn')}

                    <div style={{ fontWeight:800, fontSize:13, color:'#f59e0b',
                      margin:'14px 0 10px', paddingBottom:6, borderBottom:'2px solid #fefce8' }}>
                      📢 Mesaj Admin pou Ajan
                    </div>
                    <div style={{ marginBottom:16 }}>
                      <textarea value={form.messageAdmin||''}
                        onChange={e=>setForm(f=>({...f,messageAdmin:e.target.value}))}
                        placeholder="Mesaj ki ap parèt nan aplikasyon ajan an..."
                        rows={3}
                        style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                          borderRadius:8, fontSize:14, boxSizing:'border-box',
                          resize:'vertical', fontFamily:'inherit' }} />
                    </div>

                    {/* MODPAS AJAN */}
                    <div style={{ fontWeight:800, fontSize:13, color:'#7c3aed',
                      margin:'14px 0 10px', paddingBottom:6, borderBottom:'2px solid #f5f3ff' }}>
                      🔐 Chanje Modpas Ajan (opsyonèl)
                    </div>
                    <div style={{ background:'#f5f3ff', borderRadius:8, padding:'10px 14px',
                      marginBottom:12, fontSize:12, color:'#7c3aed', fontWeight:700 }}>
                      ℹ️ Kite vid si ou pa vle chanje modpas la
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:6 }}>
                      <div>
                        <label style={{ display:'block', fontWeight:700, fontSize:12,
                          marginBottom:4, color:'#555' }}>Nouvo Modpas</label>
                        <input type="password" value={form.newPassword||''}
                          onChange={e=>setForm(f=>({...f,newPassword:e.target.value}))}
                          placeholder="Minimum 4 karaktè"
                          style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                            borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontWeight:700, fontSize:12,
                          marginBottom:4, color:'#555' }}>Konfime Modpas</label>
                        <input type="password" value={form.confirmPassword||''}
                          onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))}
                          placeholder="Repete modpas la"
                          style={{ width:'100%', padding:'10px 12px',
                            border: form.confirmPassword && form.confirmPassword!==form.newPassword
                              ? '1.5px solid #dc2626'
                              : form.confirmPassword && form.confirmPassword===form.newPassword
                              ? '1.5px solid #16a34a'
                              : '1.5px solid #ddd',
                            borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                      </div>
                    </div>
                    {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                      <div style={{ color:'#dc2626', fontSize:12, fontWeight:700, marginBottom:8 }}>
                        ❌ Modpas yo pa menm!
                      </div>
                    )}
                    {form.confirmPassword && form.confirmPassword === form.newPassword && form.newPassword && (
                      <div style={{ color:'#16a34a', fontSize:12, fontWeight:700, marginBottom:8 }}>
                        ✅ Modpas yo matche!
                      </div>
                    )}
                  </>
                )}

                {/* MODPAS — sèlman pou kreye */}
                {!editPos && (
                  <>
                    <div style={{ fontWeight:800, fontSize:13, color:'#dc2626',
                      margin:'14px 0 10px', paddingBottom:6, borderBottom:'2px solid #fef2f2' }}>
                      🔐 Aksè Aplikasyon
                    </div>
                    <div style={{ background:'#fef9c3', border:'1px solid #fde68a',
                      borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12,
                      color:'#854d0e', fontWeight:700 }}>
                      ℹ️ Apre kreye POS la, ale nan <strong>Itilizatè</strong> pou ba ajan an modpas li.
                      Username se <strong>{form.agentUsername||'username ajan'}</strong>.
                    </div>
                  </>
                )}

                <button onClick={handleSave} disabled={saving}
                  style={{ width:'100%', padding:'14px',
                    background: saving ? '#ccc' : editPos ? '#1a73e8' : '#16a34a',
                    color:'white', border:'none', borderRadius:12,
                    fontWeight:900, fontSize:15, cursor: saving?'default':'pointer',
                    marginTop:6 }}>
                  {saving ? '⏳...' : editPos ? '✅ Sove Modifikasyon' : '✅ Kreye POS'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ KONFIRMASYON EFASE ════ */}
        {delConf && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center',
            padding:20 }} onClick={() => setDelConf(null)}>
            <div style={{ background:'white', borderRadius:16, padding:28,
              maxWidth:360, width:'100%', textAlign:'center' }}
              onClick={e=>e.stopPropagation()}>
              <div style={{ fontSize:44, marginBottom:12 }}>🗑️</div>
              <div style={{ fontWeight:900, fontSize:17, marginBottom:8 }}>
                Efase POS sa?
              </div>
              <div style={{ color:'#555', fontSize:13, marginBottom:6 }}>
                <strong>{delConf.nom}</strong> — {delConf.posId}
              </div>
              <div style={{ color:'#dc2626', fontSize:12, marginBottom:20, fontWeight:700 }}>
                ⚠️ Tout done POS sa ap pèdi!
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setDelConf(null)}
                  style={{ flex:1, padding:'11px', background:'#f3f4f6', border:'none',
                    borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 }}>
                  Anile
                </button>
                <button onClick={() => handleDelete(delConf)}
                  style={{ flex:1, padding:'11px', background:'#dc2626', color:'white',
                    border:'none', borderRadius:10, fontWeight:900, cursor:'pointer', fontSize:14 }}>
                  Efase
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
