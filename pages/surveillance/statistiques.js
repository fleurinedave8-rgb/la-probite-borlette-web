import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES = ['TOUT','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir','New-york matin','New-york soir'];

export default function Statistiques() {
  const today = new Date().toISOString().split('T')[0];
  const [tab, setTab]       = useState('general');
  const [tirage, setTirage] = useState('TOUT');
  const [date, setDate]     = useState(today);
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(0);
  const PER_PAGE = 10;

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/statistiques', { params: { tirage, date, tab } });
      setData(Array.isArray(r.data) ? r.data : []);
    } catch { setData([]); }
    finally { setLoading(false); }
  };

  const filtered = data.filter(row =>
    !search || Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const handleCopy = () => {
    const text = filtered.map(r => `${r.type}\t${r.boule}\t${r.quantite}\t${r.montant}`).join('\n');
    navigator.clipboard?.writeText(text);
    alert('Copié !');
  };

  const handleExcel = () => {
    const rows = [['Type','Boule','Quantité fois','Montant Total'], ...filtered.map(r => [r.type, r.boule, r.quantite, r.montant])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'statistiques.csv'; a.click();
  };

  const handlePDF = () => window.print();
  const handlePrint = () => window.print();

  const TABS = [
    { key:'general',    label:'General',       color:'#1a73e8' },
    { key:'agent',      label:'Par agent',     color:'#16a34a' },
    { key:'succursal',  label:'Par succursal', color:'#f59e0b' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15, color:'#000' }}>LA-PROBITE-BORLETTE</span>
        </div>

        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin:'0 0 16px', fontWeight:700, fontSize:18 }}>Statistique</h2>

          {/* TABS */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ background: tab===t.key ? t.color : 'white', color: tab===t.key ? 'white' : t.color, border:`1px solid ${t.color}`, borderRadius:4, padding:'5px 14px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* FILTRES */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>Tirage</label>
              <div style={{ display:'flex', alignItems:'center', border:'1px solid #ccc', borderRadius:4, padding:'8px 12px' }}>
                <select value={tirage} onChange={e => setTirage(e.target.value)}
                  style={{ flex:1, border:'none', outline:'none', fontSize:14 }}>
                  {TIRAGES.map(t => <option key={t}>{t}</option>)}
                </select>
                <span style={{ color:'#16a34a', fontWeight:900, fontSize:16 }}>✓</span>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>Date</label>
              <div style={{ display:'flex', alignItems:'center', border:'1px solid #ccc', borderRadius:4, padding:'8px 12px' }}>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ flex:1, border:'none', outline:'none', fontSize:14 }} />
                <span style={{ color:'#16a34a', fontWeight:900, fontSize:16 }}>✓</span>
              </div>
            </div>
          </div>

          {/* VALIDER */}
          <button onClick={load} disabled={loading}
            style={{ width:'100%', padding:'13px', background:'#1a73e8', color:'white', border:'none', borderRadius:4, fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:20 }}>
            {loading ? 'Chargement...' : 'Valider'}
          </button>

          <hr style={{ border:'none', borderTop:'1px solid #eee', marginBottom:16 }} />

          {/* TITRE RÉSULTAT */}
          <div style={{ marginBottom:12 }}>
            <span>Tirage : <strong>{tirage}</strong></span>
          </div>

          {/* BOUTONS EXPORT */}
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {[['COPIER', handleCopy, '#6c757d'],['EXCEL', handleExcel, '#6c757d'],['PDF', handlePDF, '#6c757d'],['IMPRIMER', handlePrint, '#6c757d']].map(([label, fn, color]) => (
              <button key={label} onClick={fn}
                style={{ background:'white', border:'1px solid #ccc', borderRadius:3, padding:'6px 14px', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          {/* SEARCH */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <label style={{ fontWeight:700, fontSize:13 }}>Search:</label>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              style={{ padding:'6px 10px', border:'1px solid #ccc', borderRadius:4, fontSize:13, width:200 }} />
          </div>

          {/* TABLE */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  {['Type','Boule','Quantité fois','Montant Total'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6', borderRight:'1px solid #dee2e6' }}>
                      {h} <span style={{ color:'#aaa', fontSize:10 }}>⇅</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={4} style={{ padding:'20px', textAlign:'center', color:'#666', fontStyle:'italic' }}>No data available in table</td></tr>
                  : paginated.map((row, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #dee2e6', background: i%2===0 ? 'white' : '#f8f9fa' }}>
                      <td style={{ padding:'10px 14px', borderRight:'1px solid #dee2e6' }}>{row.type}</td>
                      <td style={{ padding:'10px 14px', borderRight:'1px solid #dee2e6', fontWeight:700 }}>{row.boule}</td>
                      <td style={{ padding:'10px 14px', borderRight:'1px solid #dee2e6', textAlign:'center' }}>{row.quantite}</td>
                      <td style={{ padding:'10px 14px', fontWeight:700, color:'#16a34a' }}>{row.montant} HTG</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, color:'#666', fontSize:13 }}>
            <span>Showing {filtered.length === 0 ? 0 : page*PER_PAGE+1} to {Math.min((page+1)*PER_PAGE, filtered.length)} of {filtered.length} entries</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
                style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:3, background:'white', cursor: page===0 ? 'default' : 'pointer', color: page===0 ? '#aaa' : '#333' }}>
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1}
                style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:3, background:'white', cursor: page>=totalPages-1 ? 'default' : 'pointer', color: page>=totalPages-1 ? '#aaa' : '#333' }}>
                Next
              </button>
            </div>
          </div>

          {/* IMPRIMER BAS */}
          <div style={{ textAlign:'center', marginTop:16 }}>
            <button onClick={handlePrint}
              style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:4, padding:'11px 40px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
              Imprimer
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
