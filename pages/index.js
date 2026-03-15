import { useState } from 'react';
import { useRouter } from 'next/router';
import { loginApi } from '../utils/api';
import { saveAuth } from '../utils/auth';

const features = [
  { icon: '📋', label: 'Création sou superviseur' },
  { icon: '💍', label: 'Mariage gratuit par zone', highlight: true },
  { icon: '🎫', label: 'Tèt fiche' },
  { icon: '💳', label: 'Option pré-payer' },
  { icon: '💒', label: 'Mariage gratuit' },
  { icon: '🎲', label: 'Loto4 et Mariage automatique' },
  { icon: '📝', label: 'Créer fiche' },
  { icon: '🔍', label: 'Rechercher fiche' },
  { icon: '📊', label: 'Rapport' },
  { icon: '🎯', label: 'Tirage sans limite' },
  { icon: '🖥️', label: 'Boule automatique' },
  { icon: '🚫', label: 'Limiter boule' },
];

export default function LoginPage() {
  const router = useRouter();
  const [showLogin, setShowLogin]     = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showMenu, setShowMenu]       = useState(false);
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // Register form
  const [reg, setReg] = useState({ nom:'', prenom:'', username:'', password:'', email:'', telephone:'' });
  const [regError, setRegError]   = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) { setError('Ranpli tout chan yo'); return; }
    setLoading(true); setError('');
    try {
      const res = await loginApi({ username, password });
      saveAuth(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Koneksyon echwe. Verifye enfòmasyon ou.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!reg.nom || !reg.username || !reg.password) { setRegError('Ranpli tout chan obligatwa'); return; }
    setRegLoading(true); setRegError('');
    try {
      const res = await loginApi({ username: reg.username, password: reg.password });
      saveAuth(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err) {
      setRegError(err.response?.data?.message || 'Erè enrejistreman');
    } finally { setRegLoading(false); }
  };

  return (
    <div style={{ fontFamily:'Segoe UI, sans-serif', margin:0, padding:0 }}>

      {/* HEADER */}
      <header style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 4px rgba(0,0,0,0.1)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>🔑</div>
          <div>
            <div style={{ fontWeight:900, fontSize:13, lineHeight:1.2 }}>LA-PROBITE</div>
            <div style={{ fontWeight:900, fontSize:13, color:'#1a73e8' }}>BORLETTE</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { setShowRegister(true); setShowMenu(false); }} style={{ background:'#f59e0b', color:'black', border:'none', borderRadius:6, padding:'8px 16px', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            S'inscrire
          </button>
          <button onClick={() => { setShowLogin(true); setShowMenu(false); }} style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'8px 16px', cursor:'pointer', fontWeight:700, fontSize:13 }}>
            Connexion
          </button>
        </div>
      </header>

      {/* HERO */}
      <section style={{ background:'linear-gradient(135deg, #1a73e8, #0d47a1)', padding:'60px 20px 80px', textAlign:'center', color:'white', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
        <h1 style={{ fontSize:30, fontWeight:900, marginBottom:10, position:'relative' }}>
          Gérez votre entreprise<br />avec <span style={{ color:'#f59e0b' }}>LA-PROBITE-BORLETTE</span>
        </h1>
        <p style={{ opacity:0.9, marginBottom:30, fontSize:14, position:'relative' }}>
          Plateforme qui permet de faire la gestion de vos differents pointe de ventes
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap', position:'relative' }}>
          <button onClick={() => setShowLogin(true)} style={{ background:'#f59e0b', color:'black', border:'none', borderRadius:8, padding:'14px 30px', fontSize:15, fontWeight:800, cursor:'pointer' }}>
            Se Connecter 🔒
          </button>
          <button onClick={() => setShowRegister(true)} style={{ background:'white', color:'#1a73e8', border:'none', borderRadius:8, padding:'14px 30px', fontSize:15, fontWeight:800, cursor:'pointer' }}>
            S'inscrire ✏️
          </button>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:40, flexWrap:'wrap' }}>
          {[['📊','Dashboard complet'],['📱','POS Mobile'],['⚡','Temps réel'],['🖨️','Impression 50mm']].map(([e,l]) => (
            <div key={l} style={{ background:'rgba(255,255,255,0.15)', borderRadius:8, padding:'12px 16px', fontSize:12, fontWeight:600 }}>{e} {l}</div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:'50px 20px', background:'#f8f9fa' }}>
        <h2 style={{ textAlign:'center', fontSize:26, fontWeight:800, marginBottom:8 }}>Fonctionnalités</h2>
        <p style={{ textAlign:'center', color:'#666', marginBottom:30, fontSize:14 }}>
          Voici les differentes fonctionnalites offertes par notre systeme.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:14, maxWidth:900, margin:'0 auto' }}>
          {features.map((f,i) => (
            <div key={i} style={{ background: f.highlight ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'white', color: f.highlight ? 'white' : '#333', borderRadius:10, padding:'22px 16px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{f.icon}</div>
              <div style={{ fontSize:13, fontWeight:600 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VIDEO YOUTUBE */}
      <section style={{ padding:'50px 20px', background:'white', textAlign:'center' }}>
        <h2 style={{ fontSize:26, fontWeight:800, marginBottom:8 }}>Comment ça marche ?</h2>
        <p style={{ color:'#666', marginBottom:30, fontSize:14 }}>Regardez notre tutoriel pour apprendre à utiliser le système</p>
        <div style={{ maxWidth:640, margin:'0 auto', borderRadius:12, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.15)' }}>
          <div style={{ position:'relative', paddingBottom:'56.25%', height:0 }}>
            <iframe
              style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="LA-PROBITE-BORLETTE Tutoriel"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section style={{ background:'#1a73e8', padding:'50px 20px', textAlign:'center', color:'white' }}>
        <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>N'hésitez pas à nous contacter.</h2>
        <p style={{ opacity:0.85, marginBottom:30, fontSize:14 }}>
          Nous serons heureux de personnaliser en fonction de vos besoins, envoyez-nous une note
        </p>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, maxWidth:400, margin:'0 auto' }}>
          <a href="tel:+50934359470" style={{ display:'flex', alignItems:'center', gap:10, color:'white', textDecoration:'none', fontSize:16, fontWeight:700 }}>
            📞 +509 34 35 9470
          </a>
          <a href="mailto:robensjeanpaul@gmail.com" style={{ display:'flex', alignItems:'center', gap:10, color:'white', textDecoration:'none', fontSize:16, fontWeight:700 }}>
            ✉️ robensjeanpaul@gmail.com
          </a>
          <a href="https://wa.me/50934359470" target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:10, color:'white', textDecoration:'none', fontSize:16, fontWeight:700 }}>
            💬 WhatsApp
          </a>
        </div>
      </section>

      {/* POLITIQUE DE CONFIDENTIALITÉ */}
      <section style={{ padding:'40px 20px', background:'#f8f9fa' }}>
        <div style={{ maxWidth:800, margin:'0 auto' }}>
          <h2 style={{ fontSize:22, fontWeight:800, marginBottom:16, textAlign:'center' }}>Politique de confidentialité</h2>
          <div style={{ background:'white', borderRadius:10, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', fontSize:14, lineHeight:1.8, color:'#444' }}>
            <p><strong>1. Collecte des données</strong><br/>Nous collectons uniquement les informations nécessaires au fonctionnement de la plateforme : nom, prénom, numéro de téléphone et données de transactions.</p>
            <p><strong>2. Utilisation des données</strong><br/>Vos données sont utilisées exclusivement pour la gestion de votre compte et le suivi de vos activités sur la plateforme LA-PROBITE-BORLETTE.</p>
            <p><strong>3. Protection des données</strong><br/>Toutes les données sont sécurisées avec un chiffrement SSL. Nous ne partageons jamais vos informations avec des tiers sans votre consentement.</p>
            <p><strong>4. Vos droits</strong><br/>Vous avez le droit d'accéder, de modifier ou de supprimer vos données à tout moment en contactant notre support.</p>
            <p><strong>5. Contact</strong><br/>Pour toute question relative à votre vie privée : robensjeanpaul@gmail.com | +509 34 35 9470</p>
          </div>
        </div>
      </section>

      {/* FOOTER ANIMÉ */}
      <footer style={{ background:'linear-gradient(135deg,#0a0a0f,#0f0f1a)', padding:'32px 20px 24px', textAlign:'center', borderTop:'1px solid #1a1a2e' }}>
        {/* Ligne déco animée */}
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8, marginBottom:16 }}>
          <div style={{ height:1, width:60, background:'linear-gradient(90deg,transparent,#f59e0b)' }} />
          <span style={{ fontSize:18 }}>⚡</span>
          <div style={{ height:1, width:60, background:'linear-gradient(90deg,#3b82f6,transparent)' }} />
        </div>

        <p style={{ margin:'0 0 8px', color:'#ccc', fontSize:14 }}>
          ©2026 <span style={{ color:'#f59e0b', fontWeight:900, letterSpacing:1 }}>LA-PROBITE-BORLETTE</span>. Tout dwa rezève.
        </p>

        {/* Badge NEXTSTEPDIGITAL */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:12,
          background:'rgba(255,255,255,0.03)', border:'1px solid rgba(59,130,246,0.3)',
          borderRadius:24, padding:'8px 20px',
        }}>
          <div style={{
            width:28, height:28, borderRadius:'50%',
            background:'linear-gradient(135deg,#f59e0b,#3b82f6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, fontWeight:900, color:'white',
          }}>N</div>
          <div style={{ textAlign:'left' }}>
            <div style={{
              fontSize:12, fontWeight:900, letterSpacing:2,
              background:'linear-gradient(90deg,#f59e0b,#3b82f6)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>NEXTSTEPDIGITAL</div>
            <div style={{ fontSize:10, color:'#555' }}>📞 +509 41 76 24 10</div>
          </div>
        </div>

        <p style={{ margin:'12px 0 0', fontSize:10, color:'#333', letterSpacing:1 }}>
          POWERED BY NEXTSTEPDIGITAL SOLUTIONS
        </p>
      </footer>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:380 }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:44, marginBottom:6 }}>🔑</div>
              <h2 style={{ fontWeight:900, fontSize:18, margin:0 }}>LA-PROBITE-BORLETTE</h2>
              <p style={{ color:'#666', fontSize:12, marginTop:4 }}>Konekte nan kont ou</p>
            </div>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #dc2626', borderRadius:8, padding:'8px 12px', marginBottom:14, color:'#dc2626', fontSize:13 }}>{error}</div>}
            <form onSubmit={handleLogin}>
              {[['text','Nom d\'utilisateur',username,setUsername,'admin'],['password','Mot de passe',password,setPassword,'••••••••']].map(([type,label,val,setter,ph]) => (
                <div key={label} style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>{label}</label>
                  <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                    style={{ width:'100%', padding:'11px 14px', border:'1px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', background: loading?'#93c5fd':'#1a73e8', color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:800, cursor:'pointer', marginTop:4 }}>
                {loading ? 'Koneksyon...' : 'KONEKTE 🔐'}
              </button>
            </form>
            <button onClick={() => { setShowLogin(false); setShowRegister(true); }} style={{ width:'100%', marginTop:10, padding:'10px', background:'transparent', border:'1px solid #ddd', borderRadius:8, color:'#1a73e8', cursor:'pointer', fontSize:13, fontWeight:600 }}>
              Pas de compte ? S'inscrire
            </button>
            <button onClick={() => setShowLogin(false)} style={{ width:'100%', marginTop:8, padding:'8px', background:'transparent', border:'none', color:'#999', cursor:'pointer', fontSize:12 }}>Fermer</button>
          </div>
        </div>
      )}

      {/* REGISTER MODAL */}
      {showRegister && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:16, padding:32, width:'100%', maxWidth:420, maxHeight:'90vh', overflow:'auto' }}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:44, marginBottom:6 }}>✏️</div>
              <h2 style={{ fontWeight:900, fontSize:18, margin:0 }}>Créer un compte</h2>
              <p style={{ color:'#666', fontSize:12, marginTop:4 }}>LA-PROBITE-BORLETTE</p>
            </div>
            {regError && <div style={{ background:'#fef2f2', border:'1px solid #dc2626', borderRadius:8, padding:'8px 12px', marginBottom:14, color:'#dc2626', fontSize:13 }}>{regError}</div>}
            <form onSubmit={handleRegister}>
              {[
                ['text','Nom *','nom'],
                ['text','Prénom','prenom'],
                ['text','Username *','username'],
                ['password','Mot de passe *','password'],
                ['email','Email','email'],
                ['tel','Téléphone','telephone'],
              ].map(([type,label,key]) => (
                <div key={key} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>{label}</label>
                  <input type={type} value={reg[key]} onChange={e => setReg(p => ({...p,[key]:e.target.value}))}
                    style={{ width:'100%', padding:'10px 14px', border:'1px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                </div>
              ))}
              <button type="submit" disabled={regLoading} style={{ width:'100%', padding:'13px', background: regLoading?'#86efac':'#16a34a', color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:800, cursor:'pointer', marginTop:8 }}>
                {regLoading ? 'Enregistrement...' : "S'INSCRIRE ✅"}
              </button>
            </form>
            <button onClick={() => { setShowRegister(false); setShowLogin(true); }} style={{ width:'100%', marginTop:10, padding:'10px', background:'transparent', border:'1px solid #ddd', borderRadius:8, color:'#1a73e8', cursor:'pointer', fontSize:13, fontWeight:600 }}>
              Déjà un compte ? Se connecter
            </button>
            <button onClick={() => setShowRegister(false)} style={{ width:'100%', marginTop:8, padding:'8px', background:'transparent', border:'none', color:'#999', cursor:'pointer', fontSize:12 }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
