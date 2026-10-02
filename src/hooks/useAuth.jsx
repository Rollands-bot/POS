import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // Profil (role) disimpan bersama userId pemiliknya, supaya ketahuan kapan masih loading
  const [profileState, setProfileState] = useState({ userId: null, profile: null, error: null })
  const [profileReloadKey, setProfileReloadKey] = useState(0)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id ?? null

  // Ambil role user dari tabel profiles setiap kali user berganti
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Gagal memuat profil:', error)
        setProfileState({ userId, profile: data ?? null, error: error?.message ?? null })
      })

    return () => {
      cancelled = true
    }
  }, [userId, profileReloadKey])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = useCallback(() => setProfileReloadKey(k => k + 1), [])

  const profileLoading = Boolean(userId) && profileState.userId !== userId
  const profile = userId && profileState.userId === userId ? profileState.profile : null
  const profileError = userId && profileState.userId === userId ? profileState.error : null

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signOut,
        profile,
        role: profile?.role ?? null,
        profileLoading,
        profileError,
        refreshProfile,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
