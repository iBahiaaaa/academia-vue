import { defineStore } from 'pinia'
import { supabase } from 'src/boot/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: false,
    initialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.session?.user
  },

  actions: {
    async initialize() {
      try {
        this.loading = true

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Erro ao buscar sessão:', error)
        }

        this.session = data?.session || null
        this.user = data?.session?.user || null

        supabase.auth.onAuthStateChange((_event, session) => {
          this.session = session
          this.user = session?.user || null
        })
      } catch (error) {
        console.error('Erro no initialize auth:', error)
      } finally {
        this.initialized = true
        this.loading = false
      }
    },

    async login(email, password) {
      this.loading = true

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          throw error
        }

        this.session = data.session
        this.user = data.user

        return data
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true

      try {
        const { error } = await supabase.auth.signOut()

        if (error) {
          throw error
        }

        this.session = null
        this.user = null
      } finally {
        this.loading = false
      }
    }
  }
})
