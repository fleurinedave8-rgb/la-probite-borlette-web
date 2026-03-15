import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function TeteFiche() {
  const [form, setForm]     = useState({ ligne1:'', ligne2:'', ligne3:'', ligne4:'' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  useEffect(() => {
    api.get('/api/admin/tete-fiche').then(r => { if (r.data) setForm(r.data); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/admin/tete-fiche', form);
      setMsg('✅ Tête fiche sove!');
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Erè — eseye ankò'); }
    finally { setSaving(false); }
  };

  return (
    <Layout>
      <div style={{ maxWidth:640, margin:'0 auto' }}>

        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:16, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Tête Fiche</span>
        </div>

        {msg && (
          <div style={{ background: msg.startsWith('✅')?'#dcfce7':'#fee2e2', border:`1px solid ${msg.startsWith('✅')?'#16a34a':'#dc2626'}`, borderRadius:8, padding:12, marginBottom:16, fontWeight:700, color: msg.startsWith('✅')?'#16a34a':'#dc2626' }}>
            {msg}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

          {/* FORMULAIRE */}
          <div style={{ background:'white', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800, fontSize:15 }}>⚙️ Konfigirasyon 4 Liy</h3>
            {[
              ['ligne1', 'Liy 1 — Non Antrepriz', 'LA-PROBITE-BORLETTE'],
              ['ligne2', 'Liy 2 — Adres',          'Port-au-Prince, Haiti'],
              ['ligne3', 'Liy 3 — Telefòn',         'Tel: +509 34 35 9470'],
              ['ligne4', 'Liy 4 — Mesaj',            'Fich sa valid pou 90 jou'],
            ].map(([key, label, placeholder]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#555', marginBottom:5 }}>{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13, boxSizing:'border-box' }}
                />
              </div>
            ))}
            <button onClick={handleSave} disabled={saving}
              style={{ width:'100%', padding:'12px', background:saving?'#ccc':'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:800, fontSize:14, cursor:saving?'not-allowed':'pointer' }}>
              {saving ? '⏳ Ap sove...' : '💾 Sove Tête Fiche'}
            </button>
          </div>

          {/* APERÇU TICKET */}
          <div style={{ background:'white', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800, fontSize:15 }}>👁️ Apèsi Ticket</h3>
            <div style={{ background:'#f8f8f8', border:'1px dashed #aaa', borderRadius:8, padding:16, fontFamily:'monospace', fontSize:12 }}>
              {/* TETE */}
              <div style={{ textAlign:'center', borderBottom:'1px dashed #aaa', paddingBottom:10, marginBottom:10 }}>
                {form.ligne1 && <div style={{ fontWeight:900, fontSize:14 }}>{form.ligne1}</div>}
                {form.ligne2 && <div>{form.ligne2}</div>}
                {form.ligne3 && <div>{form.ligne3}</div>}
                {form.ligne4 && <div style={{ fontSize:10, color:'#666' }}>{form.ligne4}</div>}
                {!form.ligne1 && !form.ligne2 && !form.ligne3 && !form.ligne4 && (
                  <div style={{ color:'#aaa', fontStyle:'italic' }}>Tape liy yo agòch...</div>
                )}
              </div>
              {/* TICKET EXEMPLE */}
              <div style={{ fontSize:11, color:'#444' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>Ticket:</span><span style={{ fontWeight:700 }}>TK-2026-0001</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>Tiraj:</span><span>Florida Matin</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>Dat:</span><span>07/03/2026 08:30</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>Ajan:</span><span>Dave POS-1</span>
                </div>
                <div style={{ borderTop:'1px dashed #aaa', margin:'8px 0', paddingTop:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span>23</span><span>P0</span><span>50 G</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span>45</span><span>P0</span><span>25 G</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span>123</span><span>L3</span><span>100 G</span></div>
                </div>
                <div style={{ borderTop:'1px dashed #aaa', paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:900 }}>
                  <span>TOTAL:</span><span>175 G</span>
                </div>
              </div>
              {/* PIE */}
              <div style={{ borderTop:'1px dashed #aaa', marginTop:10, paddingTop:10, textAlign:'center', fontSize:10, color:'#666' }}>
                {form.ligne4 || 'Fich sa valid pou 90 jou'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
