import React, { createContext, useContext, useEffect, useState } from 'react'
import { ensureProfile, fetchProfile, signInWithPassword, signOut, signUpWithPassword, updateProfile } from '../services/databaseService'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

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

    let nextProfile = await fetchProfile(authUser.id)
    if (!nextProfile) {
      nextProfile = await ensureProfile({
        userId: authUser.id,
        username: authUser.user_metadata?.username,
        fullName: authUser.user_metadata?.full_name,
        email: authUser.email,
        avatarUrl: authUser.user_metadata?.avatar_url,
      })
    }

    setProfile(nextProfile)
    setUser(buildAuthUser({ user: authUser, profile: nextProfile }))
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    let active = true

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!active) return

        setSession(data.session ?? null)
        await hydrateUser(data.session?.user ?? null)
      } catch (error) {
        console.error('Failed to restore Supabase session:', error)
      } finally {
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
      } finally {
        if (active) setLoading(false)
      }
    })

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

    if (registeredUser?.id && nextSession?.user) {
      await ensureProfile({
        userId: registeredUser.id,
        username,
        fullName,
        email,
        avatarUrl: '',
      })
    }

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
    setUser(buildAuthUser({ user: user.rawUser, profile: freshProfile }))
    return freshProfile
  }

  const saveProfile = async (updates) => {
    if (!user?.id) throw new Error('Authenticated user required.')
    const updated = await updateProfile(user.id, updates)
    setProfile(updated)
    setUser(buildAuthUser({ user: user.rawUser, profile: updated }))
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
