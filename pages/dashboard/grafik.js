import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const PIE_COLORS = ['#1a73e8','#16a34a','#7c3aed','#ea580c','#dc2626','#0891b2','#f59e0b','#8b5cf6'];

const CARD = ({ label, val, color='#1a73e8', sub='', icon='' }) => (
  <div style={{ background:'#fff', borderRadius:12, padding:'18px 20px', borderLeft:`5px solid ${color}`, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', minWidth:160 }}>
    <div style={{ fontSize:26, marginBottom:4 }}>{icon}</div>
    <div style={{ fontSize:26, fontWeight:900, color }}>{val}</div>
    <div style={{ fontSize:12, color:'#666', marginTop:3 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{sub}</div>}
  </div>
);

export default function DashboardGrafik() {
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin]     = useState(new Date().toISOString().split('T')[0]);
  const [stats,   setStats]       = useState(null);
  const [venteParJou, setVenteParJou] = useState([]);
  const [boulChaud,   setBoulChaud]   = useState([]);
  const [venteParAgent, setVenteParAgent] = useState([]);
  const [gagnants,  setGagnants]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => { charjeData(); }, [dateDebut, dateFin]);

  const charjeData = async () => {
    setLoading(true);
    try {
      const [statsR, statsBoul, journalR, gagnantsR] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get(`/api/rapport/statistiques?date=${dateFin}`),
        api.get(`/api/rapport/journalier?date=${dateFin}`),
        api.get('/api/gagnant/liste').catch(()=>({data:{fiches:[],totalGain:'0'}})),
      ]);

      setStats(statsR.data);

      // Boul ki pi jwe
      const boul = Array.isArray(statsBoul.data)
        ? statsBoul.data.slice(0, 10).map(b => ({ name: `${b.boule}(${b.type})`, montant: b.montant, qty: b.quantite }))
        : [];
      setBoulChaud(boul);

      // Vant pa ajan
      const agents = journalR.data?.agents || [];
      setVenteParAgent(agents.map(a => ({ name: a.agent?.split(' ')[0]||'?', vente: parseFloat(a.vente||0), commission: parseFloat(a.commission||0) })));

      // Gagnants reyèl
      const fGs = gagnantsR.data?.fiches || [];
      setGagnants(fGs.slice(0, 20));

      // Simile vant pa jou (7 dènye jou) — done reyèl si dispo
      await charjeVenteParJou();

    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const charjeVenteParJou = async () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      try {
        const r = await api.get(`/api/rapport/journalier?date=${dateStr}`);
        days.push({
          date: d.toLocaleDateString('fr', { weekday:'short', day:'numeric' }),
          vente: parseFloat(r.data?.vente || 0),
          commission: parseFloat(r.data?.commission || 0),
          fiches: r.data?.fichesVendu || 0,
        });
      } catch { days.push({ date: dateStr, vente: 0, commission: 0, fiches: 0 }); }
    }
    setVenteParJou(days);
  };

  const SECTIONS = [
    { key: 'overview', label: '📊 Vue d\'ensemble' },
    { key: 'ventes',   label: '💰 Vant & Revni' },
    { key: 'boules',   label: '🎰 Boul Kalite' },
    { key: 'agents',   label: '👤 Ajan' },
    { key: 'gagnants', label: '🏆 Gagnant' },
  ];

  const totalVente7j = venteParJou.reduce((s,d)=>s+d.vente, 0);
  const pieData = venteParAgent.length > 0 ? venteParAgent.map(a=>({ name: a.name, value: a.vente })) : [];

  return (
    <Layout>
      <div style={{ padding: '0 0 40px' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1a73e8,#7c3aed)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: '#fff' }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>📊 Dashboard Grafik — Analiz Konplè</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Done reyèl — mete ajou otomatikman</div>
        </div>

        {/* Filtre dat */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: '#555', fontWeight: 600 }}>Peryòd:</label>
          <input type="date" value={dateDebut} onChange={e=>setDateDebut(e.target.value)}
            style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:13 }} />
          <span style={{ color:'#999' }}>→</span>
          <input type="date" value={dateFin} onChange={e=>setDateFin(e.target.value)}
            style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:13 }} />
          <button onClick={charjeData} style={{ padding:'8px 18px', background:'#1a73e8', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13 }}>
            🔄 Aktyalize
          </button>
        </div>

        {loading && <div style={{ textAlign:'center', padding:60, color:'#aaa', fontSize:16 }}>⏳ Chajman grafik...</div>}

        {!loading && stats && (
          <>
            {/* KPI Cards */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
              <CARD icon="🎫" label="Fiches Jodi"    val={stats.fichesJodia||stats.fichesToday||0} color="#1a73e8" sub={`Total: ${stats.fichesTotalMonth||0}`} />
              <CARD icon="💰" label="Vant Jodi (G)"  val={(parseFloat(stats.venteJodia||stats.venteToday||0)).toLocaleString()} color="#16a34a" sub={`7j: ${totalVente7j.toLocaleString()} G`} />
              <CARD icon="👤" label="Ajan Aktif"     val={stats.agentsActif||stats.agents||0} color="#7c3aed" />
              <CARD icon="📱" label="POS Aktif"      val={stats.posActif||0} color="#ea580c" sub={`Total: ${stats.pos||0}`} />
              <CARD icon="🏆" label="Gagnant Jodi"   val={stats.fichesGagnant||gagnants.length||0} color="#dc2626" />
              <CARD icon="📈" label="Profit Estime"  val={`${((totalVente7j)*0.7).toLocaleString()} G`} color="#f59e0b" sub="70% vant mwens gain" />
            </div>

            {/* Navigation Sections */}
            <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
              {SECTIONS.map(s => (
                <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
                  padding:'8px 16px', borderRadius:20, border:'none', cursor:'pointer', fontSize:13,
                  background: activeSection===s.key ? '#1a73e8' : '#f1f5f9',
                  color: activeSection===s.key ? '#fff' : '#555',
                  fontWeight: activeSection===s.key ? 700 : 400,
                }}>{s.label}</button>
              ))}
            </div>

            {/* ── OVERVIEW: Vant 7 Jou ── */}
            {activeSection === 'overview' && (
              <div style={{ display:'grid', gap:20, gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))' }}>
                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#333' }}>📈 Vant 7 Dènye Jou (G)</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={venteParJou}>
                      <defs>
                        <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip formatter={(v)=>[`${v.toLocaleString()} G`]} />
                      <Area type="monotone" dataKey="vente" stroke="#1a73e8" fill="url(#vGrad)" strokeWidth={2} name="Vant" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#333' }}>🎫 Fiches Vann Pa Jou</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={venteParJou}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip />
                      <Bar dataKey="fiches" fill="#7c3aed" radius={[4,4,0,0]} name="Fiches" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── VENTES DETAIL ── */}
            {activeSection === 'ventes' && (
              <div style={{ display:'grid', gap:20 }}>
                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#333' }}>💰 Vant vs Komisyon 7 Jou</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={venteParJou}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize:11 }} />
                      <YAxis tick={{ fontSize:11 }} />
                      <Tooltip formatter={(v)=>[`${v.toLocaleString()} G`]} />
                      <Legend />
                      <Bar dataKey="vente"      fill="#16a34a" radius={[4,4,0,0]} name="Vant Total" />
                      <Bar dataKey="commission" fill="#f59e0b" radius={[4,4,0,0]} name="Komisyon Ajan" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#333' }}>📊 Rezime Finansye 7 Jou</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                    {[
                      { l:'Vant Total', v:`${totalVente7j.toLocaleString()} G`, c:'#16a34a' },
                      { l:'Komisyon Total', v:`${venteParJou.reduce((s,d)=>s+d.commission,0).toLocaleString()} G`, c:'#f59e0b' },
                      { l:'Nèt Estime (70%)', v:`${(totalVente7j*0.7).toLocaleString()} G`, c:'#1a73e8' },
                    ].map(x => (
                      <div key={x.l} style={{ background:'#f8fafc', borderRadius:10, padding:16, borderLeft:`4px solid ${x.c}` }}>
                        <div style={{ fontSize:20, fontWeight:800, color:x.c }}>{x.v}</div>
                        <div style={{ fontSize:12, color:'#888', marginTop:4 }}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── BOULES ── */}
            {activeSection === 'boules' && (
              <div style={{ display:'grid', gap:20, gridTemplateColumns:'repeat(auto-fit,minmax(380px,1fr))' }}>
                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#333' }}>🔥 10 Boul Pi Jwe Jodi (Montant)</div>
                  {boulChaud.length === 0
                    ? <div style={{ color:'#aaa', textAlign:'center', padding:40 }}>Pa gen done pou jodi</div>
                    : <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={boulChaud} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize:11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize:11 }} width={70} />
                          <Tooltip formatter={v=>[`${v.toLocaleString()} G`]} />
                          <Bar dataKey="montant" fill="#dc2626" radius={[0,4,4,0]} name="Montant" />
                        </BarChart>
                      </ResponsiveContainer>
                  }
                </div>
                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#333' }}>🎰 Boul pa Kantite Jwe</div>
                  {boulChaud.length === 0
                    ? <div style={{ color:'#aaa', textAlign:'center', padding:40 }}>Pa gen done pou jodi</div>
                    : <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={boulChaud} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" tick={{ fontSize:11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize:11 }} width={70} />
                          <Tooltip />
                          <Bar dataKey="qty" fill="#7c3aed" radius={[0,4,4,0]} name="Fwa Jwe" />
                        </BarChart>
                      </ResponsiveContainer>
                  }
                </div>
              </div>
            )}

            {/* ── AGENTS ── */}
            {activeSection === 'agents' && (
              <div style={{ display:'grid', gap:20, gridTemplateColumns:'repeat(auto-fit,minmax(380px,1fr))' }}>
                {pieData.length > 0 && (
                  <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                    <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#333' }}>🥧 Distribisyon Vant Pa Ajan</div>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v=>[`${v.toLocaleString()} G`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:'#333' }}>📋 Klasman Ajan Jodi</div>
                  {venteParAgent.length === 0
                    ? <div style={{ color:'#aaa', textAlign:'center', padding:40 }}>Pa gen done ajan jodi</div>
                    : venteParAgent.sort((a,b)=>b.vente-a.vente).map((a,i)=>(
                      <div key={a.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #f0f0f0' }}>
                        <span style={{ fontWeight:800, color:i===0?'#f59e0b':i===1?'#94a3b8':'#cd7c2f', fontSize:16, minWidth:24 }}>#{i+1}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:14 }}>{a.name}</div>
                          <div style={{ width:'100%', height:6, background:'#f0f0f0', borderRadius:3, marginTop:4 }}>
                            <div style={{ width:`${venteParAgent[0]?.vente ? (a.vente/venteParAgent[0].vente*100) : 0}%`, height:'100%', background:'#1a73e8', borderRadius:3 }} />
                          </div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:700, color:'#16a34a' }}>{a.vente.toLocaleString()} G</div>
                          <div style={{ fontSize:11, color:'#888' }}>Kom: {a.commission.toLocaleString()} G</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* ── GAGNANTS ── */}
            {activeSection === 'gagnants' && (
              <div>
                <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                  {[
                    { l:'Total Gagnant', v:gagnants.length, c:'#dc2626' },
                    { l:'Total Gain (G)', v:gagnants.reduce((s,f)=>s+(f.gainTotal||0),0).toLocaleString(), c:'#7c3aed' },
                    { l:'Fich Peye', v:gagnants.filter(f=>f.peye).length, c:'#16a34a' },
                    { l:'Fich Pa Peye', v:gagnants.filter(f=>!f.peye).length, c:'#ea580c' },
                  ].map(x=>(
                    <div key={x.l} style={{ background:'#fff', borderRadius:10, padding:'14px 18px', borderLeft:`4px solid ${x.c}`, boxShadow:'0 1px 6px rgba(0,0,0,0.07)', minWidth:160 }}>
                      <div style={{ fontSize:22, fontWeight:800, color:x.c }}>{x.v}</div>
                      <div style={{ fontSize:12, color:'#888' }}>{x.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'#f8fafc' }}>
                      {['Ticket','Ajan','Tiraj','Gain (G)','Lot1','Lot2','Lot3','Peye','Dat'].map(h=>(
                        <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:11, color:'#888', fontWeight:700, textTransform:'uppercase' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {gagnants.length === 0
                        ? <tr><td colSpan={9} style={{ textAlign:'center', padding:40, color:'#aaa' }}>Pa gen fich gagnant</td></tr>
                        : gagnants.map((f,i)=>(
                          <tr key={f._id||i} style={{ borderTop:'1px solid #f0f0f0', background:i%2===0?'#fff':'#fafbff' }}>
                            <td style={{ padding:'10px 14px', fontWeight:700, color:'#1a73e8', fontSize:13 }}>{f.ticket}</td>
                            <td style={{ padding:'10px 14px', fontSize:13 }}>{f.agent}</td>
                            <td style={{ padding:'10px 14px', fontSize:12, color:'#555' }}>{f.tirage}</td>
                            <td style={{ padding:'10px 14px', fontWeight:800, color:'#7c3aed', fontSize:14 }}>{(f.gainTotal||0).toLocaleString()}</td>
                            <td style={{ padding:'10px 14px' }}><span style={{ background:'#16a34a', color:'#fff', padding:'2px 8px', borderRadius:12, fontSize:12, fontWeight:700 }}>{f.lot1}</span></td>
                            <td style={{ padding:'10px 14px', fontSize:12 }}>{f.lot2||'—'}</td>
                            <td style={{ padding:'10px 14px', fontSize:12 }}>{f.lot3||'—'}</td>
                            <td style={{ padding:'10px 14px' }}>
                              <span style={{ padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:700,
                                background:f.peye?'#dcfce7':'#fee2e2', color:f.peye?'#16a34a':'#dc2626' }}>
                                {f.peye?'✅ Wi':'⏳ Non'}
                              </span>
                            </td>
                            <td style={{ padding:'10px 14px', fontSize:11, color:'#999' }}>{f.dateGagnant ? new Date(f.dateGagnant).toLocaleDateString('fr') : '—'}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
