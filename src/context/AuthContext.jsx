import React, { createContext, useContext, useEffect, useState } from 'react'
import { fetchProfile, signInWithPassword, signOut, signUpWithPassword, updateProfile } from '../services/databaseService'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

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
  const { session, loading: sessionLoading, authError } = useSupabaseAuth()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const hydrateUser = async (authUser) => {
    if (!authUser) {
      setUser(null)
      setProfile(null)
      return
    }

    setUser(buildAuthUser({ user: authUser, profile: null }))
    setProfile(null)

    fetchProfile(authUser.id)
      .then((nextProfile) => {
        setProfile(nextProfile)
        setUser(buildAuthUser({ user: authUser, profile: nextProfile }))
      })
      .catch((err) => {
        console.error('Error hydrating user:', err)
      })
  }

  const clearAuthTimeout = () => {}

  const updateAuthState = async (nextSession) => {
    setSession(nextSession ?? null)
    try {
      await hydrateUser(nextSession?.user ?? null)
      setAuthError('')
    } catch (error) {
      console.error('Failed to update auth state:', error)
      setAuthError("Autentifikatsiya holatini yangilab bo'lmadi.")
    }
  }

  useEffect(() => {
    let active = true
    setProfileLoading(true)

    const syncUser = async () => {
      await hydrateUser(session?.user ?? null)
      if (active) setProfileLoading(false)
    }

    syncUser()

    return () => {
      active = false
    }
  }, [session])

  const login = async ({ identifier, password }) => {
    const { user: authenticatedUser, session: nextSession } = await signInWithPassword({ identifier, password })
    const authUser = nextSession?.user ?? authenticatedUser
    await hydrateUser(authUser)
    return authUser
  }

  const register = async ({ email, password, username, fullName }) => {
    try {
      const { user: registeredUser, session: nextSession } = await signUpWithPassword({ email, password, username, fullName })

      if (nextSession?.user) {
        await hydrateUser(nextSession.user)
      }

      return { user: registeredUser, session: nextSession }
    } catch (error) {
      if (error.message.includes('Signups not allowed for this instance') || error.message.includes('Email signups are disabled')) {
        throw new Error('Ro\'yxatdan o\'tish hozircha mavjud emas. Iltimos, qo\'llab-quvvatlash xizmatiga murojaat qiling.');
      }
      if (error.message.includes('User already registered')) {
        throw new Error('Bu email allaqachon ro\'yxatdan o\'tgan. Iltimos, login sahifasiga o\'ting.');
      }
      throw error;
    }
  }

  const refreshProfile = async () => {
    if (!user?.id) return null
    try {
      const freshProfile = await fetchProfile(user.id)
      setProfile(freshProfile)
      setUser(buildAuthUser({ user: mergeRawUserMetadata(user.rawUser, freshProfile), profile: freshProfile }))
      return freshProfile
    } catch (err) {
      console.error('Error refreshing profile:', err)
      throw err
    }
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
    setUser(null)
    setProfile(null)
  }

  const loading = sessionLoading || profileLoading

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
