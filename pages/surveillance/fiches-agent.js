import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function FichesAgent() {
  const [agents,    setAgents]    = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [fiches,    setFiches]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [loadFich,  setLoadFich]  = useState(false);
  const [search,    setSearch]    = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin,   setDateFin]   = useState('');
  const [page,      setPage]      = useState(0);
  const PER_PAGE = 10;

  useEffect(() => { loadAgents(); }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/agents');
      setAgents(Array.isArray(r.data) ? r.data : []);
    } catch { setAgents([]); }
    setLoading(false);
  };

  const loadFiches = async (agent) => {
    setSelected(agent);
    setLoadFich(true);
    setFiches([]);
    try {
      const params = new URLSearchParams({ agentId: agent._id });
      if (dateDebut) params.append('debut', dateDebut);
      if (dateFin)   params.append('fin', dateFin);
      const r = await api.get(`/api/admin/fiches?${params}`);
      setFiches(Array.isArray(r.data) ? r.data : []);
    } catch { setFiches([]); }
    setLoadFich(false);
  };

  const filteredAgents = agents.filter(a => !search ||
    [a.nom, a.prenom, a.username].some(v => String(v||'').toLowerCase().includes(search.toLowerCase())));

  const paginated = filteredAgents.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filteredAgents.length / PER_PAGE);

  const totalFiches = fiches.length;
  const totalMise   = fiches.reduce((s, f) => s + (f.total || 0), 0);
  const totalGagne  = fiches.filter(f => f.gagnant).length;

  const handleExport = () => {
    const rows = [
      ['Ticket','Tiraj','Total','Dat','Statut'],
      ...fiches.map(f => [f.ticket, f.tirage, f.total, new Date(f.date||f.createdAt).toLocaleDateString('fr'), f.statut||'actif'])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const el = document.createElement('a');
    el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    el.download = `fiches-${selected?.username}-${Date.now()}.csv`;
    el.click();
  };

  return (
    <Layout>
      <div style={{ display:'grid', gridTemplateColumns: selected ? '300px 1fr' : '1fr', gap:16 }}>

        {/* ── KOLÒN AJAN YO ── */}
        <div className="card" style={{ height:'fit-content' }}>
          <h3 style={{ margin:'0 0 14px', fontWeight:800, fontSize:16 }}>👤 Ajan yo</h3>

          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="🔍 Chèche ajan..."
            style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, marginBottom:12, boxSizing:'border-box' }} />

          {loading ? (
            <div style={{ textAlign:'center', padding:20, color:'#888' }}>⏳ Chajman...</div>
          ) : (
            <>
              {paginated.map(a => (
                <div key={a._id} onClick={() => loadFiches(a)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 12px', borderRadius:8, marginBottom:6, cursor:'pointer',
                    background: selected?._id === a._id ? '#eff6ff' : '#f8f9fa',
                    border: selected?._id === a._id ? '2px solid #1a73e8' : '1px solid #e5e7eb',
                  }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:13 }}>{a.prenom} {a.nom}</div>
                    <div style={{ fontSize:11, color:'#888', fontFamily:'monospace' }}>{a.username}</div>
                  </div>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:700,
                    background: a.actif ? '#dcfce7' : '#fee2e2',
                    color: a.actif ? '#16a34a' : '#dc2626',
                  }}>{a.actif ? 'Aktif' : 'Inaktif'}</span>
                </div>
              ))}

              {/* Pagination ajan */}
              {totalPages > 1 && (
                <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:10 }}>
                  <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
                    style={{ padding:'4px 10px', border:'1px solid #ddd', borderRadius:4, cursor: page===0 ? 'default' : 'pointer', background:'white', color: page===0 ? '#aaa' : '#333' }}>←</button>
                  <span style={{ fontSize:12, alignSelf:'center' }}>{page+1}/{totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page>=totalPages-1}
                    style={{ padding:'4px 10px', border:'1px solid #ddd', borderRadius:4, cursor: page>=totalPages-1 ? 'default' : 'pointer', background:'white', color: page>=totalPages-1 ? '#aaa' : '#333' }}>→</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── KOLÒN FICHES ── */}
        {selected && (
          <div>
            {/* Header ajan seleksyone */}
            <div className="card" style={{ marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                <div>
                  <h3 style={{ margin:0, fontWeight:900, fontSize:16 }}>
                    📋 Fiches — {selected.prenom} {selected.nom}
                  </h3>
                  <span style={{ fontSize:12, color:'#888' }}>@{selected.username}</span>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ background:'#f3f4f6', border:'none', borderRadius:6, padding:'7px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
                  ✕ Fèmen
                </button>
              </div>

              {/* Filtè dat */}
              <div style={{ display:'flex', gap:10, marginTop:12, flexWrap:'wrap', alignItems:'flex-end' }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, marginBottom:3, color:'#555' }}>Dat Debi</label>
                  <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                    style={{ padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, marginBottom:3, color:'#555' }}>Dat Fen</label>
                  <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                    style={{ padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }} />
                </div>
                <button onClick={() => loadFiches(selected)}
                  style={{ padding:'9px 18px', background:'#1a73e8', color:'white', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>
                  🔍 Filtre
                </button>
                <button onClick={handleExport} disabled={fiches.length === 0}
                  style={{ padding:'9px 18px', background:'#16a34a', color:'white', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', opacity: fiches.length===0 ? 0.5 : 1 }}>
                  📥 CSV
                </button>
              </div>

              {/* Stats */}
              <div style={{ display:'flex', gap:10, marginTop:12, flexWrap:'wrap' }}>
                {[
                  ['Total Fiches', totalFiches, '#1a73e8'],
                  ['Total Mise', `${totalMise} HTG`, '#16a34a'],
                  ['Fiches Gagnant', totalGagne, '#f59e0b'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background:'#f8f9fa', borderRadius:8, padding:'8px 16px', minWidth:100 }}>
                    <div style={{ fontSize:11, color:'#888', fontWeight:600 }}>{l}</div>
                    <div style={{ fontSize:18, fontWeight:900, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table fiches */}
            <div className="card">
              {loadFich ? (
                <div style={{ textAlign:'center', padding:40, color:'#888' }}>⏳ Chajman fiches...</div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>{['Ticket','Tiraj','Boules','Total','Dat','Statut'].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {fiches.length === 0 ? (
                        <tr><td colSpan={6} style={{ padding:30, textAlign:'center', color:'#888' }}>
                          Pa gen fich pou ajan sa a.
                        </td></tr>
                      ) : fiches.slice(0,100).map(f => (
                        <tr key={f._id}>
                          <td style={{ fontFamily:'monospace', fontWeight:700, color:'#1a73e8' }}>#{f.ticket}</td>
                          <td>{f.tirage || '—'}</td>
                          <td style={{ fontSize:12 }}>
                            {(f.rows || []).slice(0,3).map((r,i) => (
                              <span key={i} style={{ background:'#f0f0f0', borderRadius:4, padding:'1px 6px', marginRight:3, fontSize:11, fontWeight:700 }}>
                                {r.boule}
                              </span>
                            ))}
                            {(f.rows||[]).length > 3 && <span style={{ fontSize:11, color:'#888' }}>+{f.rows.length-3}</span>}
                          </td>
                          <td style={{ fontWeight:800, color:'#16a34a' }}>{f.total} HTG</td>
                          <td style={{ fontSize:12 }}>{new Date(f.date||f.createdAt).toLocaleDateString('fr')}</td>
                          <td>
                            <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700,
                              background: f.elimine ? '#fee2e2' : f.gagnant ? '#dcfce7' : '#f0f4ff',
                              color: f.elimine ? '#dc2626' : f.gagnant ? '#16a34a' : '#1a73e8',
                            }}>
                              {f.elimine ? '🚫 Elimine' : f.gagnant ? '🏆 Gagnant' : '✅ Aktif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message si pa gen ajan seleksyone */}
        {!selected && !loading && (
          <div className="card" style={{ textAlign:'center', padding:60, color:'#888' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👆</div>
            <p style={{ fontSize:15, fontWeight:700 }}>Klike sou yon ajan pou wè fiches li yo.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
