import { useState } from 'react';
import Layout from '../../components/Layout';

export default function JeuxVirtuel() {
  const [game,  setGame]  = useState('kous-chen');
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0]);
  const [date2, setDate2] = useState(new Date().toISOString().split('T')[0]);
  const [result,setResult]= useState(null);

  const games = [
    { id:'kous-chen',   label:'Kous Chen',   color:'#1a73e8' },
    { id:'kous-cheval', label:'Kous Cheval',  color:'#16a34a' },
    { id:'lucky6',      label:'Lucky 6',      color:'#f59e0b' },
    { id:'keno',        label:'Keno',         color:'#7c3aed' },
    { id:'tout',        label:'Tout',         color:'#374151' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ background:'#1a73e8', borderRadius:12, padding:'12px 20px',
          marginBottom:14, textAlign:'center' }}>
          <span style={{ color:'white', fontWeight:900, fontSize:15 }}>
            🎮 Rapport Jeux Virtuel
          </span>
        </div>

        <div style={{ background:'white', borderRadius:12, padding:20,
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:14 }}>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {games.map(g => (
              <button key={g.id} onClick={() => setGame(g.id)}
                style={{ background: game===g.id ? g.color : g.color+'22',
                  color: game===g.id ? 'white' : g.color,
                  border:'none', borderRadius:8, padding:'8px 16px',
                  fontWeight:700, cursor:'pointer', fontSize:13 }}>
                {g.label}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:10, alignItems:'flex-end' }}>
            {[['Date Debut',date1,setDate1],['Date Fin',date2,setDate2]].map(([l,v,s]) => (
              <div key={l}>
                <label style={{ display:'block', fontWeight:700, fontSize:12,
                  marginBottom:4, color:'#555' }}>{l}</label>
                <input type="date" value={v} onChange={e => s(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd',
                    borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <button onClick={() => setResult({ mise:0, perte:0, profit:0 })}
              style={{ padding:'9px 20px', background:'#1a73e8', color:'white',
                border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
              🔍 Chèche
            </button>
          </div>
        </div>

        {result && (
          <div style={{ background:'white', borderRadius:12, padding:20,
            boxShadow:'0 1px 4px rgba(0,0,0,0.08)', textAlign:'center' }}>
            <div style={{ fontWeight:900, fontSize:18, marginBottom:4 }}>Résultat</div>
            <div style={{ color:'#888', fontSize:12, marginBottom:16 }}>
              De: {date1} — À: {date2}
            </div>
            {[['Mise','💰',result.mise,'#1a73e8'],
              ['Perte','📉',result.perte,'#dc2626'],
              ['Profit','📈',result.profit,'#16a34a']].map(([lbl,ic,val,col]) => (
              <div key={lbl} style={{ display:'flex', justifyContent:'space-between',
                padding:'12px 0', borderBottom:'1px solid #f0f0f0' }}>
                <span style={{ fontWeight:700 }}>{ic} {lbl}</span>
                <span style={{ fontWeight:900, color:col }}>{Number(val).toFixed(2)} G</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
