import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const PRIMES = ['60/20/10', '50/15/5', '70/25/15', '80/30/20', 'Personnalisé'];

export default function SuccursalPage() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState({ text:'', ok:true });
  const [filter,  setFilter]  = useState('tous');

  const [showAdd,      setShowAdd]      = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);  // Modifier + POS ID + Logo
  const [showLimite,   setShowLimite]   = useState(false);
  const [showPrime,    setShowPrime]    = useState(false);
  const [showDetay,    setShowDetay]    = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [editTab,      setEditTab]      = useState('info'); // 'info' | 'pos'

  const emptyForm = { nom:'', bank:'', limite:'', limiteGain:'', prime:'60/20/10', message:'', mariage:false };
  const [form,   setForm]   = useState(emptyForm);
  const [posId,  setPosId]  = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoB64, setLogoB64] = useState('');
  const fileRef = useRef();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/succursales');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch { setList([]); }
    setLoading(false);
  };

  const notify = (text, ok=true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text:'', ok:true }), 4000);
  };

  const openEdit = (s) => {
    setSelected(s);
    setForm({ ...s });
    setPosId(s.posId || '');
    setLogoPreview(s.logo || '');
    setLogoB64('');
    setEditTab('info');
    setShowEdit(true);
  };

  const handleSaveInfo = async () => {
    if (!form.nom) return alert('Non succursal obligatwa!');
    setSaving(true);
    try {
      await api.put(`/api/admin/succursales/${selected._id}`, form);
      notify('✅ Info modifye!'); setShowEdit(false); loadData();
    } catch (e) { alert('Erè: ' + e.message); }
    setSaving(false);
  };

  const handleSavePOS = async () => {
    if (!posId.trim()) return alert('POS ID obligatwa!');
    setSaving(true);
    try {
      const payload = { posId: posId.trim().toUpperCase() };
      if (logoB64) payload.logo = logoB64;
      await api.put(`/api/admin/succursales/${selected._id}/pos`, payload);
      notify('✅ POS ID ak Logo mete ajou!');
      setShowEdit(false); loadData();
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!form.nom) return alert('Non succursal obligatwa!');
    setSaving(true);
    try {
      await api.post('/api/admin/succursales', form);
      notify('✅ Succursal ajoute!');
      setShowAdd(false); setForm(emptyForm); loadData();
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSaving(false);
  };

  const handleLimite = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/succursales/${selected._id}`,
        { limite:form.limite, limiteGain:form.limiteGain });
      notify('✅ Limite mete ajou!'); setShowLimite(false); loadData();
    } catch (e) { alert('Erè: ' + e.message); }
    setSaving(false);
  };

  const handlePrime = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/succursales/${selected._id}`, { prime:form.prime });
      notify('✅ Prime mete ajou!'); setShowPrime(false); loadData();
    } catch (e) { alert('Erè: ' + e.message); }
    setSaving(false);
  };

  const handleToggle = async (s) => {
    if (!confirm(`${s.actif?'Dezaktive':'Aktive'} ${s.nom}?`)) return;
    try { await api.put(`/api/admin/succursales/${s._id}/toggle`); loadData(); } catch {}
  };

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) { alert('Logo twò gwo (maks 300KB)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setLogoPreview(b64);
      setLogoB64(b64);
    };
    reader.readAsDataURL(file);
  };

  const filtered = list.filter(s =>
    filter==='tous' ? true : filter==='actif' ? s.actif : !s.actif
  );

  const inp = (label, field, type='text', placeholder='', formState=form, setF=setForm) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontWeight:700, fontSize:12,
        marginBottom:5, color:'#374151' }}>{label}</label>
      {type==='select' ? (
        <select value={formState[field]||''} onChange={e=>setF(f=>({...f,[field]:e.target.value}))}
          style={{ width:'100%', padding:'11px 12px', border:'1.5px solid #d1d5db',
            borderRadius:8, fontSize:13 }}>
          {placeholder.split(',').map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type==='checkbox' ? (
        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer',
          padding:'10px 12px', background:'#f9fafb', borderRadius:8,
          border:'1px solid #e5e7eb' }}>
          <input type="checkbox" checked={!!formState[field]}
            onChange={e=>setF(f=>({...f,[field]:e.target.checked}))}
            style={{ width:18, height:18 }} />
          <span style={{ fontSize:13, fontWeight:600 }}>{placeholder}</span>
        </label>
      ) : (
        <input type={type} value={formState[field]||''}
          onChange={e=>setF(f=>({...f,[field]:e.target.value}))}
          placeholder={placeholder}
          style={{ width:'100%', padding:'11px 12px', border:'1.5px solid #d1d5db',
            borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
      )}
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'0 4px' }}>

        {/* MSG */}
        {msg.text && (
          <div style={{ background: msg.ok?'#dcfce7':'#fee2e2',
            border:`1px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color: msg.ok?'#15803d':'#dc2626',
            padding:'12px 16px', borderRadius:10, marginBottom:12, fontWeight:700 }}>
            {msg.text}
          </div>
        )}

        {/* HEADER */}
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <button onClick={() => { setForm(emptyForm); setShowAdd(true); }}
            style={{ padding:'11px 18px', background:'#1a73e8', color:'white',
              border:'none', borderRadius:10, fontWeight:800, fontSize:14, cursor:'pointer' }}>
            ➕ Ajouter POS
          </button>
          {['tous','actif','inactif'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'11px 14px', borderRadius:10, border:'none', cursor:'pointer',
                fontWeight:700, fontSize:13,
                background: filter===f ? '#1a73e8' : '#f3f4f6',
                color: filter===f ? 'white' : '#374151' }}>
              {f==='tous' ? 'Tout' : f==='actif' ? '🟢 Aktif' : '🔴 Inaktif'}
            </button>
          ))}
        </div>

        {/* LIS POS — KARD MOBIL */}
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#888' }}>⏳ Ap chaje...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'#888',
            background:'white', borderRadius:12 }}>
            Pa gen POS. Klike <strong>Ajouter</strong>.
          </div>
        ) : filtered.map(s => (
          <div key={s._id} style={{ background:'white', borderRadius:14, marginBottom:12,
            boxShadow:'0 1px 4px rgba(0,0,0,0.08)', overflow:'hidden' }}>

            {/* Tèt kard */}
            <div style={{ padding:'14px 16px',
              borderBottom:'1px solid #f3f4f6',
              display:'flex', gap:14, alignItems:'center' }}>
              {/* Logo */}
              <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden',
                border:'1.5px solid #e5e7eb', background:'#f9fafb',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0 }}>
                {s.logo
                  ? <img src={s.logo} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:24 }}>🔑</span>
                }
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:900, fontSize:16, color:'#111',
                  marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {s.nom}
                </div>
                <div style={{ fontFamily:'monospace', color:'#1a73e8', fontSize:12, fontWeight:700 }}>
                  🖥️ {s.posId || <span style={{ color:'#ccc' }}>POS ID pa defini</span>}
                </div>
                <div style={{ fontSize:11, color:'#888', marginTop:2 }}>
                  {s.bank||''} {s.prime ? `· Prime ${s.prime}` : ''}
                </div>
              </div>
              {/* Statut badge */}
              <span style={{ padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                background: s.actif?'#dcfce7':'#fee2e2',
                color: s.actif?'#16a34a':'#dc2626', flexShrink:0 }}>
                {s.actif ? '🟢' : '🔴'}
              </span>
            </div>

            {/* Limite + Mariage */}
            <div style={{ padding:'10px 16px', display:'flex', gap:12,
              borderBottom:'1px solid #f3f4f6', fontSize:12 }}>
              <div>
                <span style={{ color:'#888' }}>Limite: </span>
                <span style={{ fontWeight:700, color:'#1a73e8' }}>{s.limite||'Illimité'}</span>
              </div>
              <div>
                <span style={{ color:'#888' }}>Mariage Gratui: </span>
                <span style={{ fontWeight:700, color: s.mariage?'#16a34a':'#999' }}>
                  {s.mariage ? 'Wi ✅' : 'Non'}
                </span>
              </div>
            </div>

            {/* BOUTONS AKSYON */}
            <div style={{ padding:'10px 12px',
              display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
              <button onClick={() => openEdit(s)}
                style={{ padding:'9px 0', background:'#1a73e8', color:'white', border:'none',
                  borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                ✏️ Modifye
              </button>
              <button onClick={() => { setSelected(s); setForm({ limite:s.limite||'', limiteGain:s.limiteGain||'' }); setShowLimite(true); }}
                style={{ padding:'9px 0', background:'#16a34a', color:'white', border:'none',
                  borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                💰 Limite
              </button>
              <button onClick={() => { setSelected(s); setShowDetay(true); }}
                style={{ padding:'9px 0', background:'#7c3aed', color:'white', border:'none',
                  borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer' }}>
                👁️ Detay
              </button>
              <button onClick={() => { setSelected(s); setForm({ prime:s.prime||'60/20/10' }); setShowPrime(true); }}
                style={{ padding:'9px 0', background:'#f59e0b', color:'white', border:'none',
                  borderRadius:8, fontWeight:700, fontSize:12, cursor:'pointer',
                  gridColumn:'1/3' }}>
                🏆 Modifye Prime
              </button>
              <button onClick={() => handleToggle(s)}
                style={{ padding:'9px 0', background: s.actif?'#dc2626':'#16a34a',
                  color:'white', border:'none', borderRadius:8,
                  fontWeight:700, fontSize:12, cursor:'pointer' }}>
                {s.actif ? '🔴 Dezaktive' : '🟢 Aktive'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ MODAL EDIT (Info + POS/Logo) ═══ */}
      {showEdit && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowEdit(false)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, maxHeight:'92vh', overflowY:'auto' }}
            onClick={e=>e.stopPropagation()}>

            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3,
              margin:'12px auto 8px' }} />

            <div style={{ padding:'0 18px 6px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:900, fontSize:16, color:'#111' }}>
                ✏️ {selected.nom}
              </div>
              <button onClick={() => setShowEdit(false)}
                style={{ background:'none', border:'none', fontSize:22,
                  cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            {/* TABS */}
            <div style={{ display:'flex', margin:'8px 18px 16px', gap:8 }}>
              {[['info','📋 Info Jeneral'],['pos','🖥️ POS & Logo']].map(([k,l]) => (
                <button key={k} onClick={() => setEditTab(k)}
                  style={{ flex:1, padding:'10px 0', border:'none', borderRadius:8,
                    fontWeight:700, fontSize:13, cursor:'pointer',
                    background: editTab===k ? '#1a73e8' : '#f3f4f6',
                    color: editTab===k ? 'white' : '#555' }}>
                  {l}
                </button>
              ))}
            </div>

            <div style={{ padding:'0 18px 32px' }}>

              {/* TAB INFO */}
              {editTab === 'info' && (
                <>
                  {inp('Nom Succursal *', 'nom', 'text', 'egz: Central, Nord...')}
                  {inp('Bank', 'bank', 'text', 'egz: BNC, BUH...')}
                  {inp('Prime', 'prime', 'select', PRIMES.join(','))}
                  {inp('Mariage Gratuit', 'mariage', 'checkbox', 'Aktive Mariage Gratuit')}
                  {inp('Message / Note', 'message', 'text', 'Opsyonèl...')}
                  <button onClick={handleSaveInfo} disabled={saving}
                    style={{ width:'100%', padding:'14px', background:saving?'#ccc':'#1a73e8',
                      color:'white', border:'none', borderRadius:10, fontWeight:900,
                      fontSize:15, cursor:'pointer', marginTop:4 }}>
                    {saving ? '⏳...' : '✅ Sove Info'}
                  </button>
                </>
              )}

              {/* TAB POS & LOGO */}
              {editTab === 'pos' && (
                <>
                  {/* POS ID */}
                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', fontWeight:800, fontSize:13,
                      marginBottom:6, color:'#0891b2' }}>
                      🆔 POS ID
                    </label>
                    <input
                      value={posId}
                      onChange={e => setPosId(e.target.value.toUpperCase())}
                      placeholder="egz: POS-001, CENTRAL-A..."
                      style={{ width:'100%', padding:'13px 14px', border:'2.5px solid #0891b2',
                        borderRadius:10, fontSize:16, fontWeight:800, fontFamily:'monospace',
                        boxSizing:'border-box', letterSpacing:1, color:'#0891b2' }}
                    />
                    <p style={{ margin:'5px 0 0', fontSize:11, color:'#888' }}>
                      ID sa parèt sou chak ticket ki soti sou machin sa a
                    </p>
                  </div>

                  {/* LOGO */}
                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:'block', fontWeight:800, fontSize:13,
                      marginBottom:10, color:'#7c3aed' }}>
                      🖼️ Logo POS
                    </label>

                    {/* Preview + Bouton */}
                    <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                      {/* Preview box */}
                      <div onClick={() => fileRef.current?.click()}
                        style={{ width:80, height:80, borderRadius:12,
                          border: logoPreview ? '2px solid #7c3aed' : '2px dashed #d1d5db',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          overflow:'hidden', background:'#f9fafb', cursor:'pointer',
                          flexShrink:0 }}>
                        {logoPreview
                          ? <img src={logoPreview} alt="logo"
                              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : <div style={{ textAlign:'center' }}>
                              <div style={{ fontSize:28 }}>🖼️</div>
                              <div style={{ fontSize:9, color:'#aaa', marginTop:2 }}>Tape isi</div>
                            </div>
                        }
                      </div>

                      <div style={{ flex:1 }}>
                        <button onClick={() => fileRef.current?.click()}
                          style={{ width:'100%', padding:'12px', background:'#7c3aed',
                            color:'white', border:'none', borderRadius:10, fontWeight:700,
                            fontSize:14, cursor:'pointer', marginBottom:8 }}>
                          📁 Chwazi Foto
                        </button>
                        <p style={{ margin:0, fontSize:11, color:'#888', lineHeight:1.4 }}>
                          PNG · JPG · Maks 300KB<br/>
                          Tape sou kare a osinon bouton an
                        </p>
                        {logoB64 && (
                          <p style={{ margin:'6px 0 0', fontSize:11,
                            color:'#16a34a', fontWeight:700 }}>
                            ✓ Nouvo logo prè pou sove
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Wete logo */}
                    {logoPreview && (
                      <button onClick={() => { setLogoPreview(''); setLogoB64(''); }}
                        style={{ marginTop:10, padding:'7px 14px', background:'#fee2e2',
                          color:'#dc2626', border:'none', borderRadius:8,
                          fontWeight:700, fontSize:12, cursor:'pointer' }}>
                        🗑️ Wete Logo
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*"
                      style={{ display:'none' }} onChange={handleLogoFile} />
                  </div>

                  <button onClick={handleSavePOS} disabled={saving}
                    style={{ width:'100%', padding:'14px', background:saving?'#ccc':'#0891b2',
                      color:'white', border:'none', borderRadius:10, fontWeight:900,
                      fontSize:15, cursor:'pointer' }}>
                    {saving ? '⏳...' : '✅ Sove POS ID & Logo'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL AJOUTER ═══ */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, maxHeight:'90vh', overflowY:'auto' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3, margin:'12px auto 8px' }} />
            <div style={{ padding:'0 18px 6px', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontWeight:900, fontSize:16 }}>➕ Ajouter Succursal</div>
              <button onClick={() => setShowAdd(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>✕</button>
            </div>
            <div style={{ padding:'8px 18px 40px' }}>
              {inp('Nom Succursal *', 'nom', 'text', 'egz: Central, Nord, Sud...')}
              {inp('Bank', 'bank', 'text', 'egz: BNC, BUH, SOGEBANK...')}
              {inp('Limite Mise (HTG)', 'limite', 'text', 'kite vid = Illimité')}
              {inp('Limite Gain (HTG)', 'limiteGain', 'text', 'kite vid = Illimité')}
              {inp('Prime', 'prime', 'select', PRIMES.join(','))}
              {inp('Mariage Gratuit', 'mariage', 'checkbox', 'Aktive Mariage Gratuit')}
              {inp('Message / Note', 'message', 'text', 'Opsyonèl...')}
              <button onClick={handleAdd} disabled={saving}
                style={{ width:'100%', padding:'14px', background:saving?'#ccc':'#1a73e8',
                  color:'white', border:'none', borderRadius:10, fontWeight:900,
                  fontSize:15, cursor:'pointer', marginTop:4 }}>
                {saving ? '⏳...' : '✅ Ajoute Succursal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL LIMITE ═══ */}
      {showLimite && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowLimite(false)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, padding:'0 0 40px' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3, margin:'12px auto 8px' }} />
            <div style={{ padding:'0 18px 16px', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontWeight:900, fontSize:16 }}>💰 Limite — {selected.nom}</div>
              <button onClick={() => setShowLimite(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>✕</button>
            </div>
            <div style={{ padding:'0 18px' }}>
              <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8,
                padding:12, marginBottom:16 }}>
                <p style={{ margin:0, fontSize:12, color:'#15803d' }}>
                  💡 Kite vid osinon mete <strong>0</strong> pou Illimité
                </p>
              </div>
              {inp('Limite Mise (HTG)', 'limite', 'text', 'Illimité')}
              {inp('Limite Gain (HTG)', 'limiteGain', 'text', 'Illimité')}
              <button onClick={handleLimite} disabled={saving}
                style={{ width:'100%', padding:'14px', background:saving?'#ccc':'#16a34a',
                  color:'white', border:'none', borderRadius:10, fontWeight:900,
                  fontSize:15, cursor:'pointer' }}>
                {saving ? '⏳...' : '✅ Sove Limite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL PRIME ═══ */}
      {showPrime && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowPrime(false)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, padding:'0 0 40px' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3, margin:'12px auto 8px' }} />
            <div style={{ padding:'0 18px 16px', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontWeight:900, fontSize:16 }}>🏆 Prime — {selected.nom}</div>
              <button onClick={() => setShowPrime(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>✕</button>
            </div>
            <div style={{ padding:'0 18px' }}>
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8,
                padding:12, marginBottom:16 }}>
                <p style={{ margin:0, fontSize:12, color:'#1d4ed8' }}>
                  Prime aktyèl: <strong>{selected.prime || '60/20/10'}</strong>
                </p>
              </div>
              {inp('Nouvo Prime', 'prime', 'select', PRIMES.join(','))}
              <button onClick={handlePrime} disabled={saving}
                style={{ width:'100%', padding:'14px', background:saving?'#ccc':'#f59e0b',
                  color:'white', border:'none', borderRadius:10, fontWeight:900,
                  fontSize:15, cursor:'pointer' }}>
                {saving ? '⏳...' : '✅ Sove Prime'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL DETAY ═══ */}
      {showDetay && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowDetay(false)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, padding:'0 0 40px', maxHeight:'80vh', overflowY:'auto' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3, margin:'12px auto 8px' }} />
            <div style={{ padding:'0 18px 16px', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontWeight:900, fontSize:16, color:'#7c3aed' }}>
                👁️ Detay — {selected.nom}
              </div>
              <button onClick={() => setShowDetay(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>✕</button>
            </div>
            <div style={{ padding:'0 18px' }}>
              {[
                ['Non', selected.nom],
                ['POS ID', selected.posId || '—'],
                ['Bank', selected.bank || '—'],
                ['Limite Mise', selected.limite || 'Illimité'],
                ['Limite Gain', selected.limiteGain || 'Illimité'],
                ['Prime', selected.prime || '60/20/10'],
                ['Mariage Gratuit', selected.mariage ? '✅ Wi' : 'Non'],
                ['Statut', selected.actif ? '🟢 Aktif' : '🔴 Inaktif'],
              ].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between',
                  padding:'11px 0', borderBottom:'1px solid #f3f4f6' }}>
                  <span style={{ fontSize:13, color:'#666', fontWeight:600 }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'#7c3aed' }}>{v}</span>
                </div>
              ))}
              {selected.message && (
                <div style={{ background:'#fffbeb', border:'1px solid #fde68a',
                  borderRadius:8, padding:12, marginTop:12 }}>
                  <p style={{ margin:0, fontSize:13, color:'#92400e' }}>📝 {selected.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
