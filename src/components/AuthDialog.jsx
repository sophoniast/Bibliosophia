import { useState } from 'react'
import { Building2, CheckCircle2, LogIn, ShieldCheck, UserPlus, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 12 characters', test: (password) => password.length >= 12 },
  { id: 'lower', label: 'One lowercase letter', test: (password) => /[a-z]/.test(password) },
  { id: 'upper', label: 'One uppercase letter', test: (password) => /[A-Z]/.test(password) },
  { id: 'number', label: 'One number', test: (password) => /\d/.test(password) },
  { id: 'symbol', label: 'One symbol', test: (password) => /[^A-Za-z0-9]/.test(password) },
  { id: 'spaces', label: 'No spaces', test: (password) => !/\s/.test(password) },
  {
    id: 'email',
    label: 'Does not include your email name',
    test: (password, email) => {
      const emailName = String(email || '').split('@')[0]?.toLowerCase()
      return !emailName || emailName.length < 3 || !password.toLowerCase().includes(emailName)
    },
  },
]

function getPasswordChecks(password, email) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    isValid: rule.test(password, email),
  }))
}

function AuthDialog({ featureName = 'this study tool', onClose }) {
  const { hasAuth, oauthProviders, signIn, signInWithProvider, signInWithSso, signUp } = useAuth()
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ssoDomain, setSsoDomain] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordChecks = getPasswordChecks(password, email)
  const isPasswordStrong = passwordChecks.every((rule) => rule.isValid)

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('')

    if (mode === 'signup' && !isPasswordStrong) {
      setStatus('Use a stronger password before creating your account.')
      return
    }

    setIsSubmitting(true)

    try {
      let shouldClose = false
      if (mode === 'signin') {
        await signIn(email, password)
        setStatus('Signed in.')
        shouldClose = true
      } else {
        const result = await signUp(email, password)
        setStatus(result.session ? 'Account ready.' : 'Check your email to confirm your account.')
        shouldClose = Boolean(result.session)
      }
      if (shouldClose && onClose) window.setTimeout(onClose, 450)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Account access failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleProviderLogin(provider) {
    setStatus('')
    setIsSubmitting(true)

    try {
      await signInWithProvider(provider)
      setStatus('Redirecting to your provider...')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Provider login failed.')
      setIsSubmitting(false)
    }
  }

  async function handleSsoSubmit(event) {
    event.preventDefault()
    setStatus('')
    setIsSubmitting(true)

    try {
      await signInWithSso(ssoDomain)
      setStatus('Redirecting to your organization...')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'SSO login failed.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-dialog-backdrop" role="presentation">
      <section className={`auth-dialog auth-dialog-${mode}`} role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title">
        <button className="auth-dialog-close" onClick={onClose} type="button" aria-label="Close account dialog">
          ×
        </button>

        <div className="auth-form-pane">
          <div className="auth-form-head">
            <div className="section-kicker">Account Access</div>
            <h2 id="auth-dialog-title">{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
            <p>
              {mode === 'signin'
                ? `Welcome back. Sign in to continue using ${featureName}.`
                : `Sign up to unlock ${featureName} with secure account access.`}
            </p>
          </div>

          {hasAuth ? (
            <>
              <div className="auth-provider-grid">
                {oauthProviders.map((provider) => (
                  <button
                    className="auth-provider-button"
                    disabled={isSubmitting}
                    key={provider.id}
                    onClick={() => handleProviderLogin(provider.id)}
                    type="button"
                  >
                    <LogIn size={16} />
                    Continue with {provider.label}
                  </button>
                ))}
              </div>

              <div className="auth-divider"><span>or use email</span></div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  Email
                  <input
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label>
                  Password
                  <input
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    minLength={mode === 'signup' ? 12 : 1}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                {mode === 'signup' ? (
                  <div className="password-rules" aria-live="polite">
                    <div className="password-rules-heading">
                      <ShieldCheck size={15} />
                      Strong password required
                    </div>
                    {passwordChecks.map((rule) => (
                      <div className={`password-rule ${rule.isValid ? 'valid' : ''}`} key={rule.id}>
                        {rule.isValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {rule.label}
                      </div>
                    ))}
                  </div>
                ) : null}
                <button className="auth-submit" disabled={isSubmitting || (mode === 'signup' && !isPasswordStrong)} type="submit">
                  {mode === 'signin' ? <LogIn size={17} /> : <UserPlus size={17} />}
                  {isSubmitting ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
                <button className="auth-inline-toggle" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} type="button">
                  {mode === 'signin' ? 'Need an account? Sign up' : 'Already signed up? Sign in'}
                </button>
              </form>

              <form className="auth-sso-form" onSubmit={handleSsoSubmit}>
                <label>
                  Organization SSO
                  <span>
                    <input
                      autoComplete="organization"
                      onChange={(event) => setSsoDomain(event.target.value)}
                      placeholder="company.com"
                      type="text"
                      value={ssoDomain}
                    />
                    <button disabled={isSubmitting} type="submit">
                      <Building2 size={16} />
                      SSO
                    </button>
                  </span>
                </label>
              </form>

              <div className="auth-status" aria-live="polite">{status}</div>
            </>
          ) : (
            <div className="auth-status">
              Supabase env vars are needed before account signup can run in this environment.
            </div>
          )}
        </div>

        <aside className="auth-switch-pane">
          <div className="auth-switch-content">
            <div className="auth-switch-mark">B</div>
            <h3>{mode === 'signin' ? 'New here?' : 'Welcome back'}</h3>
            <p>
              {mode === 'signin'
                ? 'Create an account to unlock maps, concordance, dictionary, and commentaries.'
                : 'Already have an account? Return through the same secure doorway.'}
            </p>
            <button className="auth-mode-toggle" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} type="button">
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default AuthDialog
