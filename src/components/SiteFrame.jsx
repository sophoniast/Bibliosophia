function SiteFrame({ children, eyebrow, title, fullBleed = false }) {
  return (
    <div className={`page-shell${fullBleed ? ' is-fullbleed' : ''}`}>
      <header className={`site-header glass-panel${fullBleed ? ' is-overlay' : ''}`}>
        <div>
          <div className="section-kicker">{eyebrow}</div>
          <strong style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem' }}>{title}</strong>
        </div>
      </header>
      {children}
    </div>
  )
}

export default SiteFrame
