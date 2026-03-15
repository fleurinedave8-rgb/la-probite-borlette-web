import { useState, useRef, useCallback, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import useRealtime from '../../hooks/useRealtime';

const fmt  = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtN = n => Number(n||0).toLocaleString('fr-HT');
const today = () => new Date().toISOString().split('T')[0];

export default function Journalier() {
  const [debut, setDebut] = useState(today());
  const [fin,   setFin]   = useState(today());
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const printRef  = useRef();
  const [liveCount, setLiveCount]   = useState(0);
  const [autoLoad,  setAutoLoad]    = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/journalier', { params:{debut,fin} });
      setData(r.data);
    } catch { setData(null); }
    setLoading(false);
  }, [debut, fin]);

  // ── REYÈL-TAN ──
  useEffect(() => { load(); }, []);
  const { wsLive } = useRealtime({
    onFiche: () => { setLiveCount(c=>c+1); if(autoLoad) load(); },
    onResultat: () => { if(autoLoad) load(); },
    autoReload: autoLoad ? load : null,
    reloadInterval: 60000,
  });

  const agents = (data?.agents||[]).filter(a =>
    !search || [a.posId,a.agent,String(a.tfiche),a.vente]
      .some(v => String(v||'').toLowerCase().includes(search.toLowerCase()))
  );

  const handlePrint = () => window.print();

  const handleCSV = () => {
    const rows = [
      ['No','POS ID','Agent','T.Fich','Vant','A Paye','%Agent','P/P Sans','%Sup','Bilan Final'],
      ...agents.map(a=>[a.no,a.posId,a.agent,a.tfiche,a.vente,a.apaye,a.pctAgent,a.ppSans,a.pctSup,a.bFinal])
    ];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const el = document.createElement('a');
    el.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    el.download = `journalier-${debut}-${fin}.csv`;
    el.click();
  };

  const thStyle = {
    padding:'10px 12px', fontWeight:800, fontSize:11,
    color:'white', whiteSpace:'nowrap', textAlign:'left',
    borderRight:'1px solid rgba(255,255,255,0.15)',
  };
  const tdStyle = (right=false, bold=false, color='inherit') => ({
    padding:'9px 12px', fontSize:12, borderBottom:'1px solid #f0f0f0',
    textAlign: right?'right':'left', fontWeight: bold?800:500, color,
    whiteSpace:'nowrap',
  });

  return (
    <Layout>
      {/* PRINT STYLES */}
      <style>{`
        @media print {
          nav, button, input, select, .no-print { display:none!important; }
          body { font-size:11px; }
          .print-full { max-width:100%!important; }
        }
      `}</style>

      <div className="print-full" style={{maxWidth:1200,margin:'0 auto',padding:'0 8px'}}>

        {/* BANNIÈRE */}
        <div style={{background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12,padding:'14px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#f59e0b',fontWeight:900,fontSize:18,letterSpacing:1}}>
              📊 RAPPORT JOURNALIER
            </div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:12,marginTop:2}}>
              LA-PROBITE-BORLETTE
            </div>
          </div>
          {data && (
            <div style={{textAlign:'right'}}>
              <div style={{color:'white',fontSize:11}}>Peryòd: {data.debut} → {data.fin}</div>
              <div style={{color:'#f59e0b',fontWeight:900,fontSize:15,marginTop:2}}>
                {data.qtyPos} POS aktif
              </div>
            </div>
          )}
        </div>

        {/* FILTRES */}
        <div className="no-print" style={{background:'white',borderRadius:12,padding:16,
          marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
          display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          {[['📅 Debut',debut,setDebut],['📅 Fin',fin,setFin]].map(([l,v,s])=>(
            <div key={l} style={{flex:1,minWidth:140}}>
              <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:5,color:'#555'}}>{l}</label>
              <input type="date" value={v} onChange={e=>s(e.target.value)}
                style={{width:'100%',padding:'10px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
            </div>
          ))}
          <div style={{flex:1,minWidth:140}}>
            <label style={{display:'block',fontWeight:700,fontSize:11,marginBottom:5,color:'#555'}}>🔍 Rechèch</label>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="POS, ajan..." 
              style={{width:'100%',padding:'10px',border:'1.5px solid #ddd',
                borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
          </div>
          <button onClick={()=>setAutoLoad(v=>!v)}
                style={{ background: autoLoad?'#16a34a':'#374151', color:'white',
                  border:'none', borderRadius:8, padding:'8px 12px',
                  fontWeight:700, fontSize:12, cursor:'pointer', marginRight:6 }}>
                {autoLoad ? '⏸ Poz' : '▶ Otomatik'}
              </button>
              <button onClick={load} disabled={loading}
            style={{padding:'10px 28px',background:loading?'#ccc':'#1a73e8',color:'white',
              border:'none',borderRadius:8,fontWeight:800,fontSize:14,cursor:loading?'default':'pointer',
              height:42,alignSelf:'flex-end'}}>
            {loading?'⏳...':'🔍 Chèche'}
          </button>
          {data && <>
            <button onClick={handleCSV}
              style={{padding:'10px 16px',background:'#16a34a',color:'white',border:'none',
                borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',height:42,alignSelf:'flex-end'}}>
              📥 CSV
            </button>
            <button onClick={handlePrint}
              style={{padding:'10px 16px',background:'#7c3aed',color:'white',border:'none',
                borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',height:42,alignSelf:'flex-end'}}>
              🖨️ Enprime
            </button>
          </>}
        </div>

        {/* STATS KART */}
        {data && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
            {[
              {icon:'🖥️',label:'POS Aktif',   val:data.qtyPos,          color:'#1a73e8',bg:'#eff6ff'},
              {icon:'🎫',label:'Total Fichè', val:fmtN(data.recap?.tfiche),color:'#7c3aed',bg:'#f5f3ff'},
              {icon:'💰',label:'Total Vant',  val:`${fmt(data.recap?.vente)} G`,color:'#16a34a',bg:'#f0fdf4'},
              {icon:'✅',label:'Bilan Final', val:`${fmt(data.recap?.balAvec)} G`,color:'#0891b2',bg:'#ecfeff'},
            ].map(c=>(
              <div key={c.label} style={{background:c.bg,borderRadius:12,padding:'14px 16px',
                borderLeft:`4px solid ${c.color}`}}>
                <div style={{fontSize:22,marginBottom:4}}>{c.icon}</div>
                <div style={{fontWeight:900,fontSize:18,color:c.color}}>{c.val}</div>
                <div style={{fontSize:11,color:'#666',fontWeight:700}}>{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ══════ TABLE AJAN ══════ */}
        {data && (
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden',marginBottom:14}}>
            <div style={{background:'linear-gradient(90deg,#1a73e8,#1557b0)',padding:'12px 16px',
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'white',fontWeight:900,fontSize:14}}>👤 Ajan / POS</span>
              <span style={{color:'rgba(255,255,255,0.8)',fontSize:12}}>{agents.length} ajan</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#1a73e8'}}>
                    {['No','POS ID','Agent','T.Fich','Vant (G)','A Paye (G)',
                      '%Agent','P/P Sans Agent','%Sup','Bilan Final'].map(h=>(
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agents.length===0
                    ? <tr><td colSpan={10} style={{padding:24,textAlign:'center',color:'#888',fontStyle:'italic'}}>
                        Pa gen done pou peryòd sa
                      </td></tr>
                    : agents.map((a,i)=>(
                      <tr key={i} style={{background:i%2===0?'white':'#f9fafb',
                        transition:'background 0.15s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#eff6ff'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'white':'#f9fafb'}>
                        <td style={tdStyle(false,true,'#1a73e8')}>{a.no}</td>
                        <td style={tdStyle()}><span style={{fontFamily:'monospace',fontWeight:700,
                          color:'#7c3aed',fontSize:11}}>{a.posId}</span></td>
                        <td style={tdStyle(false,true)}>{a.agent}</td>
                        <td style={tdStyle(true,false,'#555')}>{fmtN(a.tfiche)}</td>
                        <td style={tdStyle(true,true,'#16a34a')}>{fmt(a.vente)}</td>
                        <td style={tdStyle(true,false,'#0891b2')}>{fmt(a.apaye)}</td>
                        <td style={tdStyle(true,false,'#f59e0b')}>{fmt(a.pctAgent)}</td>
                        <td style={tdStyle(true,true,'#1a73e8')}>{fmt(a.ppSans)}</td>
                        <td style={tdStyle(true,false,'#888')}>{a.pctSup}%</td>
                        <td style={tdStyle(true,true,parseFloat(a.bFinal)>=0?'#16a34a':'#dc2626')}>
                          {fmt(a.bFinal)}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
                {agents.length>0 && (
                  <tfoot>
                    <tr style={{background:'#1e293b'}}>
                      <td colSpan={3} style={{padding:'10px 12px',color:'white',fontWeight:900,fontSize:12}}>
                        TOTAL JENERAL
                      </td>
                      <td style={{padding:'10px 12px',color:'#f59e0b',fontWeight:900,textAlign:'right',fontSize:12}}>
                        {fmtN(data.recap?.tfiche)}
                      </td>
                      <td style={{padding:'10px 12px',color:'#4ade80',fontWeight:900,textAlign:'right',fontSize:12}}>
                        {fmt(data.recap?.vente)}
                      </td>
                      <td style={{padding:'10px 12px',color:'#60a5fa',fontWeight:900,textAlign:'right',fontSize:12}}>
                        {fmt(data.recap?.apaye)}
                      </td>
                      <td style={{padding:'10px 12px',color:'#fbbf24',fontWeight:900,textAlign:'right',fontSize:12}}>
                        {fmt(data.recap?.pctAgent)}
                      </td>
                      <td style={{padding:'10px 12px',color:'#34d399',fontWeight:900,textAlign:'right',fontSize:12}}>
                        {fmt(data.recap?.balSans)}
                      </td>
                      <td style={{padding:'10px 12px',color:'#9ca3af',fontWeight:900,textAlign:'right',fontSize:12}}>
                        {data.recap?.pctSup}%
                      </td>
                      <td style={{padding:'10px 12px',color:'#a78bfa',fontWeight:900,textAlign:'right',fontSize:12}}>
                        {fmt(data.recap?.balAvec)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ══════ TABLE SUPERVISEUR ══════ */}
        {data && (data.superviseurs||[]).length>0 && (
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden',marginBottom:14}}>
            <div style={{background:'linear-gradient(90deg,#7c3aed,#5b21b6)',padding:'12px 16px'}}>
              <span style={{color:'white',fontWeight:900,fontSize:14}}>👑 Superviseur / Admin</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#7c3aed'}}>
                    {['Superviseur','Total Vant','A Paye','Pousantaj (%)','Balans'].map(h=>(
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.superviseurs.map((s,i)=>(
                    <tr key={i} style={{background:i%2===0?'white':'#faf5ff'}}>
                      <td style={tdStyle(false,true)}>{s.superviseur}</td>
                      <td style={tdStyle(true,true,'#16a34a')}>{fmt(s.totalVentes)}</td>
                      <td style={tdStyle(true,false,'#0891b2')}>{fmt(s.apaye)}</td>
                      <td style={tdStyle(true,false,'#f59e0b')}>{s.pourcentage}%</td>
                      <td style={tdStyle(true,true,'#7c3aed')}>{fmt(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════ RECAP FINAL ══════ */}
        {data?.recap && (
          <div style={{background:'linear-gradient(135deg,#1e293b,#0f172a)',
            borderRadius:12,padding:'18px 20px',marginBottom:14}}>
            <div style={{color:'#f59e0b',fontWeight:900,fontSize:14,marginBottom:14}}>
              📋 RÉCAPITULATIF FINAL
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    {['T.Fich','Vant','A Paye','%Agent','Bal. Sans %Ag',
                      'Bal. Avèk %Ag','%Sup','Bal. Sans %Sup','Bal. Avèk %Sup'].map(h=>(
                      <th key={h} style={{...thStyle,
                        background:'rgba(255,255,255,0.1)',color:'#94a3b8',fontSize:10}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[
                      [fmtN(data.recap.tfiche),'#f59e0b'],
                      [fmt(data.recap.vente),'#4ade80'],
                      [fmt(data.recap.apaye),'#60a5fa'],
                      [fmt(data.recap.pctAgent),'#fbbf24'],
                      [fmt(data.recap.balSans),'#34d399'],
                      [fmt(data.recap.balAvec),'#a78bfa'],
                      [`${data.recap.pctSup}%`,'#f87171'],
                      [fmt(data.recap.balSupSans),'#38bdf8'],
                      [fmt(data.recap.balSupAvec),'#fb923c'],
                    ].map(([v,c],i)=>(
                      <td key={i} style={{padding:'12px',textAlign:'center',
                        fontWeight:900,fontSize:14,color:c}}>{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
