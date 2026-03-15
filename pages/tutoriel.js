import Layout from '../components/Layout';
import { useState } from 'react';

const videos = [
  { id: 1, title: 'Koman pouw konekte', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { id: 2, title: 'Koman kreye yon fich', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
  { id: 3, title: 'Koman itilize rapò', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
];

export default function Tutoriel() {
  const [current, setCurrent] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card">
      <div style={{ marginBottom: 15 }}>
        <input
          className="form-control"
          placeholder="🔍 Rechercher une vidéo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length > 0 && (
        <div style={{ background: '#f0f4ff', borderRadius: 8, padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 80, height: 60, background: '#ddd', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶️</div>
          <span style={{ fontWeight: 600 }}>{filtered[current]?.title}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <button className="btn btn-outline-primary" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>
          ◀ Précédent
        </button>
        <button className="btn btn-outline-primary" onClick={() => setCurrent(c => Math.min(filtered.length - 1, c + 1))} disabled={current >= filtered.length - 1}>
          Suivant ▶
        </button>
      </div>

      {filtered[current] && (
        <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9' }}>
          <iframe
            width="100%"
            height="100%"
            src={filtered[current].url}
            title={filtered[current].title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ display: 'block' }}
          />
        </div>
      )}
    </div>
  );
}
