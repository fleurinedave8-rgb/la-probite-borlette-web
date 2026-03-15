import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function DemmandeElimination() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(0);
  const PER_PAGE = 10;

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/eliminer');
      setData(Array.isArray(r.data) ? r.data : []);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  const handleApprouver = async (id) => {
    try { await api.put('/api/fiches/approuver/'+id); load(); } catch {}
  };
  const handleRefuser = async (id) => {
    try { await api.put('/api/fiches/refuser/'+id); load(); } catch {}
  };

  const filtered = data.filter(r => !search ||
    Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())));
  const paginated = filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const totalPages = Math.ceil(filtered.length/PER_PAGE);

  const handleCopy  = () => { navigator.clipboard?.writeText(filtered.map(r=>`${r.date}\t${r.heure}\t${r.tirage}\t${r.ticket}\t${r.vendeur}`).join('\n')); alert('Copié!'); };
  const handleExcel = () => {
    const csv=[['Date','Heure','Tirage','#ticket','Vendeur'],...filtered.map(r=>[r.date,r.heure,r.tirage,r.ticket,r.vendeur])].map(r=>r.join(',')).join('\n');
    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='demandes.csv'; a.click();
  };

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE</span>
        </div>
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2 style={{ margin:0, fontWeight:700 }}>Demmande élimination</h2>
            <button onClick={load} disabled={loading} style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:4, padding:'8px 18px', fontWeight:700, cursor:'pointer' }}>
              {loading?'...':'🔄 Actualiser'}
            </button>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {[['COPIER',handleCopy],['EXCEL',handleExcel],['PDF',()=>window.print()],['IMPRIMER',()=>window.print()]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{ background:'white', border:'1px solid #ccc', borderRadius:3, padding:'6px 14px', fontWeight:700, fontSize:13, cursor:'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <label style={{ fontWeight:700, fontSize:13 }}>Search:</label>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{ padding:'6px 10px', border:'1px solid #ccc', borderRadius:4, fontSize:13, width:200 }} />
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr style={{ background:'#f8f9fa' }}>
                {['Date','Heure','Tirage','#Ticket','Vendeur','Action'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {paginated.length===0
                  ? <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'#666', fontStyle:'italic' }}>No data available in table</td></tr>
                  : paginated.map((r,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                      <td style={{ padding:'10px 14px' }}>{r.date}</td>
                      <td style={{ padding:'10px 14px' }}>{r.heure}</td>
                      <td style={{ padding:'10px 14px' }}>{r.tirage}</td>
                      <td style={{ padding:'10px 14px', color:'#f59e0b', fontWeight:700 }}>{r.ticket}</td>
                      <td style={{ padding:'10px 14px' }}>{r.vendeur}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>handleApprouver(r.id)} style={{ background:'#16a34a', color:'white', border:'none', borderRadius:4, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>✓ Approuver</button>
                          <button onClick={()=>handleRefuser(r.id)} style={{ background:'#dc2626', color:'white', border:'none', borderRadius:4, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>✗ Refuser</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, color:'#666', fontSize:13 }}>
            <span>Showing {filtered.length===0?0:page*PER_PAGE+1} to {Math.min((page+1)*PER_PAGE,filtered.length)} of {filtered.length} entries</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:3, background:'white', cursor:page===0?'default':'pointer', color:page===0?'#aaa':'#333' }}>Previous</button>
              <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:3, background:'white', cursor:page>=totalPages-1?'default':'pointer', color:page>=totalPages-1?'#aaa':'#333' }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
