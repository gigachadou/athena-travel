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
      setLoading(false)
      return undefined
    }

    let active = true
    let initialized = false

    const handleSessionUpdate = async (nextSession) => {
      if (!active) return
      setSession(nextSession ?? null)
      try {
        await hydrateUser(nextSession?.user ?? null)
      } catch (error) {
        console.error('Failed to hydrate authenticated user:', error)
      }
      if (!initialized) {
        initialized = true
        setLoading(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return
      await handleSessionUpdate(nextSession)
    })

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!active) return

        await handleSessionUpdate(data.session)
      } catch (error) {
        console.error('Failed to restore Supabase session:', error)
      } finally {
        if (!initialized && active) {
          initialized = true
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async ({ identifier, password }) => {
    const { user: authenticatedUser, session: nextSession } = await signInWithPassword({
      identifier,
      password,
    })

    const authUser = nextSession?.user ?? authenticatedUser
    setSession(nextSession ?? null)
    await hydrateUser(authUser)
    return authUser
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
