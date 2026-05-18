function LexiconTooltip({ entry, position }) {
  if (!entry || !position) return null

  return (
    <div
      className="tooltip-card glass-panel"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="mono-label" style={{ color: 'rgba(var(--c-accent), 0.88)', fontSize: '0.72rem' }}>
        {entry.strongs} · {entry.translit}
      </div>
      <h4>{entry.lemma}</h4>
      <p>{entry.def}</p>
    </div>
  )
}

export default LexiconTooltip
