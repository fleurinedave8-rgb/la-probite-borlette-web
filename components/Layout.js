import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUser, clearAuth } from '../utils/auth';

const SW = 268;

const NAV = [
  { href:'/dashboard',  icon:'🏠', label:'Tableau de bord' },
  { href:'/mon-compte', icon:'🏛', label:'Mon compte' },
  { href:'/paiement',   icon:'💳', label:'Paiement online' },
  { href:'/succursal',  icon:'🏛', label:'Succursal' },
  { href:'/agents',     icon:'👤', label:'Agents / POS' },
  { label:'Configurations', icon:'⚙️', sub:[
    { href:'/configurations/pos',             label:'🖥️ Jesyon POS' },
    { href:'/configurations/mariage-gratuit', label:'Mariage gratuit' },
    { href:'/configurations/tirages',         label:'Tirages' },
    { href:'/configurations/primes',          label:'Primes' },
    { href:'/configurations/tete-fiche',      label:'Tête Fiche' },
    { href:'/configurations/utilisateurs',    label:'Utilisateurs' },
  ]},
  { label:'Surveillance', icon:'🖥', sub:[
    { href:'/surveillance/statistiques',         label:'Statistiques' },
    { href:'/surveillance/blocage-boule',        label:'Blocage boule' },
    { href:'/surveillance/limites',              label:'Limites' },
    { href:'/surveillance/controle-agent',       label:'Controle agent' },
    { href:'/surveillance/fiches-agent',         label:'Fiches par agent' },
    { href:'/surveillance/lots-gagnant',         label:'Lots gagnant' },
    { href:'/surveillance/pos-connectes',        label:'POS Connectés' },
    { href:'/surveillance/scraper-status',       label:'Scraper Tiraj' },
    { href:'/surveillance/tracabilite',          label:'Traçabilité' },
    { href:'/surveillance/demmande-elimination', label:'Demande élimination' },
  ]},
  { label:'Rapport', icon:'📋', sub:[
    { href:'/rapport/journalier',        label:'Journalier' },
    { href:'/rapport/ventes-fin-tirage', label:'Ventes fin tirage' },
    { href:'/rapport/ventes-matin-soir', label:'Ventes matin/soir' },
    { href:'/rapport/fiches-vendu',      label:'Fiches vendu' },
    { href:'/rapport/fiches-gagnant',    label:'Fiches gagnant' },
    { href:'/rapport/fiches-elimine',    label:'Fiches éliminé' },
    { href:'/rapport/defisi',            label:'📉 Defisi / Profit' },
  ]},
  { href:'/kontabilite', icon:'📒', label:'Kontabilite' },
  { href:'/doleances', icon:'🗣️', label:'Doléances' },
  { href:'/tutoriel',  icon:'ℹ️', label:'Tutoriel' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [ready,     setReady]     = useState(false);
  const [mobile,    setMobile]    = useState(false);
  const [sideOpen,  setSideOpen]  = useState(true);
  const [openMenus, setOpenMenus] = useState({});
  const [user,      setUser]      = useState(null);

  useEffect(() => {
    const isMob = window.innerWidth < 900;
    setMobile(isMob);
    setSideOpen(!isMob);
    setUser(getUser());

    const m = {};
    NAV.forEach(item => {
      if (item.sub?.some(s => router.pathname.startsWith(s.href)))
        m[item.label] = true;
    });
    setOpenMenus(m);
    setReady(true);

    const onResize = () => {
      const now = window.innerWidth < 900;
      setMobile(now);
      if (now) setSideOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const logout      = () => { clearAuth(); router.push('/'); };
  const toggle      = (label) => setOpenMenus(p => ({ ...p, [label]: !p[label] }));
  const closeMobile = () => { if (mobile) setSideOpen(false); };

  // Pa retounen null pou evite flash — itilize ready pou kache UI sèlman

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: !mobile && sideOpen ? `${SW}px 1fr` : '1fr',
      gridTemplateRows: '56px 1fr',
      minHeight: '100vh',
      background: '#f0f2f5',
      alignItems: 'start',
    }}>

      {/* Overlay mobile */}
      {mobile && sideOpen && (
        <div onClick={() => setSideOpen(false)} style={{
          position:'fixed', inset:0,
          background:'rgba(0,0,0,.6)',
          zIndex:1100,
        }} />
      )}

      {/* ════ SIDEBAR ════ */}
      <nav style={{
        gridRow: '1 / 3',
        gridColumn: '1',
        visibility: ready ? 'visible' : 'hidden',
        background: 'linear-gradient(180deg, #111827 0%, #1e1e2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRight: '1px solid #2a2a3a',
        ...(mobile ? {
          position: 'fixed',
          top: 0, left: 0,
          width: SW,
          height: '100vh',
          zIndex: 1200,
          transform: sideOpen ? 'translateX(0)' : `translateX(-${SW}px)`,
          transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
        } : {
          display: sideOpen ? 'flex' : 'none',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }),
      }}>

        {/* ─ Logo + Branding ─ */}
        <div style={{
          padding:'20px 16px 16px',
          textAlign:'center',
          borderBottom:'1px solid rgba(255,255,255,.08)',
          flexShrink:0,
          background:'rgba(0,0,0,.2)',
        }}>
          <div style={{
            width:56, height:56, borderRadius:'50%',
            background:'linear-gradient(135deg, #f59e0b, #d97706)',
            margin:'0 auto 10px',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24, boxShadow:'0 4px 12px rgba(245,158,11,.4)',
          }}>🔑</div>
          <div style={{ color:'white', fontWeight:900, fontSize:13, letterSpacing:.8, lineHeight:1.3 }}>
            LA-PROBITE
          </div>
          <div style={{ color:'#f59e0b', fontWeight:800, fontSize:11, letterSpacing:1.5, marginTop:1 }}>
            BORLETTE
          </div>
          {user && (
            <div style={{
              marginTop:8, background:'rgba(245,158,11,.12)',
              border:'1px solid rgba(245,158,11,.25)',
              borderRadius:20, padding:'4px 12px', display:'inline-block',
            }}>
              <span style={{ color:'#fbbf24', fontSize:11, fontWeight:700 }}>
                👤 {user.prenom} {user.nom}
              </span>
            </div>
          )}
        </div>

        {/* ─ Nav items ─ */}
        <div style={{ flex:1, paddingTop:8, paddingBottom:16 }}>
          {NAV.map((item, i) => {

            if (item.sub) {
              const isOpen   = !!openMenus[item.label];
              const isActive = item.sub.some(s => router.pathname === s.href);
              return (
                <div key={i}>
                  <div onClick={() => toggle(item.label)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'11px 16px', cursor:'pointer',
                    color: isActive ? '#fff' : '#94a3b8',
                    background: isActive ? 'rgba(245,158,11,.1)' : 'transparent',
                    userSelect:'none',
                    transition:'all .15s',
                    borderLeft: isActive ? '3px solid #f59e0b' : '3px solid transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.05)'}
                  onMouseLeave={e => e.currentTarget.style.background=isActive?'rgba(245,158,11,.1)':'transparent'}
                  >
                    <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:20, textAlign:'center', fontSize:16 }}>{item.icon}</span>
                      <span style={{ fontSize:14, fontWeight:600 }}>{item.label}</span>
                    </span>
                    <span style={{ color:'#f59e0b', fontSize:12, transition:'transform .2s', display:'inline-block', transform: isOpen?'rotate(90deg)':'rotate(0deg)' }}>▶</span>
                  </div>

                  {isOpen && (
                    <div style={{ background:'rgba(0,0,0,.2)', borderLeft:'1px solid rgba(255,255,255,.05)', marginLeft:16 }}>
                      {item.sub.map((sub, j) => {
                        const act = router.pathname === sub.href;
                        return (
                          <Link key={j} href={sub.href} onClick={closeMobile} style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'9px 16px 9px 20px',
                            color: act ? '#fbbf24' : '#94a3b8',
                            background: act ? 'rgba(245,158,11,.12)' : 'transparent',
                            textDecoration:'none',
                            borderLeft: act ? '2px solid #f59e0b' : '2px solid transparent',
                            fontSize:13, fontWeight: act ? 700 : 500,
                            transition:'all .15s',
                          }}>
                            <span style={{ color: act ? '#f59e0b' : '#475569', fontSize:8 }}>◆</span>
                            <span>{sub.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const act = router.pathname === item.href;
            return (
              <Link key={i} href={item.href} onClick={closeMobile} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'11px 16px',
                color: act ? '#fff' : '#94a3b8',
                background: act ? 'rgba(245,158,11,.12)' : 'transparent',
                textDecoration:'none',
                borderLeft: act ? '3px solid #f59e0b' : '3px solid transparent',
                fontSize:14, fontWeight: act ? 700 : 500,
                transition:'all .15s',
              }}>
                <span style={{ width:20, textAlign:'center', fontSize:16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Dekonekte */}
          <div onClick={logout} style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'11px 16px', cursor:'pointer',
            color:'#f87171',
            borderTop:'1px solid rgba(255,255,255,.06)',
            marginTop:12, fontSize:14, fontWeight:600,
            borderLeft:'3px solid transparent',
            transition:'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,.1)'; e.currentTarget.style.borderLeftColor='#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderLeftColor='transparent'; }}
          >
            <span style={{ width:20, textAlign:'center' }}>⏻</span>
            <span>Dekonekte</span>
          </div>

          {/* NEXTSTEPDIGITAL */}
          <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,.06)', marginTop:8, textAlign:'center' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:7,
              background:'linear-gradient(135deg, #0f172a, #1e293b)',
              border:'1px solid rgba(59,130,246,.3)', borderRadius:10, padding:'7px 14px',
            }}>
              <span style={{ fontSize:12 }}>⚡</span>
              <div>
                <div style={{
                  fontSize:10, fontWeight:900, letterSpacing:1.5,
                  background:'linear-gradient(90deg, #f59e0b, #3b82f6)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                }}>NEXTSTEPDIGITAL</div>
                <div style={{ fontSize:9, color:'#475569', marginTop:1 }}>+509 41 76 24 10</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ════ HEADER ════ */}
      <header style={{
        gridRow: '1',
        gridColumn: !mobile && sideOpen ? '2' : '1',
        visibility: ready ? 'visible' : 'hidden',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,.08)',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 56,
        // Mobile: fixed pou roulan smooth
        // Desktop: sticky nan grid — pa gen vid
        ...(mobile ? {
          position: 'fixed',
          top: 0, left: 0, right: 0,
          width: '100%',
        } : {
          position: 'sticky',
          top: 0,
        }),
      }}>
        <button onClick={() => setSideOpen(o => !o)}
          style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#374151', padding:'4px 8px', lineHeight:1, borderRadius:6 }}>
          ☰
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>🔑</span>
          <span style={{ fontWeight:900, fontSize:15, color:'#111827', letterSpacing:.5 }}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {/* SÈLEKTÈ 4 LANG */}
          {!mobile && (
            <div style={{ display:'flex', gap:3 }}>
              {(['CR','FR','ES','EN']).map(l => {
                const flags = {CR:'🇭🇹',FR:'🇫🇷',ES:'🇪🇸',EN:'🇺🇸'};
                const stored = typeof localStorage!=='undefined'?localStorage.getItem('borlette_lang')||'CR':'CR';
                return (
                  <button key={l}
                    onClick={()=>{ if(typeof localStorage!=='undefined'){localStorage.setItem('borlette_lang',l);} window.location.reload(); }}
                    style={{ background:stored===l?'#f59e0b':'transparent',
                      border:stored===l?'none':'1px solid #e5e7eb',
                      borderRadius:6, padding:'3px 7px', cursor:'pointer',
                      fontSize:11, fontWeight:800,
                      color:stored===l?'#111':'#888' }}>
                    {flags[l]}
                  </button>
                );
              })}
            </div>
          )}
          {user && !mobile && (
            <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:20, padding:'4px 12px' }}>
              <span style={{ fontSize:13 }}>👤</span>
              <span style={{ fontSize:12, color:'#374151', fontWeight:600 }}>{user.prenom} {user.nom}</span>
            </div>
          )}
          <button onClick={logout} style={{
            background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:8,
            padding:'6px 12px', cursor:'pointer', fontSize:12, color:'#dc2626',
            fontWeight:700, display:'flex', alignItems:'center', gap:4,
          }}>
            <span>⏻</span>
            {!mobile && <span>Konekte</span>}
          </button>
        </div>
      </header>

      {/* ════ CONTENU ════ */}
      <main style={{
        gridRow: '2',
        gridColumn: !mobile && sideOpen ? '2' : '1',
        padding: mobile ? '16px 12px' : '20px 24px',
        marginTop: mobile ? 56 : 0,
        minHeight: mobile ? 'calc(100vh - 56px)' : 'calc(100vh - 56px)',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        width: '100%',
        alignSelf: 'start',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>

    </div>
  );
}
