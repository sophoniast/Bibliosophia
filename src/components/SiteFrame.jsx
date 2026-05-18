import { BookOpenText, Compass, Home, LogOut, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthDialog from './AuthDialog'

const navItems = [
  { to: '/', label: 'Hub', icon: Home },
  { to: '/map', label: 'Map Reader', icon: Compass },
  { to: '/reader', label: 'Bible Reader', icon: BookOpenText },
]

function SiteFrame({ children, eyebrow, title }) {
  const { isSignedUp, signOut, user } = useAuth()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

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
          {isSignedUp ? (
            <button className="nav-pill nav-auth-button" onClick={signOut} title={user?.email || 'Sign out'} type="button">
              <LogOut size={16} />
              Sign Out
            </button>
          ) : (
            <button className="nav-pill nav-auth-button" onClick={() => setIsAuthDialogOpen(true)} type="button">
              <UserPlus size={16} />
              Sign Up
            </button>
          )}
        </nav>
      </header>
      {children}
      {isAuthDialogOpen ? (
        <AuthDialog featureName="study tools" onClose={() => setIsAuthDialogOpen(false)} />
      ) : null}
    </div>
  )
}

export default SiteFrame
