import { useEffect, useState } from 'react'

import { isSupabaseConfigured, supabase, supabaseConfigError } from '../lib/supabase'

export const useSupabaseAuth = () => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError(supabaseConfigError)
      setLoading(false)
      return undefined
    }

    let active = true

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!active) return

        setSession(data.session ?? null)
        setAuthError('')
      } catch (error) {
        console.error('Failed to restore Supabase session:', error)
        if (active) {
          setAuthError('Supabase sessiyasi tiklanmadi: ' + (error?.message || 'noma’lum xato'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    restoreSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return

      setSession(nextSession ?? null)
      setAuthError('')
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    session,
    loading,
    authError,
  }
}
