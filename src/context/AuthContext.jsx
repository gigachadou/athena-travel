import React, { createContext, useContext, useEffect, useState } from 'react'
import { fetchProfile, signInWithPassword, signOut, signUpWithPassword, updateProfile } from '../services/databaseService'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const mergeRawUserMetadata = (rawUser, profile) => {
  if (!rawUser) return rawUser

  return {
    ...rawUser,
    email: profile?.email || rawUser.email || '',
    user_metadata: {
      ...rawUser.user_metadata,
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || '',
    },
  }
}

const buildAuthUser = ({ user, profile }) => {
  if (!user) return null

  return {
    id: user.id,
    email: profile?.email || user.email || '',
    username: profile?.username || user.user_metadata?.username || '',
    fullName: profile?.full_name || user.user_metadata?.full_name || '',
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || '',
    profile,
    rawUser: user,
  }
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const hydrateUser = async (authUser) => {
    if (!authUser) {
      setSession(null)
      setUser(null)
      setProfile(null)
      return
    }

    const nextProfile = await fetchProfile(authUser.id)

    setProfile(nextProfile)
    setUser(buildAuthUser({ user: authUser, profile: nextProfile }))
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthError('Supabase sozlamalari topilmadi yoki noto‘g‘ri. Iltimos, .env faylini tekshiring.')
      setLoading(false)
      return undefined
    }

    let active = true
    let timeoutId = window.setTimeout(() => {
      if (active) {
        setAuthError('Supabase javob bermayapti. Internet va supabase konfiguratsiyasini tekshiring.')
        setLoading(false)
      }
    }, 12000)

    const clearAuthTimeout = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!active) return

        setSession(data.session ?? null)
        await hydrateUser(data.session?.user ?? null)
      } catch (error) {
        console.error('Failed to restore Supabase session:', error)
        if (active) setAuthError('Supabase sessiyasi tiklanmadi: ' + (error?.message || 'noma’lum xato'))
      } finally {
        clearAuthTimeout()
        if (active) setLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return
      setSession(nextSession ?? null)
      try {
        await hydrateUser(nextSession?.user ?? null)
      } catch (error) {
        console.error('Failed to hydrate authenticated user:', error)
        if (active) setAuthError('Foydalanuvchi maʼlumotlari yangilanmadi: ' + (error?.message || 'noma’lum xato'))
      } finally {
        clearAuthTimeout()
        if (active) setLoading(false)
      }
    })

    return () => {
      active = false
      clearAuthTimeout()
      subscription.unsubscribe()
    }
  }, [])

  const login = async ({ identifier, password }) => {
    const { user: authenticatedUser, session: nextSession } = await signInWithPassword({
      identifier,
      password,
    })
    setSession(nextSession ?? null)
    await hydrateUser(authenticatedUser)
    return authenticatedUser
  }

  const register = async ({ email, password, username, fullName }) => {
    const { user: registeredUser, session: nextSession } = await signUpWithPassword({
      email,
      password,
      username,
      fullName,
    })

    if (nextSession?.user) {
      setSession(nextSession)
      await hydrateUser(nextSession.user)
    }

    return { user: registeredUser, session: nextSession }
  }

  const refreshProfile = async () => {
    if (!user?.id) return null
    const freshProfile = await fetchProfile(user.id)
    setProfile(freshProfile)
    setUser(buildAuthUser({ user: mergeRawUserMetadata(user.rawUser, freshProfile), profile: freshProfile }))
    return freshProfile
  }

  const saveProfile = async (updates) => {
    if (!user?.id) throw new Error('Authenticated user required.')
    const updated = await updateProfile(user.id, updates)
    setProfile(updated)
    setUser(buildAuthUser({ user: mergeRawUserMetadata(user.rawUser, updated), profile: updated }))
    return updated
  }

  const logout = async () => {
    await signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user),
        login,
        loading,
        authError,
        profile,
        refreshProfile,
        register,
        saveProfile,
        session,
        user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
