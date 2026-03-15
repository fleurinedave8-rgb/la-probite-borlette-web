import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { getUser, saveAuth } from '../utils/auth';

const defaultConfig = {
  // Informations de base
  nom: '', adresse: '', telephone: '', message: '', whatsapp: '',
  // Options système
  boulPaBoul: false, codeBarres: false, box: false,
  serveur: '', doubleTirage: false, facade: false,
  eliminerSansConfirmation: 'non', langue: 'Français',
  tailleImprimante: '58mm',
  // Options jeu
  boulARevers: false, mariageGratuit: false,
  boulPaire: false, pointe: false,
  mariageAutomatique: false, loto4Automatique: false,
  modifierLot: false, voirFicheGagnant: true,
  // Permissions réimpression
  reImprimerFiche: true,
  // Quantités limites
  kantiteBoul: 40,
  kantiteMariaj: 120,
  kantiteLoto3: 20,
  kantiteLoto4: 10,
  // Délai élimination
  intervalMinuteEliminerFiche: 30,
  // Tête fiche
  teteFicheLoto3: 'droite',
  credit: '',
};

export default function MonCompte() {
  const [user, setUser]         = useState(null);
  const [config, setConfig]     = useState(defaultConfig);
  const [activeTab, setActiveTab] = useState('info');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [photoProfile, setPhotoProfile] = useState(null);
  const [photoId, setPhotoId]   = useState(null);
  const fileProfileRef = useRef();
  const fileIdRef      = useRef();

  useEffect(() => {
    const u = getUser();
    setUser(u);
    // Load config from backend
    api.get('/api/agent/config').catch(() => {});
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.put('/api/agent/config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Save locally if API not ready
      localStorage.setItem('borlette_config', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const handlePhotoChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'profile') setPhotoProfile(url);
    else setPhotoId(url);
  };

  const tabs = [
    { key:'info',   label:'Profil',                  color:'#1a73e8' },
    { key:'config', label:'Configuration du système', color:'#16a34a' },
    { key:'factures', label:'Factures disponible',   color:'#16a34a' },
    { key:'transactions', label:'Historique transactions', color:'#f59e0b' },
    { key:'logs',   label:'Log jeux virtuel',         color:'#dc2626' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15, color:'#000' }}>LA-PROBITE-BORLETTE</span>
        </div>

        {/* SOLDE */}
        <div style={{ background:'linear-gradient(135deg, #1a73e8, #7c3aed)', borderRadius:12, padding:'24px 20px', marginBottom:16, color:'white' }}>
          <div style={{ fontSize:13, opacity:0.85, marginBottom:6 }}>Solde disponible</div>
          <div style={{ fontSize:32, fontWeight:900 }}>HTG {user?.balance || '0.00'}</div>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ background: activeTab===t.key ? t.color : '#e5e7eb', color: activeTab===t.key ? 'white' : '#333', border:'none', borderRadius:8, padding:'9px 16px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB PROFIL ── */}
        {activeTab === 'info' && (
          <div style={{ background:'white', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontWeight:800, fontSize:18 }}>Informations</h2>
              <span style={{ fontWeight:700, color:'#1a73e8', cursor:'pointer' }}>Profil</span>
            </div>

            {/* PHOTOS */}
            <div style={{ display:'flex', gap:20, marginBottom:24, flexWrap:'wrap' }}>
              {/* Photo profil */}
              <div style={{ textAlign:'center' }}>
                <div onClick={() => fileProfileRef.current.click()}
                  style={{ width:90, height:90, borderRadius:'50%', background:'#f0f0f0', border:'3px dashed #ddd', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', marginBottom:6 }}>
                  {photoProfile ? <img src={photoProfile} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:32 }}>👤</span>}
                </div>
                <div style={{ fontSize:11, color:'#888' }}>Photo profil</div>
                <input ref={fileProfileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handlePhotoChange(e,'profile')} />
              </div>
              {/* Photo ID */}
              <div style={{ textAlign:'center' }}>
                <div onClick={() => fileIdRef.current.click()}
                  style={{ width:90, height:90, borderRadius:8, background:'#f0f0f0', border:'3px dashed #ddd', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', marginBottom:6 }}>
                  {photoId ? <img src={photoId} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:32 }}>🪪</span>}
                </div>
                <div style={{ fontSize:11, color:'#888' }}>Photo identité</div>
                <input ref={fileIdRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => handlePhotoChange(e,'id')} />
              </div>
            </div>

            {/* INFOS */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                ['Propriétaire', user ? `${user.prenom} ${user.nom}` : '-'],
                ['Nom', user?.nom || '-'],
                ['Expiration', '2026-12-31'],
                ['Téléphone', user?.telephone || '-'],
                ['Email', '-'],
                ['Montant par POS', '10 $ USD'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize:11, color:'#999', marginBottom:3 }}>{label}</div>
                  <div style={{ fontWeight:700, fontSize:14, color: label==='Expiration' ? '#16a34a' : '#111' }}>{val}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setActiveTab('config')}
              style={{ marginTop:20, background:'#1a73e8', color:'white', border:'none', borderRadius:8, padding:'11px 24px', fontWeight:700, cursor:'pointer' }}>
              ⚙️ Modifier la configuration
            </button>
          </div>
        )}

        {/* ── TAB CONFIGURATION ── */}
        {activeTab === 'config' && (
          <div style={{ background:'white', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin:'0 0 20px', fontWeight:800, fontSize:18 }}>Configuration du système</h2>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

              {/* Champs texte */}
              {[
                ['nom',       'Nom serveur'],
                ['adresse',   'Adresse'],
                ['telephone', 'Téléphone'],
                ['message',   'Message ticket'],
                ['credit',    'Crédit'],
                ['serveur',   'Serveur'],
                ['whatsapp',  'WhatsApp'],
              ].map(([key, label]) => (
                <div key={key} style={{ background:'#f8f9fa', borderRadius:8, padding:12 }}>
                  <label style={{ display:'block', fontSize:11, color:'#888', marginBottom:4, fontWeight:600 }}>{label}</label>
                  <input value={config[key]||''} onChange={e => setConfig(p=>({...p,[key]:e.target.value}))}
                    style={{ width:'100%', border:'none', background:'transparent', fontSize:14, fontWeight:600, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}

              {/* Champs numériques — Quantités */}
              {[
                ['kantiteBoul',  'Kantite Boul (défaut: 40)'],
                ['kantiteMariaj','Kantite Mariage (défaut: 120)'],
                ['kantiteLoto3', 'Kantite Loto3 (défaut: 20)'],
                ['kantiteLoto4', 'Kantite Loto4 (défaut: 10)'],
                ['intervalMinuteEliminerFiche','Delai Elimine (minutes, défaut: 30)'],
              ].map(([key, label]) => (
                <div key={key} style={{ background:'#f8f9fa', borderRadius:8, padding:12 }}>
                  <label style={{ display:'block', fontSize:11, color:'#888', marginBottom:4, fontWeight:600 }}>{label}</label>
                  <input type="number" value={config[key]||''} onChange={e => setConfig(p=>({...p,[key]:e.target.value}))}
                    style={{ width:'100%', border:'none', background:'transparent', fontSize:16, fontWeight:700, outline:'none', color:'#1a73e8', boxSizing:'border-box' }} />
                </div>
              ))}

              {/* Select - Langue */}
              <div style={{ background:'#f8f9fa', borderRadius:8, padding:12 }}>
                <label style={{ display:'block', fontSize:11, color:'#888', marginBottom:4, fontWeight:600 }}>Langue</label>
                <select value={config.langue} onChange={e => setConfig(p=>({...p,langue:e.target.value}))}
                  style={{ width:'100%', border:'none', background:'transparent', fontSize:14, fontWeight:600, outline:'none' }}>
                  <option>Français</option>
                  <option>Kreyòl</option>
                  <option>English</option>
                </select>
              </div>

              {/* Select - Taille imprimante */}
              <div style={{ background:'#f8f9fa', borderRadius:8, padding:12 }}>
                <label style={{ display:'block', fontSize:11, color:'#888', marginBottom:4, fontWeight:600 }}>Taille de l'imprimante</label>
                <select value={config.tailleImprimante} onChange={e => setConfig(p=>({...p,tailleImprimante:e.target.value}))}
                  style={{ width:'100%', border:'none', background:'transparent', fontSize:14, fontWeight:600, outline:'none' }}>
                  <option>58mm</option>
                  <option>50mm</option>
                  <option>80mm</option>
                </select>
              </div>

              {/* Select - Tête fiche */}
              <div style={{ background:'#f8f9fa', borderRadius:8, padding:12 }}>
                <label style={{ display:'block', fontSize:11, color:'#888', marginBottom:4, fontWeight:600 }}>Tête fiche Loto3</label>
                <select value={config.teteFicheLoto3} onChange={e => setConfig(p=>({...p,teteFicheLoto3:e.target.value}))}
                  style={{ width:'100%', border:'none', background:'transparent', fontSize:14, fontWeight:600, outline:'none' }}>
                  <option value="droite">Droite</option>
                  <option value="gauche">Gauche</option>
                </select>
              </div>

              {/* Éliminer sans confirmation */}
              <div style={{ background:'#f8f9fa', borderRadius:8, padding:12 }}>
                <label style={{ display:'block', fontSize:11, color:'#888', marginBottom:8, fontWeight:600 }}>Éliminer sans confirmation</label>
                <div style={{ display:'flex', gap:10 }}>
                  {['oui','non'].map(v => (
                    <button key={v} onClick={() => setConfig(p=>({...p,eliminerSansConfirmation:v}))}
                      style={{ flex:1, padding:'6px', border:'none', borderRadius:6, background: config.eliminerSansConfirmation===v ? '#1a73e8' : '#e5e7eb', color: config.eliminerSansConfirmation===v ? 'white' : '#333', fontWeight:700, cursor:'pointer', fontSize:13 }}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Toggles */}
            <div style={{ marginTop:16 }}>
              <h3 style={{ fontSize:14, fontWeight:800, color:'#555', marginBottom:12 }}>Options actives</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  ['boulPaBoul',        'Boul pa boul'],
                  ['codeBarres',        'Code-barres (Barcode)'],
                  ['doubleTirage',      'Double tirage'],
                  ['boulARevers',       'Boul à revers'],
                  ['boulPaire',         'Boul paire sèlman'],
                  ['mariageGratuit',    'Mariage gratuit'],
                  ['pointe',            'Pointe'],
                  ['mariageAutomatique','Mariage automatique'],
                  ['loto4Automatique',  'Loto4 automatique'],
                  ['modifierLot',       'Modifye lot'],
                  ['voirFicheGagnant',  'Wè fichè ganyan'],
                  ['reImprimerFiche',   'Reanprime fichè'],
                  ['facade',            'Façade (vitrine)'],
                  ['box',               'Box (kachèt boul)'],
                ].map(([key, label]) => (
                  <div key={key} onClick={() => setConfig(p=>({...p,[key]:!p[key]}))}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8f9fa', borderRadius:8, padding:'10px 14px', cursor:'pointer' }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{label}</span>
                    <div style={{ width:42, height:24, borderRadius:12, background: config[key] ? '#16a34a' : '#ddd', position:'relative', transition:'background 0.2s' }}>
                      <div style={{ position:'absolute', top:2, left: config[key] ? 20 : 2, width:20, height:20, borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SAVE BUTTON */}
            <button onClick={handleSaveConfig} disabled={saving}
              style={{ marginTop:20, width:'100%', padding:'14px', background: saved ? '#16a34a' : '#1a73e8', color:'white', border:'none', borderRadius:8, fontSize:15, fontWeight:800, cursor:'pointer' }}>
              {saving ? 'Sauvegarde...' : saved ? '✅ Configuration sauvegardée !' : '💾 Sauvegarder la configuration'}
            </button>
          </div>
        )}

        {/* ── TAB FACTURES ── */}
        {activeTab === 'factures' && (
          <div style={{ background:'white', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin:'0 0 20px', fontWeight:800, fontSize:18 }}>Factures disponibles</h2>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  {['Date','Montant','Statut','Action'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#555', borderBottom:'2px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={4} style={{ padding:30, textAlign:'center', color:'#999' }}>Okenn fakti disponib</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB TRANSACTIONS ── */}
        {activeTab === 'transactions' && (
          <div style={{ background:'white', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin:'0 0 20px', fontWeight:800, fontSize:18 }}>Historique des transactions</h2>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  {['Date','Type','Montant','Statut'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#555', borderBottom:'2px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={4} style={{ padding:30, textAlign:'center', color:'#999' }}>Okenn tranzaksyon encore</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── TAB LOGS ── */}
        {activeTab === 'logs' && (
          <div style={{ background:'white', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin:'0 0 20px', fontWeight:800, fontSize:18 }}>Log jeux virtuel</h2>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  {['Date','Tirage','Boule','Résultat'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, color:'#555', borderBottom:'2px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={4} style={{ padding:30, textAlign:'center', color:'#999' }}>Okenn log disponib</td></tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </Layout>
  );
}
