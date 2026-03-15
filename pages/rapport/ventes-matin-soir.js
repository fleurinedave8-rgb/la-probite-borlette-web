import useRealtime from '../../hooks/useRealtime';
import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function VentesMatinSoir() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]   = useState(today);
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async ()=>{
    setLoading(true);
    try{ const r=await api.get('/api/rapport/partiel',{params:{date}}); setData(r.data); }
    catch{ setData(null); }
    finally{ setLoading(false); }
  };

  // ── REYÈL-TAN: recharge otomatik chak 30s + WS ──
  const { wsLive } = useRealtime({
    autoReload: load,
    reloadInterval: 30000,
  });

  return (
    <Layout>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Ventes Matin / Soir</h1>
        <div style={{ background:'white', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
            <div style={{ flex:1 }}><label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Date</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, boxSizing:'border-box' }} /></div>
            <button onClick={load} disabled={loading} style={{ padding:'9px 20px', background:'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
              {loading?'...':'🔍 Chèche'}
            </button>
          </div>
        </div>
        {data && (
          <div>
            {['MATIN','SOIR'].map(periode=>(
              <div key={periode} style={{ background:'white', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:12 }}>
                <h3 style={{ margin:'0 0 14px', fontWeight:800, color: periode==='MATIN'?'#f59e0b':'#1a73e8' }}>{periode}</h3>
                {[['Fiches vendu', data.fichesVendu||0],['Vente', (data.vente||0)+' HTG'],['Commission', (data.commision||0)+' HTG']].map(([l,v])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0f0f0' }}>
                    <span style={{ fontWeight:700 }}>{l}</span><span>{v}</span>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={()=>window.print()} style={{ width:'100%', padding:'12px', background:'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>🖨️ Imprimer</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
