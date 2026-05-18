/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { hasSupabaseEnv, isSignedUpUser, supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const OAUTH_PROVIDER_LABELS = {
  azure: 'Microsoft',
  bitbucket: 'Bitbucket',
  discord: 'Discord',
  facebook: 'Facebook',
  github: 'GitHub',
  gitlab: 'GitLab',
  google: 'Google',
}

const configuredOAuthProviders = String(import.meta.env.VITE_AUTH_OAUTH_PROVIDERS || 'google,github')
  .split(',')
  .map((provider) => provider.trim().toLowerCase())
  .filter(Boolean)
  .map((id) => ({ id, label: OAUTH_PROVIDER_LABELS[id] || id }))

function getRedirectUrl() {
  if (typeof window === 'undefined') return undefined
  return window.location.origin
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(() => hasSupabaseEnv)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!isMounted) return
        if (!error) setSession(data.session)
        setIsLoading(false)
      })
      .catch(() => {
        if (isMounted) setIsLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    const user = session?.user || null
    const isSignedUp = isSignedUpUser(user)

    return {
      hasAuth: hasSupabaseEnv,
      isLoading,
      isSignedUp,
      session,
      user,
      oauthProviders: configuredOAuthProviders,
      async signIn(email, password) {
        if (!supabase) throw new Error('Supabase is not configured for account access yet.')
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setSession(data.session)
        return data
      },
      async signOut() {
        if (!supabase) return
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setSession(null)
      },
      async signUp(email, password) {
        if (!supabase) throw new Error('Supabase is not configured for account access yet.')

        const currentUser = session?.user
        if (currentUser && !isSignedUpUser(currentUser)) {
          await supabase.auth.signOut()
          setSession(null)
        }

        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSession(data.session)
        return data
      },
      async signInWithProvider(provider) {
        if (!supabase) throw new Error('Supabase is not configured for SSO yet.')
        if (session?.user && !isSignedUpUser(session.user)) {
          await supabase.auth.signOut()
          setSession(null)
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: getRedirectUrl(),
          },
        })
        if (error) throw error
        return data
      },
      async signInWithSso(domain) {
        if (!supabase) throw new Error('Supabase is not configured for enterprise SSO yet.')
        const normalizedDomain = String(domain || '').trim().toLowerCase()
        if (!normalizedDomain) throw new Error('Enter your organization domain.')
        if (session?.user && !isSignedUpUser(session.user)) {
          await supabase.auth.signOut()
          setSession(null)
        }

        const { data, error } = await supabase.auth.signInWithSSO({
          domain: normalizedDomain,
          options: {
            redirectTo: getRedirectUrl(),
          },
        })

        if (error) throw error
        if (data?.url) window.location.assign(data.url)
        return data
      },
    }
  }, [isLoading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider.')
  return value
}
