import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  initialized: boolean
  init: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  initialized: false,
  init: async () => {
    if (get().initialized) return
    set({ loading: true })
    const { data } = await supabase.auth.getSession()
    set({
      session: data.session ?? null,
      user: data.session?.user ?? null,
      loading: false,
      initialized: true,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session: session ?? null,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      })
    })
  },
  signOut: async () => {
    await supabase.auth.signOut()
  },
}))
