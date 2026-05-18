import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        flowType: 'pkce',
        persistSession: true,
      },
    })
  : null

export async function ensureSupabaseSession() {
  if (!supabase) return null

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw sessionError
  if (session) return session

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw error
  return data.session
}

export function isSignedUpUser(user) {
  if (!user || user.is_anonymous === true) return false

  const provider = user.app_metadata?.provider
  const hasAccountIdentity = Boolean(user.email || user.phone)
  const hasExternalProvider = Boolean(provider && provider !== 'anonymous')

  return hasAccountIdentity || hasExternalProvider
}
