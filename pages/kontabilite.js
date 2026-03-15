import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n) => Number(n||0).toLocaleString('fr-HT', { minimumFractionDigits:0 });
const today = () => new Date().toISOString().split('T')[0];
const pad   = n => String(n).padStart(2,'0');
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth()+1)}/${dt.getFullYear()}`;
}

// Koulè pa tip tranzaksyon
const TX_CFG = {
  depot:         { bg:'#dcfce7', col:'#16a34a', icon:'⬆️', lbl:'Depò' },
  retrait:       { bg:'#fee2e2', col:'#dc2626', icon:'⬇️', lbl:'Retrè' },
  prepaye:       { bg:'#eff6ff', col:'#1a73e8', icon:'💳', lbl:'Prepaye' },
  commission:    { bg:'#fef9c3', col:'#854d0e', icon:'🏆', lbl:'Komisyon' },
  paiement_gain: { bg:'#fef3c7', col:'#d97706', icon:'💰', lbl:'Peman Gain' },
  default:       { bg:'#f1f5f9', col:'#475569', icon:'📋', lbl:'Tranzaksyon' },
};
const txCfg = (type) => TX_CFG[type] || TX_CFG.default;

export default function Kontabilite() {
  const [tab,       setTab]      = useState('bilan');    // bilan | agents | transactions
  const [debut,     setDebut]    = useState(today());
  const [fin,       setFin]      = useState(today());
  const [stats,     setStats]    = useState(null);
  const [agents,    setAgents]   = useState([]);
  const [pos,       setPos]      = useState([]);
  const [trans,     setTrans]    = useState([]);
  const [loading,   setLoading]  = useState(false);
  const [selAgent,  setSelAgent] = useState(null);   // modal detay ajan
  const [agentTrans, setAgentTrans] = useState([]);

  // ── Modal nouvo peman ──
  const [showPay,    setShowPay]    = useState(false);
  const [payAgent,   setPayAgent]   = useState('');
  const [payType,    setPayType]    = useState('depot');
  const [payMontant, setPayMontant] = useState('');
  const [payNote,    setPayNote]    = useState('');
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState({ text:'', ok:true });

  const notify = (text, ok=true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text:'', ok:true }), 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, agentsRes, posRes, transRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/agents'),
        api.get('/api/admin/pos'),
        api.get('/api/admin/paiement', { params:{ debut, fin } }),
      ]);
      setStats(statsRes.data);
      setAgents(Array.isArray(agentsRes.data)
        ? agentsRes.data.filter(a => a.role==='agent') : []);
      setPos(Array.isArray(posRes.data) ? posRes.data : []);
      setTrans(Array.isArray(transRes.data) ? transRes.data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // Kalkil bilan
  const totalVente    = parseFloat(stats?.venteJodi||0);
  const totalVenteTot = parseFloat(stats?.venteTotal||0);
  const totalGagne    = parseFloat(stats?.totalGagne||0);
  const commJodi      = parseFloat(stats?.commJodi||0);
  // Benefis = Vant - Gain peye
  const benefisJodi   = totalVente - totalGagne;
  const benefisTotal  = totalVenteTot - totalGagne;

  // Tranzaksyon total pou peryòd la
  const totalDepot   = trans.filter(t=>t.type==='depot').reduce((s,t)=>s+Number(t.montant||0),0);
  const totalRetrait = trans.filter(t=>t.type==='retrait').reduce((s,t)=>s+Number(t.montant||0),0);

  // Pa ajan: vant + komisyon + solde
  const agentData = agents.map(a => {
    const posAgent = pos.find(p =>
      p.agentUsername === a.username || p.agentId === (a.id||a._id));
    const pct = posAgent?.agentPct || a.agentPct || 10;
    const agTrans = trans.filter(t => t.agentId === (a.id||a._id));
    const depotAg = agTrans.filter(t=>t.type==='depot').reduce((s,t)=>s+Number(t.montant||0),0);
    const retrAg  = agTrans.filter(t=>t.type==='retrait').reduce((s,t)=>s+Number(t.montant||0),0);
    return {
      ...a,
      posId:   posAgent?.posId || '—',
      pct,
      balance: Number(a.balance || 0),
      depots:  depotAg,
      retraits: retrAg,
      netAg:   depotAg - retrAg,
    };
  }).sort((a,b) => b.balance - a.balance);

  const openAgentDetail = async (a) => {
    setSelAgent(a);
    try {
      const r = await api.get('/api/admin/paiement', { params:{ agentId: a.id||a._id } });
      setAgentTrans(Array.isArray(r.data) ? r.data : []);
    } catch { setAgentTrans([]); }
  };

  const handlePay = async () => {
    if (!payAgent) return alert('Chwazi ajan an!');
    if (!payMontant || Number(payMontant)<=0) return alert('Montant envalid!');
    setSaving(true);
    try {
      await api.post('/api/admin/paiement', {
        agentId: payAgent,
        type: payType,
        montant: Number(payMontant),
        note: payNote,
      });
      notify('✅ Tranzaksyon anrejistre!');
      setShowPay(false);
      setPayAgent(''); setPayType('depot'); setPayMontant(''); setPayNote('');
      await loadAll();
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSaving(false);
  };

  const TABS = [
    ['bilan',        '📊 Bilan'],
    ['agents',       '👤 Ajan'],
    ['transactions', '💳 Tranzaksyon'],
  ];

  return (
    <Layout>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'0 4px' }}>

        {/* BANNIÈRE */}
        <div style={{ background:'linear-gradient(135deg,#0d47a1,#1a73e8)',
          borderRadius:12, padding:'12px 16px', marginBottom:12,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:15, color:'white' }}>
            📒 Kontabilite
          </span>
          <button onClick={() => setShowPay(true)}
            style={{ background:'#f59e0b', border:'none', color:'#111',
              borderRadius:10, padding:'8px 16px', fontWeight:900,
              fontSize:13, cursor:'pointer' }}>
            ➕ Nouvo Tranzaksyon
          </button>
        </div>

        {msg.text && (
          <div style={{ background:msg.ok?'#dcfce7':'#fee2e2',
            border:`1px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color:msg.ok?'#16a34a':'#dc2626',
            padding:'10px 14px', borderRadius:10, marginBottom:12, fontWeight:700 }}>
            {msg.text}
          </div>
        )}

        {/* FILTRE DAT */}
        <div style={{ background:'white', borderRadius:12, padding:14,
          marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)',
          display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
          {[['📅 Debut',debut,setDebut],['📅 Fin',fin,setFin]].map(([l,v,s]) => (
            <div key={l} style={{ flex:1, minWidth:120 }}>
              <label style={{ display:'block', fontWeight:700, fontSize:11,
                marginBottom:4, color:'#555' }}>{l}</label>
              <input type="date" value={v} onChange={e=>s(e.target.value)}
                style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd',
                  borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
            </div>
          ))}
          <button onClick={loadAll} disabled={loading}
            style={{ padding:'10px 20px', background:loading?'#ccc':'#1a73e8',
              color:'white', border:'none', borderRadius:8, fontWeight:800,
              cursor:loading?'default':'pointer' }}>
            {loading ? '⏳' : '🔍 Chèche'}
          </button>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          {TABS.map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex:1, padding:'10px 0', border:'none', borderRadius:10,
                fontWeight:700, fontSize:12, cursor:'pointer',
                background: tab===k ? '#1a73e8' : '#f3f4f6',
                color: tab===k ? 'white' : '#555' }}>
              {l}
            </button>
          ))}
        </div>

        {/* ════ TAB BILAN ════ */}
        {tab === 'bilan' && (
          <div>
            {/* Kart rezime */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              {[
                { icon:'💰', lbl:'Vant Jodi a',    val:`${fmt(totalVente)} G`,    col:'#16a34a', bg:'#f0fdf4' },
                { icon:'📈', lbl:'Vant Total',      val:`${fmt(totalVenteTot)} G`, col:'#1a73e8', bg:'#eff6ff' },
                { icon:'🏆', lbl:'Gain Peye',       val:`${fmt(totalGagne)} G`,    col:'#f59e0b', bg:'#fffbeb' },
                { icon:'✅', lbl:'Benefis Jodi',    val:`${fmt(benefisJodi)} G`,   col: benefisJodi>=0?'#16a34a':'#dc2626', bg: benefisJodi>=0?'#f0fdf4':'#fef2f2' },
                { icon:'🏦', lbl:'Total Depò',      val:`${fmt(totalDepot)} G`,    col:'#0891b2', bg:'#ecfeff' },
                { icon:'⬇️', lbl:'Total Retrè',    val:`${fmt(totalRetrait)} G`,  col:'#7c3aed', bg:'#f5f3ff' },
              ].map(c => (
                <div key={c.lbl} style={{ background:c.bg, borderRadius:12,
                  padding:'14px 16px', borderLeft:`4px solid ${c.col}` }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{c.icon}</div>
                  <div style={{ fontWeight:900, fontSize:20, color:c.col }}>{c.val}</div>
                  <div style={{ fontSize:11, color:'#666', fontWeight:700 }}>{c.lbl}</div>
                </div>
              ))}
            </div>

            {/* Benefis total */}
            <div style={{ background: benefisTotal>=0
                ? 'linear-gradient(135deg,#16a34a,#15803d)'
                : 'linear-gradient(135deg,#dc2626,#b91c1c)',
              borderRadius:14, padding:'18px 20px', marginBottom:12,
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:700 }}>
                  BENEFIS TOTAL (Vant - Gain)
                </div>
                <div style={{ color:'white', fontWeight:900, fontSize:28, marginTop:4 }}>
                  {fmt(benefisTotal)} G
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>
                  {stats?.totalFiches||0} Fichè Total
                </div>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>
                  {stats?.fichesGagnant||0} Gagnant
                </div>
              </div>
            </div>

            {/* Vant pa tiraj */}
            {(stats?.ventePaTiraj||[]).length > 0 && (
              <div style={{ background:'white', borderRadius:12, padding:14,
                boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight:800, fontSize:14, marginBottom:10 }}>
                  🎯 Vant Pa Tiraj — Jodi a
                </div>
                {(stats.ventePaTiraj).map((t, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', padding:'9px 0',
                    borderBottom: i < stats.ventePaTiraj.length-1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>{t.nom}</span>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'#888' }}>{t.fiches} fich</span>
                      <span style={{ fontWeight:800, color:'#16a34a', fontSize:14 }}>
                        {fmt(t.vente)} G
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ TAB AJAN ════ */}
        {tab === 'agents' && (
          <div>
            {agentData.length === 0
              ? <div style={{ textAlign:'center', padding:32, color:'#888',
                  background:'white', borderRadius:12 }}>
                  Pa gen ajan
                </div>
              : agentData.map((a, i) => (
                <div key={a.id||a._id||i}
                  onClick={() => openAgentDetail(a)}
                  style={{ background:'white', borderRadius:12, padding:'14px 16px',
                    marginBottom:10, boxShadow:'0 1px 4px rgba(0,0,0,0.07)',
                    cursor:'pointer', borderLeft:`4px solid ${a.balance>=0?'#16a34a':'#dc2626'}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:8 }}>
                    <div>
                      <span style={{ fontWeight:900, fontSize:15, color:'#111' }}>
                        👤 {a.prenom} {a.nom}
                      </span>
                      <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>
                        {a.username} · POS: {a.posId} · {a.pct}% komisyon
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:900, fontSize:17,
                        color: a.balance>=0?'#16a34a':'#dc2626' }}>
                        {fmt(a.balance)} G
                      </div>
                      <div style={{ fontSize:10, color:'#9ca3af' }}>Balans</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                    gap:6, fontSize:11 }}>
                    <div style={{ background:'#f0fdf4', borderRadius:6, padding:'6px 8px' }}>
                      <span style={{ color:'#888' }}>Depò: </span>
                      <span style={{ fontWeight:700, color:'#16a34a' }}>{fmt(a.depots)} G</span>
                    </div>
                    <div style={{ background:'#fef2f2', borderRadius:6, padding:'6px 8px' }}>
                      <span style={{ color:'#888' }}>Retrè: </span>
                      <span style={{ fontWeight:700, color:'#dc2626' }}>{fmt(a.retraits)} G</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ════ TAB TRANZAKSYON ════ */}
        {tab === 'transactions' && (
          <div>
            {trans.length === 0
              ? <div style={{ textAlign:'center', padding:32, color:'#888',
                  background:'white', borderRadius:12 }}>
                  Pa gen tranzaksyon pou peryòd sa
                </div>
              : trans.map((t, i) => {
                const cfg = txCfg(t.type);
                const ag = agents.find(a => (a.id||a._id) === t.agentId);
                return (
                  <div key={t._id||i}
                    style={{ background:'white', borderRadius:12, padding:'12px 16px',
                      marginBottom:8, borderLeft:`4px solid ${cfg.col}`,
                      boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:22 }}>{cfg.icon}</span>
                        <div>
                          <div style={{ fontWeight:800, fontSize:13, color:'#111' }}>
                            {cfg.lbl}
                          </div>
                          <div style={{ fontSize:11, color:'#6b7280' }}>
                            {ag ? `${ag.prenom} ${ag.nom}` : t.agentId||'—'}
                            {t.note ? ` · ${t.note}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontWeight:900, fontSize:16, color:cfg.col }}>
                          {fmt(t.montant)} G
                        </div>
                        <div style={{ fontSize:10, color:'#9ca3af' }}>
                          {fmtDate(t.date||t.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>

      {/* ════ MODAL NOUVO TRANZAKSYON ════ */}
      {showPay && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
          zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowPay(false)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, padding:'0 0 40px' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3,
              margin:'12px auto 8px' }} />
            <div style={{ padding:'0 18px 16px', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontWeight:900, fontSize:17 }}>➕ Nouvo Tranzaksyon</div>
              <button onClick={() => setShowPay(false)}
                style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#888' }}>✕</button>
            </div>

            <div style={{ padding:'0 18px' }}>
              {/* Ajan */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12,
                  marginBottom:5, color:'#555' }}>👤 Ajan *</label>
                <select value={payAgent} onChange={e=>setPayAgent(e.target.value)}
                  style={{ width:'100%', padding:'12px', border:'1.5px solid #ddd',
                    borderRadius:10, fontSize:13 }}>
                  <option value=''>— Chwazi ajan —</option>
                  {agents.map(a => (
                    <option key={a.id||a._id} value={a.id||a._id}>
                      {a.prenom} {a.nom} ({a.username})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tip */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12,
                  marginBottom:5, color:'#555' }}>📋 Tip Tranzaksyon *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    ['depot',      '⬆️ Depò',       '#16a34a'],
                    ['retrait',    '⬇️ Retrè',      '#dc2626'],
                    ['prepaye',    '💳 Prepaye',     '#1a73e8'],
                    ['commission', '🏆 Komisyon',    '#f59e0b'],
                  ].map(([k,l,c]) => (
                    <button key={k} type="button" onClick={() => setPayType(k)}
                      style={{ padding:'12px', border:`2px solid ${payType===k?c:'#e5e7eb'}`,
                        borderRadius:10, background: payType===k?c:'white',
                        color: payType===k?'white':'#333',
                        fontWeight:700, cursor:'pointer', fontSize:13 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Montant */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12,
                  marginBottom:5, color:'#555' }}>💰 Montant (HTG) *</label>
                <input type="number" min="1" value={payMontant}
                  onChange={e=>setPayMontant(e.target.value)}
                  placeholder="0"
                  style={{ width:'100%', padding:'13px', border:'2px solid #ddd',
                    borderRadius:10, fontSize:18, fontWeight:900, boxSizing:'border-box',
                    textAlign:'center', letterSpacing:1 }} />
              </div>

              {/* Note */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12,
                  marginBottom:5, color:'#555' }}>📝 Note (opsyonèl)</label>
                <input value={payNote} onChange={e=>setPayNote(e.target.value)}
                  placeholder="Rezon, kòmantè..."
                  style={{ width:'100%', padding:'11px', border:'1.5px solid #ddd',
                    borderRadius:10, fontSize:13, boxSizing:'border-box' }} />
              </div>

              <button onClick={handlePay} disabled={saving}
                style={{ width:'100%', padding:'15px',
                  background: saving ? '#ccc'
                    : payType==='depot'?'#16a34a'
                    : payType==='retrait'?'#dc2626'
                    : '#1a73e8',
                  color:'white', border:'none', borderRadius:12,
                  fontWeight:900, fontSize:16, cursor:saving?'default':'pointer' }}>
                {saving ? '⏳...' : `✅ Konfime ${payMontant?`${fmt(payMontant)} G`:''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL DETAY AJAN ════ */}
      {selAgent && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
          zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setSelAgent(null)}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%',
            maxWidth:600, maxHeight:'85vh', overflowY:'auto' }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ width:44, height:5, background:'#ddd', borderRadius:3,
              margin:'12px auto 0' }} />

            {/* Header */}
            <div style={{ background: selAgent.balance>=0
                ? 'linear-gradient(135deg,#16a34a,#14532d)'
                : 'linear-gradient(135deg,#dc2626,#991b1b)',
              padding:'14px 18px', marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ color:'white', fontWeight:900, fontSize:17 }}>
                    👤 {selAgent.prenom} {selAgent.nom}
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.75)', fontSize:12, marginTop:2 }}>
                    {selAgent.username} · POS: {selAgent.posId}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:'#fef9c3', fontWeight:900, fontSize:24 }}>
                    {fmt(selAgent.balance)} G
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>Balans</div>
                </div>
              </div>
            </div>

            <div style={{ padding:'16px 18px 40px' }}>
              {/* Stats rapide */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                <div style={{ background:'#f0fdf4', borderRadius:10, padding:'10px 12px' }}>
                  <div style={{ color:'#888', fontSize:11 }}>Total Depò</div>
                  <div style={{ fontWeight:900, color:'#16a34a', fontSize:16 }}>
                    {fmt(selAgent.depots)} G
                  </div>
                </div>
                <div style={{ background:'#fef2f2', borderRadius:10, padding:'10px 12px' }}>
                  <div style={{ color:'#888', fontSize:11 }}>Total Retrè</div>
                  <div style={{ fontWeight:900, color:'#dc2626', fontSize:16 }}>
                    {fmt(selAgent.retraits)} G
                  </div>
                </div>
              </div>

              {/* Lis tranzaksyon */}
              <div style={{ fontWeight:800, fontSize:14, marginBottom:10, color:'#111' }}>
                📋 Istwa Tranzaksyon
              </div>
              {agentTrans.length === 0
                ? <div style={{ textAlign:'center', padding:20, color:'#888' }}>
                    Pa gen tranzaksyon
                  </div>
                : agentTrans.map((t, i) => {
                  const cfg = txCfg(t.type);
                  return (
                    <div key={t._id||i}
                      style={{ display:'flex', justifyContent:'space-between',
                        alignItems:'center', padding:'10px 0',
                        borderBottom: i<agentTrans.length-1?'1px solid #f3f4f6':'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:18 }}>{cfg.icon}</span>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:'#111' }}>
                            {cfg.lbl}
                          </div>
                          {t.note && (
                            <div style={{ fontSize:11, color:'#888' }}>{t.note}</div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontWeight:900, color:cfg.col, fontSize:14 }}>
                          {fmt(t.montant)} G
                        </div>
                        <div style={{ fontSize:10, color:'#9ca3af' }}>
                          {fmtDate(t.date||t.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              }

              {/* Bouton peman rapide */}
              <button onClick={() => {
                  setSelAgent(null);
                  setPayAgent(selAgent.id||selAgent._id);
                  setShowPay(true);
                }}
                style={{ width:'100%', padding:'13px', background:'#1a73e8',
                  color:'white', border:'none', borderRadius:12,
                  fontWeight:900, fontSize:14, cursor:'pointer', marginTop:16 }}>
                ➕ Ajoute Tranzaksyon pou {selAgent.prenom}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
