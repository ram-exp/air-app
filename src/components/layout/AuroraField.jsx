// Signature ambient visual: soft drifting aurora blobs behind the glass UI.
export default function AuroraField() {
  return (
    <div className="aurora-field" aria-hidden="true">
      <div className="aurora-blob" style={{ width: 480, height: 480, top: '-10%', left: '-8%', background: 'radial-gradient(circle, #5A4FFF, transparent 70%)' }} />
      <div className="aurora-blob" style={{ width: 420, height: 420, top: '20%', right: '-10%', background: 'radial-gradient(circle, #2FD9C4, transparent 70%)', animationDelay: '-8s' }} />
      <div className="aurora-blob" style={{ width: 380, height: 380, bottom: '-12%', left: '20%', background: 'radial-gradient(circle, #FFB648, transparent 70%)', animationDelay: '-14s' }} />
    </div>
  )
}
