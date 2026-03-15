import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const TYPES = [
  { val:'doleance',    label:'🗣️ Doléance', color:'#7c3aed' },
  { val:'bug',         label:'🐛 Bug / Erè', color:'#dc2626' },
  { val:'suggestion',  label:'💡 Sijesyon', color:'#f59e0b' },
  { val:'felicitation',label:'🎉 Felisitasyon', color:'#16a34a' },
];

export default function Doleances() {
  const [tab,        setTab]        = useState('envoye');
  const [form,       setForm]       = useState({ sujet:'', nom:'', telephone:'', email:'', description:'', type:'doleance' });
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [msg,        setMsg]        = useState('');
  const [list,       setList]       = useState([]);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (tab === 'liste') loadList();
  }, [tab]);

  const loadList = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/doleances');
      setList(Array.isArray(r.data) ? r.data : []);
    } catch { setList([]); }
    setLoading(false);
  };

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

  const handleSend = async () => {
    if (!form.sujet || !form.description) return alert('Sujet ak deskripsyon obligatwa!');
    setSending(true);
    try {
      await api.post('/api/admin/doleances', form);
      setSent(true);
      setForm({ sujet:'', nom:'', telephone:'', email:'', description:'', type:'doleance' });
      notify('✅ Mesaj ou a voye avèk siksè!');
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSending(false);
  };

  const handleStatut = async (id, statut) => {
    try {
      await api.put(`/api/admin/doleances/${id}/statut`, { statut });
      loadList();
    } catch {}
  };

  const STATUT_COLORS = {
    nouveau:   { bg:'#eff6ff', color:'#1d4ed8', label:'🔵 Nouvo' },
    encours:   { bg:'#fffbeb', color:'#92400e', label:'🟡 An Kou' },
    resolu:    { bg:'#f0fdf4', color:'#15803d', label:'🟢 Rezoud' },
    rejete:    { bg:'#fef2f2', color:'#991b1b', label:'🔴 Rejte' },
  };

  return (
    <Layout>
      <div>
        {msg && <div style={{ background:'#dcfce7', border:'1px solid #16a34a', color:'#15803d', padding:'12px 16px', borderRadius:8, marginBottom:14, fontWeight:700, fontSize:14 }}>{msg}</div>}

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[['envoye','📝 Voye Mesaj'],['liste','📋 Lis Mesaj yo']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding:'9px 20px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
                background: tab===k ? '#7c3aed' : '#f3f4f6',
                color: tab===k ? 'white' : '#374151',
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── FÒMIL VOYE ── */}
        {tab === 'envoye' && (
          <div className="card" style={{ maxWidth:640 }}>
            {sent ? (
              <div style={{ textAlign:'center', padding:40 }}>
                <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
                <h3 style={{ fontWeight:900, fontSize:20, color:'#16a34a' }}>Mesaj voye!</h3>
                <p style={{ color:'#666', marginBottom:20 }}>Admin pral revize mesaj ou a epi reponn ou.</p>
                <button onClick={() => setSent(false)}
                  style={{ padding:'11px 28px', background:'#7c3aed', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                  ✍️ Voye yon lòt
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ margin:'0 0 6px', fontWeight:900, fontSize:18 }}>📬 Voye yon Mesaj</h3>
                <p style={{ margin:'0 0 20px', color:'#666', fontSize:13 }}>
                  Pwoblèm, sijesyon, felisitasyon — nou koute ou!
                </p>

                {/* Type mesaj */}
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:8, color:'#374151' }}>
                    Tip Mesaj
                  </label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {TYPES.map(t => (
                      <button key={t.val} onClick={() => setForm(f => ({ ...f, type: t.val }))}
                        style={{ padding:'7px 14px', borderRadius:20, border:`2px solid ${form.type===t.val ? t.color : '#e5e7eb'}`,
                          background: form.type===t.val ? t.color : 'white',
                          color: form.type===t.val ? 'white' : '#555',
                          fontWeight:700, cursor:'pointer', fontSize:12,
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { field:'sujet', label:'Sujet *', placeholder:'Rezime pwoblèm nan...', full:true },
                    { field:'nom', label:'Non ou', placeholder:'Non ak Prenon' },
                    { field:'telephone', label:'Telefòn', placeholder:'+509 xx xx xx xx' },
                    { field:'email', label:'Email (opsyonèl)', placeholder:'email@example.com' },
                  ].map(({ field, label, placeholder, full }) => (
                    <div key={field} style={{ gridColumn: full ? 'span 2' : 'span 1' }}>
                      <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4, color:'#374151' }}>{label}</label>
                      <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${form[field] ? '#1a73e8' : '#e5e7eb'}`, borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                    </div>
                  ))}

                  <div style={{ gridColumn:'span 2' }}>
                    <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4, color:'#374151' }}>Deskripsyon *</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Eksplike nou an detay..."
                      rows={5}
                      style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${form.description ? '#1a73e8' : '#e5e7eb'}`, borderRadius:8, fontSize:13, resize:'vertical', boxSizing:'border-box' }} />
                  </div>
                </div>

                <button onClick={handleSend} disabled={sending}
                  style={{ marginTop:16, width:'100%', padding:'13px', background: sending ? '#ccc' : '#7c3aed', color:'white', border:'none', borderRadius:8, fontWeight:800, cursor:'pointer', fontSize:14 }}>
                  {sending ? '⏳ Ap voye...' : '📨 Voye Mesaj la'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── LIS MESAJ YO (ADMIN) ── */}
        {tab === 'liste' && (
          <div className="card">
            <h3 style={{ margin:'0 0 16px', fontWeight:800, fontSize:16 }}>📋 Tout Mesaj yo</h3>
            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'#888' }}>⏳ Chajman...</div>
            ) : list.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'#888' }}>Pa gen mesaj toujou.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {list.map(d => {
                  const sc = STATUT_COLORS[d.statut] || STATUT_COLORS.nouveau;
                  const tc = TYPES.find(t => t.val === d.type) || TYPES[0];
                  return (
                    <div key={d._id} style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:16,
                      borderLeft:`4px solid ${tc.color}` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                        <div>
                          <span style={{ fontSize:11, fontWeight:700, color:tc.color, marginRight:8 }}>{tc.label}</span>
                          <strong style={{ fontSize:14 }}>{d.sujet}</strong>
                        </div>
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:700,
                            background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                          <select value={d.statut||'nouveau'} onChange={e => handleStatut(d._id, e.target.value)}
                            style={{ fontSize:11, padding:'3px 6px', border:'1px solid #ddd', borderRadius:4 }}>
                            {['nouveau','encours','resolu','rejete'].map(s => (
                              <option key={s} value={s}>{STATUT_COLORS[s]?.label || s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p style={{ margin:'8px 0 6px', fontSize:13, color:'#444', lineHeight:1.5 }}>{d.description}</p>
                      <div style={{ fontSize:11, color:'#888', display:'flex', gap:16 }}>
                        {d.nom && <span>👤 {d.nom}</span>}
                        {d.telephone && <span>📞 {d.telephone}</span>}
                        {d.email && <span>📧 {d.email}</span>}
                        <span>🕒 {new Date(d.createdAt).toLocaleDateString('fr')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
