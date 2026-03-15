import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES = ['Georgia-Matin','Georgia-Soir','Florida matin','Florida soir','New-york matin','New-york soir'];

export default function LotsGagnant() {
  const today = new Date().toISOString().split('T')[0];
  const [data,     setData]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState({ tirage:'Georgia-Matin', lot1:'', lot2:'', lot3:'', date:today });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(0);
  const PER_PAGE = 10;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/resultats');
      setData(Array.isArray(r.data) ? r.data : []);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.tirage || !form.lot1) {
      alert('Mete tiraj ak 1er lot!');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/admin/resultats', {
        tirage: form.tirage,
        lot1:   form.lot1,
        lot2:   form.lot2 || '',
        lot3:   form.lot3 || '',
        date:   form.date || today,
      });
      setMsg('✅ Rezilta sove avèk siksè!');
      setShowAdd(false);
      setForm({ tirage:'Georgia-Matin', lot1:'', lot2:'', lot3:'', date:today });
      await load(); // Recharger depuis la DB
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert('Erè: ' + (err?.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Efase rezilta sa a?')) return;
    try {
      await api.delete('/api/admin/resultats/' + id);
      await load();
      setMsg('✅ Rezilta efase!');
      setTimeout(() => setMsg(''), 3000);
    } catch { alert('Erè pou efase'); }
  };

  const filtered = data.filter(r =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Lots Gagnant</span>
        </div>

        {/* MESSAGE SUCCÈS */}
        {msg && (
          <div style={{ background:'#dcfce7', border:'1px solid #16a34a', borderRadius:8, padding:12, marginBottom:12, color:'#16a34a', fontWeight:700 }}>
            {msg}
          </div>
        )}

        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ margin:0, fontWeight:800, fontSize:18 }}>Lots Gagnant</h2>
            <button onClick={() => setShowAdd(true)}
              style={{ background:'#16a34a', color:'white', border:'none', borderRadius:6, padding:'8px 18px', fontWeight:700, cursor:'pointer', fontSize:14 }}>
              ➕ Ajoute Rezilta
            </button>
          </div>

          {/* MODAL AJOUT */}
          {showAdd && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ background:'white', borderRadius:12, padding:24, width:'90%', maxWidth:400 }}>
                <h3 style={{ margin:'0 0 16px', fontWeight:800 }}>➕ Nouvo Rezilta Tiraj</h3>

                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontWeight:700, marginBottom:4, fontSize:13 }}>Tiraj *</label>
                  <select value={form.tirage} onChange={e => setForm(f => ({...f, tirage:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14 }}>
                    {TIRAGES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontWeight:700, marginBottom:4, fontSize:13 }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14, boxSizing:'border-box' }} />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                  {[['lot1','1er Lot *','#16a34a'],['lot2','2em Lot','#f59e0b'],['lot3','3em Lot','#1a73e8']].map(([key,label,color]) => (
                    <div key={key}>
                      <label style={{ display:'block', fontWeight:700, marginBottom:4, fontSize:12, color }}>{label}</label>
                      <input
                        type="text" maxLength={2}
                        value={form[key]}
                        onChange={e => setForm(f => ({...f, [key]:e.target.value}))}
                        placeholder="00"
                        style={{ width:'100%', padding:'10px', border:`2px solid ${color}`, borderRadius:6, fontSize:18, fontWeight:900, textAlign:'center', boxSizing:'border-box' }}
                      />
                    </div>
                  ))}
                </div>

                {/* PREVIEW BOULES */}
                {(form.lot1 || form.lot2 || form.lot3) && (
                  <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:16 }}>
                    {[form.lot1, form.lot2, form.lot3].map((lot, j) => (
                      <div key={j} style={{ width:50, height:50, borderRadius:'50%', background: lot ? (j===0?'#16a34a':j===1?'#f59e0b':'#1a73e8') : '#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', color: lot?'white':'#ccc', fontWeight:900, fontSize:18 }}>
                        {lot || '--'}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setShowAdd(false)}
                    style={{ flex:1, padding:'11px', background:'#f3f4f6', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>
                    Anile
                  </button>
                  <button onClick={handleAdd} disabled={saving}
                    style={{ flex:2, padding:'11px', background: saving ? '#ccc' : '#16a34a', color:'white', border:'none', borderRadius:6, fontWeight:700, cursor: saving?'default':'pointer', fontSize:14 }}>
                    {saving ? 'Ap sove...' : '✅ Sove Rezilta'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RECHERCHE */}
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontWeight:700, fontSize:13 }}>Search:</label>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                style={{ padding:'7px 12px', border:'1px solid #ddd', borderRadius:4, fontSize:13, width:180 }} />
            </div>
            <button onClick={load}
              style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'7px 16px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              🔄 Rafraîchir
            </button>
          </div>

          {/* TABLE */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  {['Date','Tiraj','1er Lot','2em Lot','3em Lot','Aksyon'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'#888' }}>Chargement...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'#888', fontStyle:'italic' }}>Pa gen rezilta encore — Klike "Ajoute Rezilta"</td></tr>
                ) : paginated.map((row, i) => (
                  <tr key={row._id || i} style={{ borderBottom:'1px solid #dee2e6', background: i%2===0?'white':'#f8f9fa' }}>
                    <td style={{ padding:'10px 12px' }}>{new Date(row.date).toLocaleDateString('fr')}</td>
                    <td style={{ padding:'10px 12px', fontWeight:700 }}>{row.tirage}</td>
                    {[row.lot1, row.lot2, row.lot3].map((lot, j) => (
                      <td key={j} style={{ padding:'10px 12px' }}>
                        {lot ? (
                          <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', background: j===0?'#16a34a':j===1?'#f59e0b':'#1a73e8', color:'white', fontWeight:900, fontSize:14 }}>
                            {lot}
                          </span>
                        ) : <span style={{ color:'#ccc' }}>--</span>}
                      </td>
                    ))}
                    <td style={{ padding:'10px 12px' }}>
                      <button onClick={() => handleDelete(row._id)}
                        style={{ background:'#dc2626', color:'white', border:'none', borderRadius:4, padding:'5px 10px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                        🗑 Efase
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, color:'#666', fontSize:13 }}>
            <span>Showing {filtered.length===0?0:page*PER_PAGE+1} to {Math.min((page+1)*PER_PAGE, filtered.length)} of {filtered.length} entries</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:3, background:'white', cursor: page===0?'default':'pointer', color: page===0?'#aaa':'#333' }}>
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:3, background:'white', cursor: page>=totalPages-1?'default':'pointer', color: page>=totalPages-1?'#aaa':'#333' }}>
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
