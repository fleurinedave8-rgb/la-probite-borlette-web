import useRealtime from '../../hooks/useRealtime';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt  = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtN = n => Number(n||0).toLocaleString('fr-HT');
const today = () => new Date().toISOString().split('T')[0];
const pad   = n => String(n).padStart(2,'0');
const fmtDate = d => {
  if (!d) return '—';
  const dt=new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()}`;
};
const TIRAGES = ['Tout','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir',
  'New-york matin','New-york soir','Ohio matin','Ohio soir',
  'Chicago matin','Chicago soir','Maryland midi','Maryland soir',
  'Tennessee matin','Tennessee soir'];

export default function FichesGagnant() {
  const [statut,  setStatut]  = useState('tout');
  const [debut,   setDebut]   = useState(today());
  const [fin,     setFin]     = useState(today());
  const [agent,   setAgent]   = useState('Tout');
  const [tirage,  setTirage]  = useState('Tout');
  const [agents,  setAgents]  = useState([]);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [paying,  setPaying]  = useState(''); // ticket k ap peye a
  const [msgPay,  setMsgPay]  = useState({ t:'', ok:true });

  useEffect(()=>{
    api.get('/api/admin/agents').then(r=>{
      setAgents(Array.isArray(r.data)?r.data.filter(a=>a.role==='agent'):[]);
    }).catch(()=>{});
  },[]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/gagnant',{params:{debut,fin,agentId:agent,tirage,statut}});
      setResult(r.data||{fiches:[],totalMise:'0.00',totalGain:'0.00'});
    } catch { setResult({fiches:[],totalMise:'0.00',totalGain:'0.00'}); }
    setLoading(false);
  };

  const fiches = (result?.fiches||[]).filter(f=>
    !search||[f.ticket,f.agent,f.tirage].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()))
  );

  const handlePaye = async (ticket) => {
    setPaying(ticket);
    try {
      await api.post(`/api/gagnant/payer/${ticket}`);
      setMsgPay({ t:`✅ Fich #${ticket} make kòm PEYE!`, ok:true });
      setTimeout(()=>setMsgPay({t:'',ok:true}), 4000);
      load(); // rechaje lis la
    } catch(e) {
      setMsgPay({ t: e?.response?.data?.message || '❌ Erè pèman', ok:false });
      setTimeout(()=>setMsgPay({t:'',ok:true}), 4000);
    }
    setPaying('');
  };

  const handlePrint = () => window.print();

  const handleCSV = () => {
    const rows = [
      ['Ticket','Agent','Tiraj','Dat','Mise','Gain','Payée'],
      ...fiches.map(f=>[f.ticket,f.agent,f.tirage,fmtDate(f.dateVente),f.mise,f.gain,f.paye?'Oui':'Non'])
    ];
    const csv=rows.map(r=>r.join(',')).join('\n');
    const el=document.createElement('a');
    el.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    el.download=`fiches-gagnant-${debut}-${fin}.csv`;
    el.click();
  };

  const STAT_TABS = [
    ['tout','Tout','#1a73e8'],
    ['payee','✅ Payée','#16a34a'],
    ['nonpayee','⏳ Non Payée','#f59e0b'],
  ];

  const thS = {padding:'10px 12px',fontWeight:800,fontSize:11,color:'white',
    whiteSpace:'nowrap',borderRight:'1px solid rgba(255,255,255,0.15)'};

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
        <div style={{background:'linear-gradient(135deg,#15803d,#166534)',
          borderRadius:12,padding:'14px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#fef08a',fontWeight:900,fontSize:18}}>🏆 FICHÈ GANYAN</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:12}}>LA-PROBITE-BORLETTE</div>
          </div>
          {result && (
            <div style={{textAlign:'right'}}>
              <div style={{color:'#4ade80',fontWeight:900,fontSize:22}}>
                {fmtN(fiches.length)} fichè
              </div>
              <div style={{color:'rgba(255,255,255,0.7)',fontSize:11}}>pou peryòd la</div>
            </div>
          )}
        </div>

        {/* TABS STATUT */}
        <div className="no-print" style={{display:'flex',gap:8,marginBottom:12}}>
          {STAT_TABS.map(([k,l,c])=>(
            <button key={k} onClick={()=>setStatut(k)}
              style={{flex:1,padding:'10px',border:`2px solid ${c}`,borderRadius:10,
                background:statut===k?c:'white',color:statut===k?'white':c,
                fontWeight:800,cursor:'pointer',fontSize:13,transition:'all 0.15s'}}>
              {l}
            </button>
          ))}
        </div>

        {/* FILTRES */}
        <div className="no-print" style={{background:'white',borderRadius:12,padding:16,
          marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',
            gap:10,marginBottom:10}}>
            {[['📅 Debut',debut,setDebut],['📅 Fin',fin,setFin]].map(([l,v,s])=>(
              <div key={l}>
                <label style={{display:'block',fontWeight:700,fontSize:11,
                  marginBottom:4,color:'#555'}}>{l}</label>
                <input type="date" value={v} onChange={e=>s(e.target.value)}
                  style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',
                    borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
              </div>
            ))}
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:4,color:'#555'}}>
                👤 Ajan
              </label>
              <select value={agent} onChange={e=>setAgent(e.target.value)}
                style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:13}}>
                <option value="Tout">Tout Ajan</option>
                {agents.map(a=>(
                  <option key={a._id||a.id} value={a._id||a.id}>
                    {a.prenom} {a.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:4,color:'#555'}}>
                🎰 Tiraj
              </label>
              <select value={tirage} onChange={e=>setTirage(e.target.value)}
                style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:13}}>
                {TIRAGES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:4,color:'#555'}}>
                🔍 Rechèch
              </label>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Ticket, ajan..."
                style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={load} disabled={loading}
              style={{flex:1,minWidth:100,padding:'11px',background:loading?'#ccc':'#16a34a',
                color:'white',border:'none',borderRadius:8,fontWeight:800,fontSize:14,
                cursor:loading?'default':'pointer'}}>
              {loading?'⏳...':'🔍 Chèche'}
            </button>
            {result&&<>
              <button onClick={handleCSV}
                style={{padding:'11px 18px',background:'#1a73e8',color:'white',border:'none',
                  borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>📥 CSV</button>
              <button onClick={handlePrint}
                style={{padding:'11px 18px',background:'#7c3aed',color:'white',border:'none',
                  borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer'}}>🖨️ Enprime</button>
            </>}
          </div>
        </div>

        {/* RÉSUMÉ TOTAUX */}
        {result && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
            {[
              {icon:'🎫',label:'Fichè Ganyan',val:fmtN(fiches.length),color:'#16a34a',bg:'#f0fdf4'},
              {icon:'💵',label:'Total Mise',  val:`${fmt(result.totalMise)} G`,color:'#1a73e8',bg:'#eff6ff'},
              {icon:'🏆',label:'Total Gain',  val:`${fmt(result.totalGain)} G`,color:'#f59e0b',bg:'#fffbeb'},
            ].map(c=>(
              <div key={c.label} style={{background:c.bg,borderRadius:12,padding:'14px 16px',
                borderLeft:`4px solid ${c.color}`,textAlign:'center'}}>
                <div style={{fontSize:24}}>{c.icon}</div>
                <div style={{fontWeight:900,fontSize:20,color:c.color}}>{c.val}</div>
                <div style={{fontSize:11,color:'#666',fontWeight:700}}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* TABLE PRINCIPALE */}
        {result && (
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden'}}>
            <div style={{background:'linear-gradient(90deg,#15803d,#166534)',padding:'12px 16px',
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'white',fontWeight:900,fontSize:14}}>🏆 Lis Fichè Ganyan</span>
              <span style={{color:'rgba(255,255,255,0.8)',fontSize:12}}>
                {fiches.length} fichè · Mise: {fmt(result.totalMise)} G · Gain: {fmt(result.totalGain)} G
              </span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#16a34a'}}>
                    {['No','Ticket','Agent','Tiraj','Dat','Mise (G)','Gain (G)','Statut'].map(h=>(
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fiches.length===0
                    ? <tr><td colSpan={8} style={{padding:24,textAlign:'center',color:'#888',fontStyle:'italic'}}>
                        Pa gen fichè ganyan pou kritè sa yo
                      </td></tr>
                    : fiches.map((f,i)=>(
                      <tr key={f._id||f.ticket||i}
                        style={{background:i%2===0?'white':'#f9fdf9',
                          transition:'background 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#f0fdf4'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#f9fdf9'}>
                        <td style={{padding:'9px 12px',color:'#888',fontSize:11}}>{i+1}</td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={{fontFamily:'monospace',fontWeight:900,
                            color:'#16a34a',fontSize:13}}>#{f.ticket||'—'}</span>
                        </td>
                        <td style={{padding:'9px 12px',fontWeight:600,fontSize:13}}>{f.agent||'—'}</td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={{background:'#eff6ff',color:'#1a73e8',borderRadius:20,
                            padding:'3px 10px',fontSize:11,fontWeight:700}}>
                            {f.tirageLabel||f.tirage||'—'}
                          </span>
                        </td>
                        <td style={{padding:'9px 12px',fontSize:12,color:'#555'}}>
                          {fmtDate(f.dateVente)}
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#1a73e8'}}>
                          {fmt(f.mise)}
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontWeight:900,color:'#16a34a',fontSize:14}}>
                          {fmt(f.gain)}
                        </td>
                        <td style={{padding:'9px 12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                            <span style={{
                              background:f.paye?'#dcfce7':'#fef9c3',
                              color:f.paye?'#16a34a':'#854d0e',
                              borderRadius:20,padding:'3px 10px',
                              fontSize:11,fontWeight:800,whiteSpace:'nowrap'
                            }}>
                              {f.paye?'✅ Payée':'⏳ Non Payée'}
                            </span>
                            {!f.paye && (
                              <button
                                onClick={()=>handlePaye(f.ticket)}
                                disabled={paying===f.ticket}
                                style={{
                                  background: paying===f.ticket?'#ccc':'#16a34a',
                                  color:'white',border:'none',borderRadius:8,
                                  padding:'5px 12px',fontWeight:800,
                                  cursor:paying===f.ticket?'default':'pointer',
                                  fontSize:11,whiteSpace:'nowrap'
                                }}>
                                {paying===f.ticket?'⏳...':'💳 Peye'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
                {fiches.length>0 && (
                  <tfoot>
                    <tr style={{background:'#1e293b'}}>
                      <td colSpan={5} style={{padding:'11px 12px',color:'white',fontWeight:900,fontSize:13}}>
                        TOTAL — {fiches.length} fichè
                      </td>
                      <td style={{padding:'11px 12px',textAlign:'right',
                        color:'#60a5fa',fontWeight:900,fontSize:14}}>
                        {fmt(result.totalMise)}
                      </td>
                      <td style={{padding:'11px 12px',textAlign:'right',
                        color:'#4ade80',fontWeight:900,fontSize:14}}>
                        {fmt(result.totalGain)}
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
