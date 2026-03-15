import useRealtime from '../../hooks/useRealtime';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt  = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const today = () => new Date().toISOString().split('T')[0];

export default function Defisi() {
  const [debut,   setDebut]   = useState(today());
  const [fin,     setFin]     = useState(today());
  const [agent,   setAgent]   = useState('Tout');
  const [agents,  setAgents]  = useState([]);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    api.get('/api/admin/agents').then(r=>{
      setAgents(Array.isArray(r.data)?r.data.filter(a=>a.role==='agent'):[]);
    }).catch(()=>{});
  },[]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/defisi',{params:{debut,fin,agentId:agent}});
      setResult(r.data);
    } catch { setResult(null); }
    setLoading(false);
  };

  const rows = result?.rows||[];
  const defisi = rows.filter(r=>r.status==='defisi');
  const profit = rows.filter(r=>r.status==='profit');
  const zero   = rows.filter(r=>r.status==='zero');

  const handlePrint = () => window.print();
  const handleCSV = () => {
    const data=[
      ['Agent','Fichè','Vant','Gain','Komisyon','Net','Statut'],
      ...rows.map(r=>[r.agent,r.ficheCount,r.vente,r.gain,r.komisyon,r.net,r.status])
    ];
    const csv=data.map(r=>r.join(',')).join('\n');
    const el=document.createElement('a');
    el.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    el.download=`defisi-${debut}-${fin}.csv`;
    el.click();
  };

  const thS = {padding:'10px 12px',fontWeight:800,fontSize:11,color:'white',
    whiteSpace:'nowrap',borderRight:'1px solid rgba(255,255,255,0.15)'};

  const statusStyle = (status) => {
    if (status==='defisi') return {background:'#fee2e2',color:'#991b1b',borderRadius:20,
      padding:'3px 12px',fontSize:11,fontWeight:800};
    if (status==='profit') return {background:'#dcfce7',color:'#166534',borderRadius:20,
      padding:'3px 12px',fontSize:11,fontWeight:800};
    return {background:'#f3f4f6',color:'#555',borderRadius:20,padding:'3px 12px',fontSize:11,fontWeight:800};
  };

  // ── REYÈL-TAN: recharge otomatik chak 30s + WS ──
  const { wsLive } = useRealtime({
    autoReload: load,
    reloadInterval: 30000,
  });

  return (
    <Layout>
      <style>{`@media print{nav,button,select,.no-print{display:none!important;}body{font-size:11px;}}`}</style>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 8px'}}>

        {/* BANNIÈRE */}
        <div style={{background:'linear-gradient(135deg,#4c1d95,#6d28d9)',
          borderRadius:12,padding:'14px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#c4b5fd',fontWeight:900,fontSize:18}}>📉 BILAN DEFISI / PROFIT</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:12}}>LA-PROBITE-BORLETTE</div>
          </div>
          {result && (
            <div style={{textAlign:'right'}}>
              <div style={{color:parseFloat(result.totalNet)>=0?'#4ade80':'#f87171',
                fontWeight:900,fontSize:20}}>{fmt(result.totalNet)} G</div>
              <div style={{color:'rgba(255,255,255,0.6)',fontSize:11}}>Net total</div>
            </div>
          )}
        </div>

        {/* FILTRES */}
        <div className="no-print" style={{background:'white',borderRadius:12,padding:16,
          marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
          display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>
          {[['📅 Debut',debut,setDebut],['📅 Fin',fin,setFin]].map(([l,v,s])=>(
            <div key={l} style={{flex:1,minWidth:130}}>
              <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:4,color:'#555'}}>{l}</label>
              <input type="date" value={v} onChange={e=>s(e.target.value)}
                style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
            </div>
          ))}
          <div style={{flex:1,minWidth:130}}>
            <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:4,color:'#555'}}>👤 Ajan</label>
            <select value={agent} onChange={e=>setAgent(e.target.value)}
              style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13}}>
              <option value="Tout">Tout Ajan</option>
              {agents.map(a=>(
                <option key={a._id||a.id} value={a._id||a.id}>{a.prenom} {a.nom}</option>
              ))}
            </select>
          </div>
          <button onClick={load} disabled={loading}
            style={{padding:'10px 24px',background:loading?'#ccc':'#7c3aed',color:'white',
              border:'none',borderRadius:8,fontWeight:800,fontSize:14,
              cursor:loading?'default':'pointer',height:40,alignSelf:'flex-end'}}>
            {loading?'⏳...':'🔍 Chèche'}
          </button>
          {result&&<>
            <button onClick={handleCSV}
              style={{padding:'10px 16px',background:'#1a73e8',color:'white',border:'none',
                borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',height:40,alignSelf:'flex-end'}}>
              📥 CSV</button>
            <button onClick={handlePrint}
              style={{padding:'10px 16px',background:'#7c3aed',color:'white',border:'none',
                borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',height:40,alignSelf:'flex-end'}}>
              🖨️ Enprime</button>
          </>}
        </div>

        {/* STATS KARD */}
        {result && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
            {[
              {icon:'📉',label:'Defisi',val:defisi.length,color:'#dc2626',bg:'#fef2f2'},
              {icon:'📈',label:'Profit', val:profit.length,color:'#16a34a',bg:'#f0fdf4'},
              {icon:'💰',label:'Total Vant',val:`${fmt(result.totalVente)} G`,color:'#1a73e8',bg:'#eff6ff'},
              {icon:'🏆',label:'Total Gain', val:`${fmt(result.totalGain)} G`,color:'#f59e0b',bg:'#fffbeb'},
            ].map(c=>(
              <div key={c.label} style={{background:c.bg,borderRadius:12,padding:'14px 16px',
                borderLeft:`4px solid ${c.color}`,textAlign:'center'}}>
                <div style={{fontSize:22}}>{c.icon}</div>
                <div style={{fontWeight:900,fontSize:18,color:c.color}}>{c.val}</div>
                <div style={{fontSize:11,color:'#666',fontWeight:700}}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* TABLE */}
        {result && (
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden'}}>
            <div style={{background:'linear-gradient(90deg,#4c1d95,#6d28d9)',padding:'12px 16px'}}>
              <span style={{color:'white',fontWeight:900,fontSize:14}}>📉 Bilan pa Ajan</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#7c3aed'}}>
                    {['No','Ajan','%Kom','T.Fichè','Vant (G)','Gain (G)','Komisyon (G)','Net (G)','Statut'].map(h=>(
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length===0
                    ? <tr><td colSpan={9} style={{padding:24,textAlign:'center',color:'#888',fontStyle:'italic'}}>
                        Pa gen done pou peryòd sa
                      </td></tr>
                    : rows.map((r,i)=>(
                      <tr key={i}
                        style={{background:
                          r.status==='defisi'?'#fff5f5':
                          r.status==='profit'?'#f0fdf4':'white',
                          transition:'background 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#f5f3ff'}
                        onMouseLeave={e=>e.currentTarget.style.background=
                          r.status==='defisi'?'#fff5f5':r.status==='profit'?'#f0fdf4':'white'}>
                        <td style={{padding:'9px 12px',color:'#888',fontSize:11}}>{i+1}</td>
                        <td style={{padding:'9px 12px',fontWeight:700,fontSize:13}}>{r.agent}</td>
                        <td style={{padding:'9px 12px',textAlign:'center',color:'#f59e0b',fontWeight:700}}>
                          {r.pct}%
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'center'}}>{r.ficheCount}</td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#16a34a'}}>
                          {fmt(r.vente)}
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#f59e0b'}}>
                          {fmt(r.gain)}
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'right',color:'#1a73e8'}}>
                          {fmt(r.komisyon)}
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontWeight:900,fontSize:14,
                          color:parseFloat(r.net)<0?'#dc2626':parseFloat(r.net)>0?'#16a34a':'#888'}}>
                          {fmt(r.net)}
                        </td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={statusStyle(r.status)}>
                            {r.status==='defisi'?'📉 Defisi':r.status==='profit'?'📈 Profit':'➡️ Zero'}
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
                {rows.length>0 && (
                  <tfoot>
                    <tr style={{background:'#1e293b'}}>
                      <td colSpan={3} style={{padding:'11px 12px',color:'white',fontWeight:900,fontSize:13}}>
                        TOTAL JENERAL
                      </td>
                      <td style={{padding:'11px 12px',textAlign:'center',color:'#f59e0b',fontWeight:900}}>
                        {rows.reduce((s,r)=>s+r.ficheCount,0)}
                      </td>
                      <td style={{padding:'11px 12px',textAlign:'right',color:'#4ade80',fontWeight:900}}>
                        {fmt(result.totalVente)}
                      </td>
                      <td style={{padding:'11px 12px',textAlign:'right',color:'#fbbf24',fontWeight:900}}>
                        {fmt(result.totalGain)}
                      </td>
                      <td style={{padding:'11px 12px',textAlign:'right',color:'#60a5fa',fontWeight:900}}>
                        {fmt(result.totalKomisyon)}
                      </td>
                      <td style={{padding:'11px 12px',textAlign:'right',fontWeight:900,fontSize:16,
                        color:parseFloat(result.totalNet)>=0?'#4ade80':'#f87171'}}>
                        {fmt(result.totalNet)}
                      </td>
                      <td/>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
