import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function LicencePOS() {
  const [pos,     setPos]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');
  const [modal,   setModal]   = useState(null); // pos seleksyone

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/licence/all');
      setPos(Array.isArray(r.data) ? r.data : []);
    } catch { setMsg('❌ Erè chajman'); }
    setLoading(false);
  };

  const handleRenouvle = async (posId, duree) => {
    try {
      await api.put(`/api/licence/pos/${posId}`, { duree: parseInt(duree), type: 'mensuel' });
      setMsg(`✅ Lisans renouvle pou ${duree} jou`);
      setModal(null);
      load();
    } catch { setMsg('❌ Erè renouvèlman'); }
    setTimeout(() => setMsg(''), 4000);
  };

  const STATUT_STYLE = {
    expire:         { bg: '#fee2e2', color: '#dc2626', label: '❌ EKSPIRE' },
    expirantBiento: { bg: '#fef3c7', color: '#d97706', label: '⚠️ BIENTO' },
    valid:          { bg: '#dcfce7', color: '#16a34a', label: '✅ VALID' },
    sanLicence:     { bg: '#f1f5f9', color: '#64748b', label: '— SAN LISANS' },
  };

  const expire  = pos.filter(p => p.statutLicence === 'expire');
  const biento  = pos.filter(p => p.statutLicence === 'expirantBiento');
  const valid   = pos.filter(p => p.statutLicence === 'valid');
  const sanLic  = pos.filter(p => p.statutLicence === 'sanLicence');

  return (
    <Layout>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#1a73e8)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, color: '#fff' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🔑 Jesyon Lisans POS</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>Kontwole ekspirasyon ak aksè chak POS</div>
        </div>

        {/* Résumé */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { l: 'Total POS',    v: pos.length,    c: '#1a73e8' },
            { l: '✅ Valid',     v: valid.length,  c: '#16a34a' },
            { l: '⚠️ Biento',   v: biento.length, c: '#d97706' },
            { l: '❌ Ekspire',   v: expire.length, c: '#dc2626' },
            { l: '— San Lisans', v: sanLic.length, c: '#64748b' },
          ].map(x => (
            <div key={x.l} style={{ background: '#fff', borderRadius: 10, padding: '12px 18px', borderLeft: `4px solid ${x.c}`, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: x.c }}>{x.v}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{x.l}</div>
            </div>
          ))}
        </div>

        {msg && <div style={{ padding: '10px 16px', background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2', borderRadius: 8, marginBottom: 16, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{msg}</div>}

        {/* Alertes urgentes */}
        {(expire.length > 0 || biento.length > 0) && (
          <div style={{ background: '#fef3c7', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #fde68a' }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8 }}>⚠️ Atansyon — POS ki bezwen renouvèlman</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[...expire, ...biento].map(p => (
                <button key={p._id} onClick={() => setModal(p)}
                  style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: p.statutLicence === 'expire' ? '#dc2626' : '#d97706', color: '#fff', border: 'none' }}>
                  {p.nom} ({p.jousReste !== null && p.jousReste <= 0 ? 'Ekspire' : `${p.jousReste}j`})
                </button>
              ))}
            </div>
          </div>
        )}

        {loading
          ? <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>⏳ Chajman...</div>
          : (
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  {['POS / Non', 'Statut', 'Ekspirasyon', 'Jou Rete', 'Tip Lisans', 'Aksyon'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {pos.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Pa gen POS anrejistre</td></tr>
                    : pos.map((p, i) => {
                      const style = STATUT_STYLE[p.statutLicence] || STATUT_STYLE.sanLicence;
                      return (
                        <tr key={p._id} style={{ borderTop: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nom || p.posId}</div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>{p.posId}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: style.bg, color: style.color }}>
                              {style.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#555', fontSize: 13 }}>
                            {p.licence?.expiration ? new Date(p.licence.expiration).toLocaleDateString('fr') : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700,
                            color: !p.jousReste ? '#aaa' : p.jousReste <= 0 ? '#dc2626' : p.jousReste <= 7 ? '#d97706' : '#16a34a' }}>
                            {p.jousReste !== null ? `${p.jousReste} jou` : '—'}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>
                            {p.licence?.type || '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => setModal(p)}
                              style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              🔄 Renouvle
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* Modal Renouvèlman */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360, maxWidth: '95vw', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>🔑 Renouvle Lisans</h3>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>POS: <strong>{modal.nom || modal.posId}</strong></p>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                { duree: 7,    label: '7 jou — Esè',        color: '#64748b' },
                { duree: 30,   label: '30 jou — 1 Mwa',     color: '#1a73e8', popular: true },
                { duree: 90,   label: '90 jou — 3 Mwa',     color: '#16a34a' },
                { duree: 180,  label: '180 jou — 6 Mwa',    color: '#7c3aed' },
                { duree: 365,  label: '365 jou — 1 Ane',    color: '#ea580c' },
                { duree: 9999, label: '♾️ Illimité',         color: '#dc2626' },
              ].map(opt => (
                <button key={opt.duree} onClick={() => handleRenouvle(modal._id, opt.duree)} style={{
                  padding: '12px 18px', background: opt.popular ? opt.color : '#f8fafc',
                  color: opt.popular ? '#fff' : opt.color, border: `2px solid ${opt.color}`,
                  borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  {opt.label}
                  {opt.popular && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 10 }}>Rekòmande</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setModal(null)} style={{ width: '100%', marginTop: 12, padding: '10px 0', background: 'transparent', color: '#aaa', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>
              Anile
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
