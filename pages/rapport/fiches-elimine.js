import useRealtime from '../../hooks/useRealtime';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt  = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const today = () => new Date().toISOString().split('T')[0];
const pad   = n => String(n).padStart(2,'0');
const fmtDate = d => { if(!d)return'—'; const dt=new Date(d); return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()}`; };

const TIRAGES = ['Tout','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir',
  'New-york matin','New-york soir','Ohio matin','Ohio soir',
  'Chicago matin','Chicago soir','Maryland midi','Maryland soir',
  'Tennessee matin','Tennessee soir'];

export default function FichesElimine() {
  const [debut,   setDebut]   = useState(today());
  const [fin,     setFin]     = useState(today());
  const [agent,   setAgent]   = useState('Tout');
  const [tirage,  setTirage]  = useState('Tout');
  const [agents,  setAgents]  = useState([]);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(0);
  const PER = 20;

  useEffect(()=>{
    api.get('/api/admin/agents').then(r=>{
      setAgents(Array.isArray(r.data)?r.data.filter(a=>a.role==='agent'):[]);
    }).catch(()=>{});
  },[]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/eliminer',{params:{debut,fin,agentId:agent,tirage}});
      setResult(r.data||{fiches:[],totalMise:'0.00'});
      setPage(0);
    } catch { setResult({fiches:[],totalMise:'0.00'}); }
    setLoading(false);
  };

  const fiches = (result?.fiches||[]).filter(f=>
    !search||[f.ticket,f.agent,f.tirage].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase()))
  );
  const paged = fiches.slice(page*PER,(page+1)*PER);
  const totalPages = Math.max(1,Math.ceil(fiches.length/PER));
  const totalMise  = fiches.reduce((s,f)=>s+parseFloat(f.mise||f.total||0),0);

  const handlePrint = () => window.print();
  const handleCSV = () => {
    const rows=[['Ticket','Agent','Tiraj','Dat','Statut','Mise'],
      ...fiches.map(f=>[f.ticket,f.agent,f.tirage,fmtDate(f.dateVente),f.statut||'elimine',f.mise||f.total||0])];
    const csv=rows.map(r=>r.join(',')).join('\n');
    const el=document.createElement('a');
    el.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    el.download=`fiches-elimine-${debut}-${fin}.csv`;
    el.click();
  };

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
        <div style={{background:'linear-gradient(135deg,#991b1b,#7f1d1d)',
          borderRadius:12,padding:'14px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#fca5a5',fontWeight:900,fontSize:18}}>❌ FICHÈ ELIMINE / BLOKE</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:12}}>LA-PROBITE-BORLETTE</div>
          </div>
          {result && (
            <div style={{textAlign:'right'}}>
              <div style={{color:'#fca5a5',fontWeight:900,fontSize:22}}>{fiches.length} fichè</div>
              <div style={{color:'rgba(255,255,255,0.6)',fontSize:12}}>
                Total: {fmt(totalMise)} G
              </div>
            </div>
          )}
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
              <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:4,color:'#555'}}>👤 Ajan</label>
              <select value={agent} onChange={e=>setAgent(e.target.value)}
                style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13}}>
                <option value="Tout">Tout Ajan</option>
                {agents.map(a=>(
                  <option key={a._id||a.id} value={a._id||a.id}>{a.prenom} {a.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:4,color:'#555'}}>🎰 Tiraj</label>
              <select value={tirage} onChange={e=>setTirage(e.target.value)}
                style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',borderRadius:8,fontSize:13}}>
                {TIRAGES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:4,color:'#555'}}>🔍 Rechèch</label>
              <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}
                placeholder="Ticket, ajan..."
                style={{width:'100%',padding:'9px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={load} disabled={loading}
              style={{flex:1,minWidth:100,padding:'11px',background:loading?'#ccc':'#dc2626',
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

        {/* STATS */}
        {result && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14}}>
            {[
              {icon:'❌',label:'Total Elimine',val:fiches.length,           color:'#dc2626',bg:'#fef2f2'},
              {icon:'🔒',label:'Fichè Bloke',  val:fiches.filter(f=>f.statut==='bloque').length,color:'#f59e0b',bg:'#fffbeb'},
              {icon:'💰',label:'Total Mise',   val:`${fmt(totalMise)} G`,   color:'#1a73e8',bg:'#eff6ff'},
            ].map(c=>(
              <div key={c.label} style={{background:c.bg,borderRadius:12,padding:'14px 16px',
                borderLeft:`4px solid ${c.color}`,textAlign:'center'}}>
                <div style={{fontSize:22}}>{c.icon}</div>
                <div style={{fontWeight:900,fontSize:20,color:c.color}}>{c.val}</div>
                <div style={{fontSize:11,color:'#666',fontWeight:700}}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* TABLE */}
        {result && (
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden'}}>
            <div style={{background:'linear-gradient(90deg,#991b1b,#7f1d1d)',padding:'12px 16px',
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'white',fontWeight:900,fontSize:14}}>❌ Lis Fichè Elimine / Bloke</span>
              <span style={{color:'rgba(255,255,255,0.8)',fontSize:12}}>{fiches.length} fichè</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#dc2626'}}>
                    {['No','Ticket','Agent','Tiraj','Dat','Statut','Mise (G)'].map(h=>(
                      <th key={h} style={thS}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length===0
                    ? <tr><td colSpan={7} style={{padding:24,textAlign:'center',color:'#888',fontStyle:'italic'}}>
                        Pa gen fichè pou kritè sa yo
                      </td></tr>
                    : paged.map((f,i)=>(
                      <tr key={f._id||i}
                        style={{background:i%2===0?'white':'#fff5f5',transition:'background 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#fff5f5'}>
                        <td style={{padding:'9px 12px',color:'#888',fontSize:11}}>{page*PER+i+1}</td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={{fontFamily:'monospace',fontWeight:900,color:'#dc2626',fontSize:13}}>
                            #{f.ticket||'—'}
                          </span>
                        </td>
                        <td style={{padding:'9px 12px',fontWeight:600,fontSize:13}}>{f.agent||'—'}</td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={{background:'#eff6ff',color:'#1a73e8',borderRadius:20,
                            padding:'3px 10px',fontSize:11,fontWeight:700}}>
                            {f.tirageLabel||f.tirage||'—'}
                          </span>
                        </td>
                        <td style={{padding:'9px 12px',fontSize:12,color:'#555'}}>
                          {fmtDate(f.dateVente||f.date)}
                        </td>
                        <td style={{padding:'9px 12px'}}>
                          <span style={{
                            background:f.statut==='bloque'?'#fef9c3':'#fee2e2',
                            color:f.statut==='bloque'?'#854d0e':'#991b1b',
                            borderRadius:20,padding:'3px 12px',fontSize:11,fontWeight:800
                          }}>
                            {f.statut==='bloque'?'🔒 Bloke':'❌ Elimine'}
                          </span>
                        </td>
                        <td style={{padding:'9px 12px',textAlign:'right',fontWeight:700,color:'#dc2626'}}>
                          {fmt(f.mise||f.total||0)}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
                {fiches.length>0 && (
                  <tfoot>
                    <tr style={{background:'#1e293b'}}>
                      <td colSpan={6} style={{padding:'11px 12px',color:'white',fontWeight:900,fontSize:13}}>
                        TOTAL — {fiches.length} fichè
                      </td>
                      <td style={{padding:'11px 12px',textAlign:'right',
                        color:'#f87171',fontWeight:900,fontSize:14}}>
                        {fmt(totalMise)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* PAGINATION */}
            {totalPages>1 && (
              <div className="no-print" style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'12px 16px',borderTop:'1px solid #f0f0f0'}}>
                <span style={{fontSize:12,color:'#888'}}>
                  {page*PER+1}–{Math.min((page+1)*PER,fiches.length)} nan {fiches.length}
                </span>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                    style={{padding:'5px 14px',border:'1px solid #ddd',borderRadius:6,
                      background:'white',cursor:page===0?'default':'pointer',
                      color:page===0?'#ccc':'#333',fontWeight:700}}>← Anvan</button>
                  <span style={{padding:'5px 14px',background:'#dc2626',color:'white',
                    borderRadius:6,fontWeight:700}}>{page+1}/{totalPages}</span>
                  <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                    style={{padding:'5px 14px',border:'1px solid #ddd',borderRadius:6,
                      background:'white',cursor:page>=totalPages-1?'default':'pointer',
                      color:page>=totalPages-1?'#ccc':'#333',fontWeight:700}}>Suiv →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
