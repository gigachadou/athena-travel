import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

const isValidSupabaseUrl = (value) => {
  if (!value) return false

  try {
    const parsed = new URL(value)
    return /^https?:$/.test(parsed.protocol)
  } catch {
    return false
  }
}

export const isSupabaseConfigured = Boolean(isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey)
export const supabaseConfigError = isSupabaseConfigured
  ? ''
  : "Supabase sozlamalari topilmadi yoki noto'g'ri. `.env` ichidagi `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` ni tekshiring."
export const supabaseProjectUrl = supabaseUrl || ''

// Singleton pattern - faqat bir marta yaratiladi
let supabaseInstance = null

const createSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'athena-travel-auth',
    },
    global: {
      headers: {
        'x-client-info': 'athena-travel@1.0.0',
        'Content-Type': 'application/json',
      },
    },
    db: {
      schema: 'public',
    },
    // Fetch options for better reliability
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'omit',
      })
    },
  })

  return supabaseInstance
}

export const supabase = isSupabaseConfigured ? createSupabaseClient() : null
