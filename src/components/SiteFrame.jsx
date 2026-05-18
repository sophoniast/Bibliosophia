import { Archive, BookOpenText, Compass, Home, PenLine } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Hub', icon: Home },
  { to: '/reader', label: 'Read', icon: BookOpenText },
  { to: '/map', label: 'Map', icon: Compass },
  { to: '/scribe', label: 'Scribe', icon: PenLine },
  { to: '/archive', label: 'Archive', icon: Archive },
]

function SiteFrame({ children, eyebrow, title }) {
  return (
    <div className="page-shell">
      <header className="site-header glass-panel">
        <div>
          <div className="section-kicker">{eyebrow}</div>
          <strong style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem' }}>{title}</strong>
        </div>
        <nav aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `nav-pill${isActive ? ' active' : ''}`}
              to={item.to}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <item.icon size={16} />
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </header>
      {children}
    </div>
  )
}

export default SiteFrame
