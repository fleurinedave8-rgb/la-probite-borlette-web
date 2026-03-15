import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../utils/api';
import { getUser } from '../../utils/auth';

const TABS = [
  { key: 'stats',    label: '📊 Vue Global',    color: '#1a73e8' },
  { key: 'admins',   label: '👥 Admins',        color: '#16a34a' },
  { key: 'licences', label: '🔑 Lisans',        color: '#7c3aed' },
  { key: 'revenus',  label: '💰 Revni',         color: '#ea580c' },
  { key: 'logs',     label: '📋 Logs Global',   color: '#64748b' },
];

export default function SuperAdmin() {
  const router = useRouter();
  const [tab, setTab]             = useState('stats');
  const [stats, setStats]         = useState(null);
  const [admins, setAdmins]       = useState([]);
  const [licences, setLicences]   = useState([]);
  const [revenus, setRevenus]     = useState([]);
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ nom:'', prenom:'', username:'', password:'', telephone:'', email:'', licenceDuree:30 });
  const [licenceModal, setLicenceModal] = useState(null);

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== 'superadmin') { router.push('/'); return; }
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'stats')    { const r = await api.get('/api/superadmin/stats');    setStats(r.data); }
      if (tab === 'admins')   { const r = await api.get('/api/superadmin/admins');   setAdmins(Array.isArray(r.data)?r.data:[]); }
      if (tab === 'licences') { const r = await api.get('/api/superadmin/licences'); setLicences(Array.isArray(r.data)?r.data:[]); }
      if (tab === 'revenus')  { const r = await api.get('/api/superadmin/revenus');  setRevenus(Array.isArray(r.data)?r.data:[]); }
      if (tab === 'logs')     { const r = await api.get('/api/superadmin/logs');     setLogs(Array.isArray(r.data)?r.data:[]); }
    } catch { setMsg('❌ Erè chajman done'); }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.nom || !form.username || !form.password) { setMsg('❌ Remplì tout chan obligatwa'); return; }
    try {
      await api.post('/api/superadmin/admins', form);
      setMsg('✅ Admin kreye avèk siksè'); setShowModal(false);
      setForm({ nom:'', prenom:'', username:'', password:'', telephone:'', email:'', licenceDuree:30 });
      loadData();
    } catch(e) { setMsg('❌ '+(e?.response?.data?.message||e.message)); }
  };

  const handleToggleAdmin = async (id, actif) => {
    try {
      await api.put(`/api/superadmin/admins/${id}`, { actif: !actif });
      setMsg(`✅ Admin ${actif ? 'dezaktive' : 'reaktive'}`); loadData();
    } catch { setMsg('❌ Erè'); }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleRenouvleLicence = async (id, duree) => {
    try {
      await api.post(`/api/superadmin/licence/${id}`, { duree: parseInt(duree), type: 'mensuel' });
      setMsg(`✅ Lisans renouvle pou ${duree} jou`); setLicenceModal(null); loadData();
    } catch { setMsg('❌ Erè renouvèlman'); }
    setTimeout(() => setMsg(''), 4000);
  };

  const BIG = ({ label, val, color='#1a73e8', sub='' }) => (
    <div style={{ background: '#fff', border: `2px solid ${color}`, borderRadius: 12, padding: '20px 24px', textAlign: 'center', minWidth: 140 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#1a73e8)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>🔐 SUPER ADMIN</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>LA-PROBITE-BORLETTE — Kontwòl Total</div>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          ← Retounen
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '16px 20px', background: '#1e293b', borderBottom: '1px solid #334155', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            background: tab === t.key ? t.color : 'transparent',
            color: tab === t.key ? '#fff' : '#94a3b8',
          }}>{t.label}</button>
        ))}
      </div>

      {msg && <div style={{ margin: '12px 20px', padding: '10px 16px', background: msg.startsWith('✅') ? '#14532d' : '#7f1d1d', borderRadius: 8, fontSize: 14 }}>{msg}</div>}

      <div style={{ padding: 20 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>⏳ Chajman...</div>}

        {/* ── VUE GLOBAL ── */}
        {!loading && tab === 'stats' && stats && (
          <div>
            <h2 style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>📊 Statistik Global — Tout Sistèm</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <BIG label="Total Admins"    val={stats.admins}              color="#7c3aed" />
              <BIG label="Total Ajan"      val={stats.agents}              color="#16a34a" />
              <BIG label="POS Aktif"       val={`${stats.posActif}/${stats.pos}`} color="#1a73e8" />
              <BIG label="Fich Jodi"       val={stats.fichesJodia}         color="#ea580c" />
              <BIG label="Vant Jodi (G)"   val={parseFloat(stats.venteJodia).toLocaleString()} color="#ea580c" />
              <BIG label="Vant Total (G)"  val={parseFloat(stats.venteTotal).toLocaleString()} color="#16a34a" sub={`Gain: ${parseFloat(stats.gainTotal||0).toLocaleString()}`} />
              <BIG label="Profit (G)"      val={parseFloat(stats.profit||0).toLocaleString()}  color="#f59e0b" />
              <BIG label="Fiches Gagnant"  val={stats.gagnants}            color="#dc2626" />
            </div>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 20, borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>KONEKSYON RAPID</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[{l:'Admins',t:'admins'},{l:'Lisans',t:'licences'},{l:'Revni',t:'revenus'},{l:'Logs',t:'logs'}].map(x=>(
                  <button key={x.t} onClick={()=>setTab(x.t)} style={{ background:'#334155', color:'#e2e8f0', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13 }}>→ {x.l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ADMINS ── */}
        {!loading && tab === 'admins' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ color: '#e2e8f0', margin: 0 }}>👥 Admins ({admins.length})</h2>
              <button onClick={() => setShowModal(true)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                + Nouvo Admin
              </button>
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))' }}>
              {admins.map(a => {
                const exp = a.licence?.expiration ? new Date(a.licence.expiration) : null;
                const jous = exp ? Math.ceil((exp - Date.now()) / 86400000) : null;
                return (
                  <div key={a._id} style={{ background: '#1e293b', borderRadius: 12, padding: 18, border: `1px solid ${a.actif ? '#334155' : '#7f1d1d'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{a.prenom} {a.nom}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>@{a.username}</div>
                      </div>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, height: 'fit-content', background: a.actif ? '#14532d' : '#7f1d1d', color: a.actif ? '#86efac' : '#fca5a5' }}>
                        {a.actif ? '✅ AKTIF' : '🚫 BLOKE'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                      <div style={{ textAlign: 'center', background: '#0f172a', borderRadius: 8, padding: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>{a.agentCount||0}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>Ajan</div>
                      </div>
                      <div style={{ textAlign: 'center', background: '#0f172a', borderRadius: 8, padding: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>{a.posCount||0}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>POS</div>
                      </div>
                      <div style={{ textAlign: 'center', background: '#0f172a', borderRadius: 8, padding: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{parseFloat(a.vente||0).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>Vant G</div>
                      </div>
                    </div>
                    {jous !== null && (
                      <div style={{ padding: '6px 10px', borderRadius: 8, marginBottom: 10, fontSize: 12,
                        background: jous <= 0 ? '#7f1d1d' : jous <= 7 ? '#78350f' : '#14532d',
                        color: jous <= 0 ? '#fca5a5' : jous <= 7 ? '#fde68a' : '#86efac' }}>
                        🔑 Lisans: {jous <= 0 ? '❌ Ekspire' : `${jous} jou rete`} — {exp?.toLocaleDateString('fr')}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setLicenceModal(a)} style={{ flex: 1, background: '#7c3aed', color: '#fff', border: 'none', padding: '7px 0', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>
                        🔑 Lisans
                      </button>
                      <button onClick={() => handleToggleAdmin(a._id, a.actif)} style={{ flex: 1, background: a.actif ? '#7f1d1d' : '#14532d', color: '#fff', border: 'none', padding: '7px 0', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>
                        {a.actif ? '🚫 Bloke' : '✅ Aktive'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── LICENCES ── */}
        {!loading && tab === 'licences' && (
          <div>
            <h2 style={{ color: '#e2e8f0', marginBottom: 16 }}>🔑 Tout Lisans POS Admins</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
              <thead><tr style={{ background: '#0f172a' }}>
                {['Admin','Username','Statut Lisans','Ekspirasyon','Jou Rete','Aksyon'].map(h=>(
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {licences.map((l, i) => {
                  const jous = l.licence?.jousReste;
                  const expire = l.licence?.expire;
                  const biento = l.licence?.expirantBiento;
                  return (
                    <tr key={l._id} style={{ borderTop: '1px solid #334155', background: i % 2 === 0 ? 'transparent' : '#1a2332' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{l.prenom} {l.nom}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>@{l.username}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: expire ? '#7f1d1d' : biento ? '#78350f' : '#14532d',
                          color: expire ? '#fca5a5' : biento ? '#fde68a' : '#86efac' }}>
                          {expire ? '❌ EKSPIRE' : biento ? '⚠️ BIENTO' : jous !== null ? '✅ VALID' : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>
                        {l.licence?.expiration ? new Date(l.licence.expiration).toLocaleDateString('fr') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: jous <= 0 ? '#f87171' : jous <= 7 ? '#fbbf24' : '#4ade80' }}>
                        {jous !== null ? `${jous} jou` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setLicenceModal(l)} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12 }}>
                          🔄 Renouvle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── REVENUS ── */}
        {!loading && tab === 'revenus' && (
          <div>
            <h2 style={{ color: '#e2e8f0', marginBottom: 16 }}>💰 Revni pa Admin — Mwa Aktyèl</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
                <thead><tr style={{ background: '#0f172a' }}>
                  {['#','Admin','Username','Vant Total','Vant Mwa','Fiches Total','Fiches Mwa'].map(h=>(
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {revenus.map((r, i) => (
                    <tr key={r.adminId} style={{ borderTop: '1px solid #334155', background: i % 2 === 0 ? 'transparent' : '#1a2332' }}>
                      <td style={{ padding: '12px 16px', color: '#f59e0b', fontWeight: 700 }}>#{i+1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.nom}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>@{r.username}</td>
                      <td style={{ padding: '12px 16px', color: '#4ade80', fontWeight: 700 }}>{parseFloat(r.venteTotal).toLocaleString()} G</td>
                      <td style={{ padding: '12px 16px', color: '#60a5fa' }}>{parseFloat(r.venteMwa).toLocaleString()} G</td>
                      <td style={{ padding: '12px 16px' }}>{r.fichesTotal}</td>
                      <td style={{ padding: '12px 16px' }}>{r.fichesMwa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {!loading && tab === 'logs' && (
          <div>
            <h2 style={{ color: '#e2e8f0', marginBottom: 16 }}>📋 Logs Global ({logs.length})</h2>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {logs.slice(0, 200).map((l, i) => (
                <div key={l._id||i} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderBottom: '1px solid #1e293b', fontSize: 13, alignItems: 'center',
                  background: l.action?.includes('Gagnant') ? '#1c2a1c' : l.action?.includes('Lisans') ? '#1a1a2e' : 'transparent' }}>
                  <span style={{ color: '#64748b', minWidth: 70, fontSize: 11 }}>{l.createdAt ? new Date(l.createdAt).toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: '#334155', color: '#94a3b8', minWidth: 60, textAlign: 'center' }}>{l.role||'?'}</span>
                  <span style={{ color: '#cbd5e1', minWidth: 80 }}>@{l.username}</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{l.action}</span>
                  <span style={{ color: '#64748b', flex: 1, fontSize: 11 }}>{l.details ? JSON.stringify(l.details).slice(0,80) : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Nouvo Admin ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: 420, maxWidth: '95vw' }}>
            <h3 style={{ color: '#e2e8f0', marginTop: 0 }}>➕ Kreye Nouvo Admin</h3>
            {['nom','prenom','username','password','telephone','email'].map(f => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{f} {['nom','username','password'].includes(f) ? '*' : ''}</label>
                <input type={f==='password'?'password':'text'} value={form[f]} onChange={e => setForm(prev=>({...prev,[f]:e.target.value}))}
                  style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Lisans (jou)</label>
              <select value={form.licenceDuree} onChange={e=>setForm(p=>({...p,licenceDuree:parseInt(e.target.value)}))}
                style={{ width: '100%', padding: '9px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 14 }}>
                <option value={7}>7 jou (esè)</option>
                <option value={30}>30 jou (1 mwa)</option>
                <option value={90}>90 jou (3 mwa)</option>
                <option value={365}>365 jou (1 an)</option>
                <option value={9999}>Illimité</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCreate} style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', padding: '11px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>✅ Kreye</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#334155', color: '#fff', border: 'none', padding: '11px 0', borderRadius: 8, cursor: 'pointer' }}>Anile</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Renouvle Lisans ── */}
      {licenceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: 340, maxWidth: '95vw' }}>
            <h3 style={{ color: '#e2e8f0', marginTop: 0 }}>🔑 Renouvle Lisans<br/><span style={{ fontSize: 14, color: '#64748b' }}>{licenceModal.prenom} {licenceModal.nom}</span></h3>
            {[7,30,90,180,365,9999].map(d => (
              <button key={d} onClick={() => handleRenouvleLicence(licenceModal._id, d)}
                style={{ display: 'block', width: '100%', marginBottom: 8, padding: '11px 0', background: d===30?'#7c3aed':'#334155', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: d===30?700:400 }}>
                {d===9999 ? '♾️ Illimité' : `${d} jou${d>=365?' (1 an)':d>=90?' (3 mwa)':d>=30?' (1 mwa)':''}`}
              </button>
            ))}
            <button onClick={() => setLicenceModal(null)} style={{ width: '100%', background: 'transparent', color: '#64748b', border: '1px solid #334155', padding: '9px 0', borderRadius: 8, cursor: 'pointer', marginTop: 4 }}>Anile</button>
          </div>
        </div>
      )}
    </div>
  );
}
