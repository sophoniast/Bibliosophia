import { LockKeyhole, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function AuthGate({ children, featureName = 'this feature', onOpenAuth }) {
  const { isLoading, isSignedUp } = useAuth()

  if (isLoading) {
    return <div className="auth-gate glass-panel">Checking account access...</div>
  }

  if (isSignedUp) return children

  return (
    <section className="auth-gate glass-panel">
      <LockKeyhole size={26} />
      <h2>{featureName} is for signed-up users</h2>
      <p>Create an account to unlock Dictionary, Concordance, Maps, and Commentaries.</p>
      <button className="auth-submit" onClick={onOpenAuth} type="button">
        <UserPlus size={17} />
        Sign Up
      </button>
    </section>
  )
}

export default AuthGate
