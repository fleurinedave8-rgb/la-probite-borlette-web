import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function MariageGratuit() {
  const [config,   setConfig]   = useState({ actif: false, rules: [] });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [kob,      setKob]      = useState('');
  const [mariaj,   setMariaj]   = useState('');
  const [editIdx,  setEditIdx]  = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/mariage-gratuit');
      setConfig(r.data || { actif: false, rules: [] });
    } catch { setConfig({ actif: false, rules: [] }); }
    setLoading(false);
  };

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSave = async (newConfig) => {
    setSaving(true);
    try {
      await api.put('/api/admin/mariage-gratuit', newConfig || config);
      notify('✅ Konfigirasyon sove!');
      loadData();
    } catch (e) { alert('Erè: ' + e.message); }
    setSaving(false);
  };

  const handleAddRule = async () => {
    if (!kob || !mariaj) return alert('Kantite kòb ak mariage obligatwa!');
    const rules = [...(config.rules || [])];
    if (editIdx !== null) {
      rules[editIdx] = { kob: Number(kob), mariaj: Number(mariaj) };
      setEditIdx(null);
    } else {
      rules.push({ kob: Number(kob), mariaj: Number(mariaj) });
    }
    rules.sort((a, b) => a.kob - b.kob);
    const newConfig = { ...config, rules };
    setConfig(newConfig);
    setKob(''); setMariaj('');
    await handleSave(newConfig);
  };

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setKob(String(config.rules[idx].kob));
    setMariaj(String(config.rules[idx].mariaj));
  };

  const handleDelete = async (idx) => {
    if (!confirm('Efase règ sa a?')) return;
    const rules = config.rules.filter((_, i) => i !== idx);
    const newConfig = { ...config, rules };
    setConfig(newConfig);
    await handleSave(newConfig);
  };

  const toggleActif = async () => {
    const newConfig = { ...config, actif: !config.actif };
    setConfig(newConfig);
    await handleSave(newConfig);
  };

  return (
    <Layout>
      <div>
        {msg && <div style={{ background:'#dcfce7', border:'1px solid #16a34a', color:'#15803d', padding:'10px 16px', borderRadius:8, marginBottom:14, fontWeight:700 }}>{msg}</div>}

        {/* STATUS TOGGLE */}
        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <h3 style={{ margin:0, fontWeight:800, fontSize:16 }}>💍 Mariage Gratuit</h3>
              <p style={{ margin:'4px 0 0', fontSize:13, color:'#666' }}>
                Kliyan jwenn mariage gratis selon kantite kòb yo jwe.
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:13, fontWeight:700, color: config.actif ? '#16a34a' : '#dc2626' }}>
                {config.actif ? '🟢 Aktive' : '🔴 Dezaktive'}
              </span>
              <button onClick={toggleActif} disabled={saving}
                style={{ padding:'9px 20px', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13,
                  background: config.actif ? '#dc2626' : '#16a34a', color:'white' }}>
                {config.actif ? '🔴 Dezaktive' : '🟢 Aktive'}
              </button>
            </div>
          </div>
        </div>

        {/* FÒMIL AJOUTE / MODIFYE */}
        <div className="card" style={{ marginBottom:16 }}>
          <h4 style={{ margin:'0 0 14px', fontWeight:800, fontSize:15, color:'#1e40af' }}>
            {editIdx !== null ? '✏️ Modifye Règ' : '➕ Ajoute Nouvo Règ'}
          </h4>
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12, marginBottom:14 }}>
            <p style={{ margin:0, fontSize:12, color:'#1d4ed8' }}>
              💡 Egzanp: pou <strong>50 HTG</strong> → <strong>1 mariage gratis</strong>. Pou <strong>100 HTG</strong> → <strong>2 mariage gratis</strong>.
            </p>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ flex:1, minWidth:140 }}>
              <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:5, fontWeight:700 }}>
                💰 Kantite Kòb (HTG)
              </label>
              <input type="number" min="1" value={kob} onChange={e => setKob(e.target.value)}
                placeholder="egz: 50"
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
            </div>
            <div style={{ flex:1, minWidth:140 }}>
              <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:5, fontWeight:700 }}>
                💍 Kantite Mariage Gratis
              </label>
              <input type="number" min="1" value={mariaj} onChange={e => setMariaj(e.target.value)}
                placeholder="egz: 1"
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleAddRule} disabled={saving}
                style={{ padding:'10px 22px', background: saving ? '#ccc' : (editIdx !== null ? '#f59e0b' : '#16a34a'),
                  color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                {saving ? '⏳' : editIdx !== null ? '✏️ Modifye' : '➕ Ajoute'}
              </button>
              {editIdx !== null && (
                <button onClick={() => { setEditIdx(null); setKob(''); setMariaj(''); }}
                  style={{ padding:'10px 16px', background:'#f3f4f6', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>
                  Anile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLE RÈGL YO */}
        <div className="card">
          <h4 style={{ margin:'0 0 14px', fontWeight:800, fontSize:15 }}>📋 Règ Mariage Gratis yo</h4>
          {loading ? (
            <div style={{ textAlign:'center', padding:30, color:'#888' }}>⏳ Chajman...</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['#','Kantite Kòb (HTG)','Mariage Gratis','Aksyon'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(!config.rules || config.rules.length === 0) ? (
                    <tr><td colSpan={4} style={{ padding:24, textAlign:'center', color:'#888' }}>
                      Pa gen règ. Ajoute premye règ ou anwo.
                    </td></tr>
                  ) : config.rules.map((r, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><span style={{ fontWeight:800, color:'#16a34a', fontSize:15 }}>{r.kob} HTG</span></td>
                      <td><span style={{ fontWeight:800, color:'#1a73e8', fontSize:15 }}>💍 {r.mariaj}</span></td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => handleEdit(i)}
                            style={{ background:'#f59e0b', color:'white', border:'none', borderRadius:5, padding:'5px 12px', fontSize:12, cursor:'pointer', fontWeight:700 }}>
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(i)}
                            style={{ background:'#dc2626', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
