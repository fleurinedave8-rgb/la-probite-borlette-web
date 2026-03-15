import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const CHIF = ['0','1','2','3','4','5','6','7','8','9'];

// Génère toutes les boules d'un chiffre (00-09 pour chif 0, 10-19 pour 1, etc.)
const genBoulesPourChif = (chif) => {
  const result = [];
  for (let i = 0; i <= 99; i++) {
    const b = String(i).padStart(2,'0');
    if (b[0] === chif || b[1] === chif) result.push(b);
  }
  // dédupliqué
  return [...new Set(result)];
};

export default function BlocageBoule() {
  const [activeTab,  setActiveTab]  = useState('general');
  const [agents,     setAgents]     = useState([]);
  const [boules,     setBoules]     = useState([]);
  const [bouleAgent, setBouleAgent] = useState([]);
  const [agentId,    setAgentId]    = useState('');
  const [input,      setInput]      = useState('');
  const [msg,        setMsg]        = useState('');
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);

  // Auto modal
  const [showAuto,   setShowAuto]   = useState(false);
  const [chifSelect, setChifSelect] = useState('');
  const [previewAuto, setPreviewAuto] = useState([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        api.get('/api/admin/boules-bloquees').catch(() => ({data:[]})),
        api.get('/api/admin/agents').catch(() => ({data:[]})),
      ]);
      setBoules(Array.isArray(bRes.data) ? bRes.data : []);
      setAgents(Array.isArray(aRes.data) ? aRes.data : []);
    } catch {}
    setLoading(false);
  };

  const loadAgentBoules = async (id) => {
    if (!id) return;
    try {
      const r = await api.get(`/api/admin/boules-bloquees?agentId=${id}`);
      setBouleAgent(Array.isArray(r.data) ? r.data : []);
    } catch { setBouleAgent([]); }
  };

  const handleBloquer = async (bouleList, forAgentId) => {
    if (!bouleList || bouleList.length === 0) { setMsg('❌ Antre omwen yon boule'); return; }
    setSaving(true);
    try {
      for (const b of bouleList) {
        await api.post('/api/admin/boules-bloquees', {
          boule: b,
          agentId: forAgentId || null,
          type: forAgentId ? 'agent' : 'general',
        }).catch(()=>{});
      }
      setMsg(`✅ ${bouleList.length} boule bloke!`);
      setInput('');
      loadAll();
      if (forAgentId) loadAgentBoules(forAgentId);
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Erè'); }
    finally { setSaving(false); }
  };

  const handleDebloquer = async (id) => {
    try {
      await api.delete(`/api/admin/boules-bloquees/${id}`);
      setMsg('✅ Boule debloke!');
      loadAll();
      setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('❌ Erè'); }
  };

  // Génère preview pour auto
  const handleChifSelect = (c) => {
    setChifSelect(c);
    setPreviewAuto(genBoulesPourChif(c));
  };

  const handleConfirmAuto = () => {
    handleBloquer(previewAuto, activeTab === 'agent' ? agentId : null);
    setShowAuto(false);
    setChifSelect('');
    setPreviewAuto([]);
  };

  const parseInput = (str) => {
    return str.split(/[\s,;]+/).map(s=>s.trim()).filter(s => /^\d{2,3}$/.test(s));
  };

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:16, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Gestion Blocage Boule</span>
        </div>

        {msg && (
          <div style={{ background:msg.startsWith('✅')?'#dcfce7':'#fee2e2', border:`1px solid ${msg.startsWith('✅')?'#16a34a':'#dc2626'}`, borderRadius:8, padding:12, marginBottom:12, fontWeight:700, color:msg.startsWith('✅')?'#16a34a':'#dc2626' }}>
            {msg}
          </div>
        )}

        {/* TABS */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          {[{key:'general',label:'Général',color:'#1a73e8'},{key:'agent',label:'Par agent',color:'#16a34a'}].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding:'10px 24px', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer',
                background: activeTab===t.key ? t.color : 'white',
                color: activeTab===t.key ? 'white' : '#555',
                boxShadow: activeTab===t.key ? `0 2px 8px ${t.color}44` : '0 1px 3px rgba(0,0,0,0.08)' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── GÉNÉRAL ── */}
        {activeTab === 'general' && (
          <div style={{ background:'white', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800, fontSize:16 }}>Général</h3>

            {/* BOUTONS AJOUTER / LISTER / AUTOMATIK */}
            <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
              <button onClick={() => setShowAuto(true)}
                style={{ background:'#dc2626', color:'white', border:'none', borderRadius:6, padding:'9px 18px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                🤖 Boule Automatik
              </button>
              <div style={{ flex:1, display:'flex', gap:8, alignItems:'center' }}>
                <input value={input} onChange={e=>setInput(e.target.value)}
                  placeholder="Antre boule (ex: 23, 45 78)"
                  style={{ flex:1, padding:'9px 14px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }}
                  onKeyDown={e => e.key==='Enter' && handleBloquer(parseInput(input), null)}
                />
                <button onClick={() => handleBloquer(parseInput(input), null)} disabled={saving}
                  style={{ background:saving?'#ccc':'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'9px 18px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:13 }}>
                  {saving ? '⏳' : 'Ajouter'}
                </button>
              </div>
            </div>

            {/* TABLE BOULES BLOQUÉES */}
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:800, borderBottom:'2px solid #dee2e6' }}>Boule</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:800, borderBottom:'2px solid #dee2e6' }}>Type</th>
                  <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:800, borderBottom:'2px solid #dee2e6' }}>Dat</th>
                  <th style={{ padding:'10px 14px', borderBottom:'2px solid #dee2e6' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding:20, textAlign:'center', color:'#aaa' }}>Chargement...</td></tr>
                ) : boules.filter(b => !b.agentId).length === 0 ? (
                  <tr><td colSpan={4} style={{ padding:20, textAlign:'center', color:'#aaa' }}>Pa gen boule bloke</td></tr>
                ) : boules.filter(b => !b.agentId).map((b, i) => (
                  <tr key={b._id||b.id||i} style={{ borderBottom:'1px solid #f0f0f0', background:i%2===0?'white':'#fafafa' }}>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:20, padding:'4px 14px', fontWeight:900, fontSize:14 }}>{b.boule}</span>
                    </td>
                    <td style={{ padding:'10px 14px', color:'#888', fontSize:12 }}>{b.type || 'général'}</td>
                    <td style={{ padding:'10px 14px', color:'#888', fontSize:12 }}>{b.createdAt ? new Date(b.createdAt).toLocaleDateString('fr') : '—'}</td>
                    <td style={{ padding:'10px 14px', textAlign:'right' }}>
                      <button onClick={() => handleDebloquer(b._id||b.id)}
                        style={{ background:'#16a34a', color:'white', border:'none', borderRadius:4, padding:'5px 12px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        Déblokè
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAR AGENT ── */}
        {activeTab === 'agent' && (
          <div style={{ background:'white', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800, fontSize:16 }}>Par agent</h3>

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Chwazi Ajan</label>
              <select value={agentId} onChange={e => { setAgentId(e.target.value); loadAgentBoules(e.target.value); }}
                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13 }}>
                <option value=''>— Chwazi Ajan —</option>
                {agents.map(a => <option key={a.id||a._id} value={a.id||a._id}>{a.prenom} {a.nom} ({a.username})</option>)}
              </select>
            </div>

            {agentId && (
              <>
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                  <button onClick={() => setShowAuto(true)}
                    style={{ background:'#dc2626', color:'white', border:'none', borderRadius:6, padding:'9px 18px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                    🤖 Boule Automatik
                  </button>
                  <div style={{ flex:1, display:'flex', gap:8, alignItems:'center' }}>
                    <input value={input} onChange={e=>setInput(e.target.value)}
                      placeholder="Antre boule pou ajan sa"
                      style={{ flex:1, padding:'9px 14px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }}
                      onKeyDown={e => e.key==='Enter' && handleBloquer(parseInput(input), agentId)}
                    />
                    <button onClick={() => handleBloquer(parseInput(input), agentId)} disabled={saving}
                      style={{ background:saving?'#ccc':'#16a34a', color:'white', border:'none', borderRadius:6, padding:'9px 18px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontSize:13 }}>
                      Ajouter
                    </button>
                  </div>
                </div>

                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa' }}>
                      <th style={{ padding:'10px 14px', textAlign:'left', fontWeight:800, borderBottom:'2px solid #dee2e6' }}>Boule</th>
                      <th style={{ padding:'10px 14px', borderBottom:'2px solid #dee2e6' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {bouleAgent.length === 0 ? (
                      <tr><td colSpan={2} style={{ padding:20, textAlign:'center', color:'#aaa' }}>Pa gen boule bloke pou ajan sa</td></tr>
                    ) : bouleAgent.map((b, i) => (
                      <tr key={b._id||b.id||i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:20, padding:'4px 14px', fontWeight:900, fontSize:14 }}>{b.boule}</span>
                        </td>
                        <td style={{ padding:'10px 14px', textAlign:'right' }}>
                          <button onClick={() => handleDebloquer(b._id||b.id)}
                            style={{ background:'#16a34a', color:'white', border:'none', borderRadius:4, padding:'5px 12px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                            Déblokè
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ── MODAL BOULE AUTOMATIK ── */}
        {showAuto && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:12, padding:24, width:'95%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' }}>
              <h3 style={{ margin:'0 0 4px', fontWeight:900, fontSize:18, color:'#dc2626' }}>🤖 Boule Automatik</h3>
              <p style={{ margin:'0 0 18px', fontSize:13, color:'#666' }}>Chwazi yon chif — tout boule ki gen chif sa pral bloke (ex: chif 3 → 03, 13, 23, 30, 31...)</p>

              {/* GRILLE CHIFFRES */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:18 }}>
                {CHIF.map(c => (
                  <button key={c} onClick={() => handleChifSelect(c)}
                    style={{ padding:'16px', border:`3px solid ${chifSelect===c?'#dc2626':'#ddd'}`, borderRadius:10, background:chifSelect===c?'#fee2e2':'white', fontWeight:900, fontSize:22, cursor:'pointer', color:chifSelect===c?'#dc2626':'#555' }}>
                    {c}
                  </button>
                ))}
              </div>

              {/* PREVIEW */}
              {previewAuto.length > 0 && (
                <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:12, marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'#dc2626', marginBottom:8 }}>
                    Chif {chifSelect} — {previewAuto.length} boule pral bloke:
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {previewAuto.map(b => (
                      <span key={b} style={{ background:'#fee2e2', color:'#dc2626', borderRadius:12, padding:'3px 10px', fontWeight:700, fontSize:12 }}>{b}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={handleConfirmAuto} disabled={!chifSelect || saving}
                  style={{ flex:1, padding:'12px', background:!chifSelect?'#ccc':'#dc2626', color:'white', border:'none', borderRadius:8, fontWeight:800, fontSize:14, cursor:!chifSelect?'not-allowed':'pointer' }}>
                  {saving ? '⏳ Ap bloke...' : `✅ Bloké Chif ${chifSelect||'—'}`}
                </button>
                <button onClick={() => { setShowAuto(false); setChifSelect(''); setPreviewAuto([]); }}
                  style={{ flex:1, padding:'12px', background:'#f1f5f9', color:'#555', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                  Anile
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
