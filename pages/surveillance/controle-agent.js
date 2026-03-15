import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function ControleAgent() {
  const today = new Date().toISOString().split('T')[0];
  const [debut, setDebut]   = useState(today);
  const [fin, setFin]       = useState(today);
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ api.get('/api/admin/agents').then(r=>{ setAgents(r.data||[]); if(r.data?.[0]) setSelected(r.data[0].id); }).catch(()=>{}); },[]);

  const load = async ()=>{
    setLoading(true);
    try{
      const r = await api.get('/api/rapport/partiel',{ params:{ debut, fin, agentId:selected } });
      setData(r.data);
    }catch{ setData({ fichesVendu:0, vente:'0.00', commision:'0.00' }); }
    finally{ setLoading(false); }
  };

  return (
    <Layout>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Contrôle Agent</h1>
        <div style={{ background:'white', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16 }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Début</label>
              <input type="date" value={debut} onChange={e=>setDebut(e.target.value)} style={{ padding:'9px 12px', border:'1px solid #ddd', borderRadius:8 }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Fin</label>
              <input type="date" value={fin} onChange={e=>setFin(e.target.value)} style={{ padding:'9px 12px', border:'1px solid #ddd', borderRadius:8 }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Agent</label>
              <select value={selected} onChange={e=>setSelected(e.target.value)} style={{ padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, minWidth:160 }}>
                {agents.map(a=><option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
              </select>
            </div>
            <button onClick={load} disabled={loading} style={{ padding:'9px 20px', background:'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
              {loading ? '...' : '🔍 Chèche'}
            </button>
          </div>
        </div>

        {data && (
          <div style={{ background:'white', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800 }}>Rezilta</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              {[['Fiches vendu', data.fichesVendu, '#1a73e8'],['Vente', data.vente+' HTG', '#16a34a'],['Commission', data.commision+' HTG', '#f59e0b']].map(([l,v,c])=>(
                <div key={l} style={{ background:c+'22', borderRadius:8, padding:16, textAlign:'center', border:`2px solid ${c}` }}>
                  <div style={{ fontSize:22, fontWeight:900, color:c }}>{v}</div>
                  <div style={{ fontSize:12, color:'#666', marginTop:4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
