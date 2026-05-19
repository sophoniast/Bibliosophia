function SiteFrame({ children, eyebrow, title }) {
  return (
    <div className="page-shell">
      <header className="site-header glass-panel">
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
