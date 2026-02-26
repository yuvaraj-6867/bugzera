const BLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div style={{ position: 'relative', width: '130px', height: '130px' }}>

      {/* Blurred glow behind ring */}
      <div
        className="animate-spin"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #ff4500, #ff7700, #ffcc00, #00ffaa, #00aaff, #7744ff, #ff22bb, #ff4500)',
          filter: 'blur(10px)',
          opacity: 0.45,
          animationDuration: '3s',
        }}
      />

      {/* Rainbow ring - spinning */}
      <div
        className="animate-spin"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #ff4500, #ff7700, #ffcc00, #00ffaa, #00aaff, #7744ff, #ff22bb, #ff4500)',
          animationDuration: '3s',
        }}
      >
        {/* Inner dark mask to create ring shape */}
        <div style={{
          position: 'absolute',
          inset: '5px',
          borderRadius: '50%',
          background: '#0d0d14',
        }} />
      </div>

      {/* Top dot - orange */}
      <div style={{
        position: 'absolute', top: '5px', left: '50%',
        transform: 'translateX(-50%)',
        width: '10px', height: '10px', borderRadius: '50%',
        background: '#ff8800',
        boxShadow: '0 0 8px 3px rgba(255,136,0,0.85)',
        zIndex: 20,
      }} />

      {/* Right dot - cyan */}
      <div style={{
        position: 'absolute', right: '5px', top: '50%',
        transform: 'translateY(-50%)',
        width: '10px', height: '10px', borderRadius: '50%',
        background: '#00ccff',
        boxShadow: '0 0 8px 3px rgba(0,204,255,0.85)',
        zIndex: 20,
      }} />

      {/* Bottom dot - orange-red */}
      <div style={{
        position: 'absolute', bottom: '5px', left: '50%',
        transform: 'translateX(-50%)',
        width: '10px', height: '10px', borderRadius: '50%',
        background: '#ff5500',
        boxShadow: '0 0 8px 3px rgba(255,85,0,0.85)',
        zIndex: 20,
      }} />

      {/* Left dot - pink-red */}
      <div style={{
        position: 'absolute', left: '5px', top: '50%',
        transform: 'translateY(-50%)',
        width: '10px', height: '10px', borderRadius: '50%',
        background: '#ff2266',
        boxShadow: '0 0 8px 3px rgba(255,34,102,0.85)',
        zIndex: 20,
      }} />

      {/* Center B letter */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10,
      }}>
        <span style={{
          fontSize: '3.75rem',
          fontWeight: '900',
          lineHeight: 1,
          background: 'linear-gradient(170deg, #ff7733 0%, #ff3355 55%, #cc33ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          userSelect: 'none',
        }}>B</span>
      </div>

    </div>
  </div>
)

export default BLoader
