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

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
