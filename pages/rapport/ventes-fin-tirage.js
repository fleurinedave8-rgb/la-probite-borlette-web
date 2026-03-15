import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES = ['Tout','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir','New-york matin','New-york soir'];
const SUCCURSALES = ['Tout','Central','Nord','Sud','Est','Ouest'];

export default function VentesFinTirage() {
  const today = new Date().toISOString().split('T')[0];
  const [debut, setDebut]     = useState(today);
  const [fin, setFin]         = useState(today);
  const [succursal, setSuccursal] = useState('Tout');
  const [tirage, setTirage]   = useState('Tout');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/tirage', { params:{ debut,fin,succursal,tirage } });
      setResult(r.data || { qtyPos:0, qtyFacturable:0, superviseurs:[], recap:{} });
    } catch {
      setResult({ qtyPos:0, qtyFacturable:0, superviseurs:[], recap:{} });
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE</span>
        </div>
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>

          {/* FILTRES */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:14 }}>
            {[['Debut',debut,setDebut,'date'],['Fin',fin,setFin,'date']].map(([label,val,setter,type])=>(
              <div key={label}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>{label}</label>
                <div style={{ display:'flex', alignItems:'center', border:'1px solid #ccc', borderRadius:4, padding:'8px 12px' }}>
                  <input type={type} value={val} onChange={e=>setter(e.target.value)} style={{ flex:1, border:'none', outline:'none', fontSize:14 }} />
                  <span style={{ color:'#16a34a', fontWeight:900 }}>✓</span>
                </div>
              </div>
            ))}
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>Succursal</label>
              <div style={{ display:'flex', alignItems:'center', border:'1px solid #ccc', borderRadius:4, padding:'8px 12px' }}>
                <select value={succursal} onChange={e=>setSuccursal(e.target.value)} style={{ flex:1, border:'none', outline:'none', fontSize:14 }}>
                  {SUCCURSALES.map(s=><option key={s}>{s}</option>)}
                </select>
                <span style={{ color:'#16a34a', fontWeight:900 }}>✓</span>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>Tirage</label>
              <div style={{ display:'flex', alignItems:'center', border:'1px solid #ccc', borderRadius:4, padding:'8px 12px' }}>
                <select value={tirage} onChange={e=>setTirage(e.target.value)} style={{ flex:1, border:'none', outline:'none', fontSize:14 }}>
                  {TIRAGES.map(t=><option key={t}>{t}</option>)}
                </select>
                <span style={{ color:'#16a34a', fontWeight:900 }}>✓</span>
              </div>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            style={{ width:'100%', padding:13, background:'#1a73e8', color:'white', border:'none', borderRadius:4, fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:20 }}>
            {loading?'Chargement...':'Rechercher'}
          </button>

          {result && (
            <div>
              {/* ENTETE RAPPORT */}
              <div style={{ textAlign:'center', marginBottom:16, padding:16, border:'1px solid #eee', borderRadius:8 }}>
                <div style={{ fontWeight:900, fontSize:18, marginBottom:4 }}>LA-PROBITE-BORLETTE</div>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>Rapport de vente</div>
                <div style={{ fontSize:13, color:'#666' }}>Succursal : {succursal} &nbsp;|&nbsp; Tirage : {tirage}</div>
                <div style={{ fontSize:13, color:'#666' }}>Debut : {debut} &nbsp; Fin : {fin}</div>
                <div style={{ fontSize:13, marginTop:6 }}>Quantité POS : <strong>{result.qtyPos||0}</strong> &nbsp;|&nbsp; Quantité POS FACTURABLE : <strong>{result.qtyFacturable||0}</strong></div>
              </div>

              {/* TABLEAU SUPERVISEUR */}
              <h3 style={{ fontWeight:800, marginBottom:10 }}>Superviseur</h3>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:16 }}>
                <thead><tr style={{ background:'#f8f9fa' }}>
                  {['Superviseur','Total ventes','A payé','Pourcentage','Balance'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(result.superviseurs||[]).length===0
                    ? <tr><td colSpan={5} style={{ padding:20, textAlign:'center', color:'#666', fontStyle:'italic' }}>No data available in table</td></tr>
                    : (result.superviseurs||[]).map((s,i)=>(
                      <tr key={i} style={{ borderBottom:'1px solid #dee2e6' }}>
                        <td style={{ padding:'10px 14px' }}>{s.superviseur}</td>
                        <td style={{ padding:'10px 14px', textAlign:'right' }}>{s.totalVentes}</td>
                        <td style={{ padding:'10px 14px', textAlign:'right' }}>{s.apaye}</td>
                        <td style={{ padding:'10px 14px', textAlign:'right' }}>{s.pourcentage}</td>
                        <td style={{ padding:'10px 14px', textAlign:'right', fontWeight:700, color:'#16a34a' }}>{s.balance}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* RÉCAP */}
              <div style={{ background:'#f8f9fa', borderRadius:8, padding:14, marginBottom:16, overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr style={{ background:'#e5e7eb' }}>
                    {['TFiche','Vente','A payé','%Agent','Balance Sans %agent','Balance Avec %age','%Superviseur','Balance Sans %sup','Balance Avec %sup'].map(h=>(
                      <th key={h} style={{ padding:'8px 10px', fontWeight:700, borderBottom:'2px solid #dee2e6', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    <tr>
                      {[result.recap?.tfiche||0,result.recap?.vente||'0.00',result.recap?.apaye||'0.00',result.recap?.pctAgent||'0.00',
                        result.recap?.balSans||'0.00',result.recap?.balAvec||'0.00',result.recap?.pctSup||'0.00',
                        result.recap?.balSupSans||'0.00',result.recap?.balSupAvec||'0.00'].map((v,i)=>(
                        <td key={i} style={{ padding:'8px 10px', textAlign:'center', fontWeight:700, borderBottom:'1px solid #dee2e6' }}>{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ textAlign:'center' }}>
                <button onClick={()=>window.print()} style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:4, padding:'11px 40px', fontWeight:700, fontSize:14, cursor:'pointer' }}>Imprimer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
