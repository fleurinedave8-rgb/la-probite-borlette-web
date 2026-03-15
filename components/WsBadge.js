/**
 * WsBadge — Badge ki montre statut koneksyon reyèl-tan
 */
export default function WsBadge({ live, count = 0, label = 'Tan Reyèl' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{
        width:9, height:9, borderRadius:'50%',
        background: live ? '#4ade80' : '#f87171',
        boxShadow: live ? '0 0 8px #4ade80' : 'none',
        flexShrink:0,
      }} />
      <span style={{
        fontSize:11, fontWeight:700,
        color: live ? '#4ade80' : '#f87171',
      }}>
        {live ? `${label} 🟢` : 'Offline 🔴'}
      </span>
      {count > 0 && (
        <span style={{
          background:'#f59e0b', color:'#111',
          borderRadius:20, padding:'1px 8px',
          fontSize:10, fontWeight:900,
        }}>
          +{count}
        </span>
      )}
    </div>
  );
}
