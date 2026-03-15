import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const TABS = [
  { key:'depot',    label:'💰 Dépôt',          color:'#16a34a' },
  { key:'retrait',  label:'🏧 Retrait',         color:'#dc2626' },
  { key:'prepaye',  label:'💳 Pré-payer',       color:'#7c3aed' },
  { key:'historique', label:'📋 Historique',    color:'#1a73e8' },
];

export default function Paiement() {
  const [activeTab, setActiveTab] = useState('depot');
  const [agents, setAgents]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [transactions, setTrans]  = useState([]);
  const [form, setForm]           = useState({ agentId:'', montant:'', note:'' });
  const [prepayeForm, setPrepayeForm] = useState({ agentId:'', montant:'', jours:30, type:'abonnement' });

  useEffect(() => {
    api.get('/api/admin/agents').then(r => setAgents(Array.isArray(r.data)?r.data:[])).catch(()=>{});
    loadTrans();
  }, []);

  const loadTrans = async () => {
    setLoading(true);
    try { const r = await api.get('/api/admin/paiement'); setTrans(Array.isArray(r.data)?r.data:[]); }
    catch {}
    setLoading(false);
  };

  const handlePaiement = async (type) => {
    if (!form.agentId || !form.montant) { setMsg('❌ Chwazi ajan ak montant'); return; }
    setSaving(true);
    try {
      await api.post('/api/admin/paiement', { agentId:form.agentId, montant:parseFloat(form.montant), type, note:form.note });
      setMsg(`✅ ${type==='depot'?'Dépôt':'Retrait'} reyisi — ${form.montant} G`);
      setForm({ agentId:'', montant:'', note:'' });
      loadTrans();
      setTimeout(()=>setMsg(''),4000);
    } catch(e) { setMsg('❌ Erè: '+(e?.response?.data?.message||e.message)); }
    finally { setSaving(false); }
  };

  const handlePrepaye = async () => {
    if (!prepayeForm.agentId || !prepayeForm.montant) { setMsg('❌ Chwazi ajan ak montant'); return; }
    setSaving(true);
    try {
      await api.post('/api/admin/prepaye', prepayeForm);
      setMsg(`✅ Prépaiement ${prepayeForm.montant} G — ${prepayeForm.jours} jou aktive!`);
      setPrepayeForm({ agentId:'', montant:'', jours:30, type:'abonnement' });
      loadTrans();
      setTimeout(()=>setMsg(''),4000);
    } catch(e) { setMsg('❌ Erè: '+(e?.response?.data?.message||e.message)); }
    finally { setSaving(false); }
  };

  const AgentSelect = ({ val, onChange }) => (
    <select value={val} onChange={e=>onChange(e.target.value)}
      style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }}>
      <option value=''>— Chwazi Ajan —</option>
      {agents.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom} ({a.username})</option>)}
    </select>
  );

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:16, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Paiement</span>
        </div>

        {msg && (
          <div style={{ background:msg.startsWith('✅')?'#dcfce7':'#fee2e2', border:`1px solid ${msg.startsWith('✅')?'#16a34a':'#dc2626'}`, borderRadius:8, padding:12, marginBottom:14, fontWeight:700, color:msg.startsWith('✅')?'#16a34a':'#dc2626' }}>
            {msg}
          </div>
        )}

        {/* TABS */}
        <div style={{ display:'flex', gap:0, marginBottom:0, borderBottom:'2px solid #dee2e6' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding:'10px 20px', border:'none', background:activeTab===t.key?t.color:'#f8f9fa', color:activeTab===t.key?'white':'#444', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background:'white', borderRadius:'0 0 10px 10px', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>

          {/* DEPOT */}
          {activeTab === 'depot' && (
            <div style={{ maxWidth:480 }}>
              <h3 style={{ margin:'0 0 18px', fontWeight:800, color:'#16a34a' }}>💰 Fè yon Dépôt pou Ajan</h3>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Ajan</label>
                <AgentSelect val={form.agentId} onChange={v=>setForm(p=>({...p,agentId:v}))} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Montant (Gourdes)</label>
                <input type='number' value={form.montant} onChange={e=>setForm(p=>({...p,montant:e.target.value}))}
                  placeholder='Ex: 5000'
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Note (opsyonèl)</label>
                <input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))}
                  placeholder='Rezon dépôt a...'
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
              <button onClick={()=>handlePaiement('depot')} disabled={saving}
                style={{ width:'100%', padding:13, background:saving?'#ccc':'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:800, fontSize:15, cursor:saving?'not-allowed':'pointer' }}>
                {saving ? '⏳ Ap trete...' : '💰 Konfime Dépôt'}
              </button>
            </div>
          )}

          {/* RETRAIT */}
          {activeTab === 'retrait' && (
            <div style={{ maxWidth:480 }}>
              <h3 style={{ margin:'0 0 18px', fontWeight:800, color:'#dc2626' }}>🏧 Fè yon Retrait pou Ajan</h3>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Ajan</label>
                <AgentSelect val={form.agentId} onChange={v=>setForm(p=>({...p,agentId:v}))} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Montant (Gourdes)</label>
                <input type='number' value={form.montant} onChange={e=>setForm(p=>({...p,montant:e.target.value}))}
                  placeholder='Ex: 2000'
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Note (opsyonèl)</label>
                <input value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))}
                  placeholder='Rezon retrè a...'
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
              <button onClick={()=>handlePaiement('retrait')} disabled={saving}
                style={{ width:'100%', padding:13, background:saving?'#ccc':'#dc2626', color:'white', border:'none', borderRadius:8, fontWeight:800, fontSize:15, cursor:saving?'not-allowed':'pointer' }}>
                {saving ? '⏳ Ap trete...' : '🏧 Konfime Retrait'}
              </button>
            </div>
          )}

          {/* PRÉ-PAYER */}
          {activeTab === 'prepaye' && (
            <div style={{ maxWidth:520 }}>
              <h3 style={{ margin:'0 0 4px', fontWeight:800, color:'#7c3aed' }}>💳 Pré-Payer yon Ajan</h3>
              <p style={{ margin:'0 0 18px', fontSize:13, color:'#666' }}>Pèmèt ajan yo itilize sistèm nan san dèt — ou pran paiement an avans.</p>

              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Ajan</label>
                <AgentSelect val={prepayeForm.agentId} onChange={v=>setPrepayeForm(p=>({...p,agentId:v}))} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Montant (Gourdes)</label>
                  <input type='number' value={prepayeForm.montant} onChange={e=>setPrepayeForm(p=>({...p,montant:e.target.value}))}
                    placeholder='Ex: 10000'
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Duré (jou)</label>
                  <select value={prepayeForm.jours} onChange={e=>setPrepayeForm(p=>({...p,jours:parseInt(e.target.value)}))}
                    style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13 }}>
                    <option value={7}>7 jou</option>
                    <option value={15}>15 jou</option>
                    <option value={30}>30 jou</option>
                    <option value={60}>60 jou</option>
                    <option value={90}>90 jou</option>
                    <option value={365}>1 an</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:18 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:5, color:'#555' }}>Type de plan</label>
                <div style={{ display:'flex', gap:10 }}>
                  {[['abonnement','📅 Abonnement'],['credit','💰 Crédit Vant'],['mixte','🔀 Mixte']].map(([val,lbl]) => (
                    <button key={val} onClick={()=>setPrepayeForm(p=>({...p,type:val}))}
                      style={{ flex:1, padding:'10px 8px', border:`2px solid ${prepayeForm.type===val?'#7c3aed':'#ddd'}`, borderRadius:8, background:prepayeForm.type===val?'#f5f3ff':'white', fontWeight:700, fontSize:12, cursor:'pointer', color:prepayeForm.type===val?'#7c3aed':'#555' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* RÉSUMÉ */}
              {prepayeForm.agentId && prepayeForm.montant && (
                <div style={{ background:'#f5f3ff', border:'1px solid #ddd6fe', borderRadius:8, padding:14, marginBottom:16 }}>
                  <div style={{ fontWeight:800, fontSize:13, color:'#7c3aed', marginBottom:8 }}>📋 Rezime Prépaiement</div>
                  <div style={{ fontSize:13, lineHeight:1.8 }}>
                    <div>Ajan: <strong>{agents.find(a=>a.id===prepayeForm.agentId)?.prenom} {agents.find(a=>a.id===prepayeForm.agentId)?.nom}</strong></div>
                    <div>Montant: <strong>{prepayeForm.montant} Gourdes</strong></div>
                    <div>Duré: <strong>{prepayeForm.jours} jou</strong></div>
                    <div>Plan: <strong>{prepayeForm.type}</strong></div>
                  </div>
                </div>
              )}

              <button onClick={handlePrepaye} disabled={saving}
                style={{ width:'100%', padding:13, background:saving?'#ccc':'#7c3aed', color:'white', border:'none', borderRadius:8, fontWeight:800, fontSize:15, cursor:saving?'not-allowed':'pointer' }}>
                {saving ? '⏳ Ap aktive...' : '💳 Aktive Prépaiement'}
              </button>
            </div>
          )}

          {/* HISTORIQUE */}
          {activeTab === 'historique' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ margin:0, fontWeight:800 }}>📋 Istorik Tranzaksyon</h3>
                <button onClick={loadTrans} style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'7px 16px', fontWeight:700, fontSize:12, cursor:'pointer' }}>🔄 Aktualize</button>
              </div>
              {loading ? (
                <div style={{ textAlign:'center', padding:30, color:'#888' }}>⏳ Ap chaje...</div>
              ) : transactions.length === 0 ? (
                <div style={{ textAlign:'center', padding:30, color:'#888' }}>Pa gen tranzaksyon</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #dee2e6' }}>
                        {['Dat','Ajan','Tip','Montant','Note','Statut'].map(h => (
                          <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:800, fontSize:12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t, i) => (
                        <tr key={t._id||i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                          <td style={{ padding:'10px 14px', fontSize:12, color:'#888' }}>{t.date ? new Date(t.date).toLocaleDateString('fr') : '—'}</td>
                          <td style={{ padding:'10px 14px', fontWeight:700 }}>{t.agentNom || '—'}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ background: t.type==='depot'?'#dcfce7':t.type==='prepaye'?'#f5f3ff':'#fee2e2', color: t.type==='depot'?'#16a34a':t.type==='prepaye'?'#7c3aed':'#dc2626', borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                              {t.type==='depot'?'Dépôt':t.type==='retrait'?'Retrait':'Pré-paye'}
                            </span>
                          </td>
                          <td style={{ padding:'10px 14px', fontWeight:800, color: t.type==='depot'?'#16a34a':t.type==='prepaye'?'#7c3aed':'#dc2626' }}>{t.montant} G</td>
                          <td style={{ padding:'10px 14px', color:'#888', fontSize:12 }}>{t.note||'—'}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>✅ Ok</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
