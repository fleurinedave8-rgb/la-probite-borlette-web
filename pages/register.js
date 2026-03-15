import { useState } from 'react';

export default function RegisterPage() {
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', password: '', confirm: '' });
  const [photoId, setPhotoId] = useState(null);
  const [photoProfil, setPhotoProfil] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 35, width: '100%', maxWidth: 520, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: 25 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f0f0f0', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🔑</div>
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>LA-PROBITE-BORLETTE</h2>
          <p style={{ color: '#666', fontSize: 13 }}>Créer votre compte</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <div className="form-group">
            <label>Nom *</label>
            <input className="form-control" name="nom" value={form.nom} onChange={handleChange} placeholder="Nom" />
          </div>
          <div className="form-group">
            <label>Prénom *</label>
            <input className="form-control" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Prénom" />
          </div>
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input className="form-control" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
        </div>

        <div className="form-group">
          <label>Téléphone *</label>
          <input className="form-control" name="telephone" value={form.telephone} onChange={handleChange} placeholder="+509 xxxx-xxxx" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <div className="form-group">
            <label>Mot de passe *</label>
            <input className="form-control" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label>Confirmer *</label>
            <input className="form-control" name="confirm" type="password" value={form.confirm} onChange={handleChange} placeholder="••••••••" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
          <div className="form-group">
            <label>Photo ID *</label>
            <input className="form-control" type="file" accept="image/*" onChange={e => setPhotoId(e.target.files[0])} />
            {photoId && <div style={{ marginTop: 5, fontSize: 12, color: '#16a34a' }}>✓ {photoId.name}</div>}
          </div>
          <div className="form-group">
            <label>Photo Profil *</label>
            <input className="form-control" type="file" accept="image/*" onChange={e => setPhotoProfil(e.target.files[0])} />
            {photoProfil && <div style={{ marginTop: 5, fontSize: 12, color: '#16a34a' }}>✓ {photoProfil.name}</div>}
          </div>
        </div>

        <button
          style={{ width: '100%', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 10 }}
          onClick={() => window.location.href = '/dashboard'}
        >
          S'inscrire
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#666', marginTop: 15 }}>
          Déjà inscrit? <a href="/" style={{ color: '#1a73e8', fontWeight: 600 }}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}
