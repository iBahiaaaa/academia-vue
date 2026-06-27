import { defineStore } from 'pinia'
import { supabase } from 'src/boot/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    profile: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.session?.user,

    perfil: (state) => state.profile?.perfil || null,

    isDev: (state) => state.profile?.perfil === 'dev',

    isSuperAdmin: (state) => state.profile?.perfil === 'super_admin',

    isAdmin: (state) => ['dev', 'super_admin', 'admin'].includes(state.profile?.perfil),

    canManageFuncionarios: (state) =>
      ['dev', 'super_admin', 'admin'].includes(state.profile?.perfil),

    canCreateAdmin: (state) => ['dev', 'super_admin'].includes(state.profile?.perfil),

    canCreateDev: (state) => state.profile?.perfil === 'dev',

    precisaTrocarSenha: (state) => !!state.profile?.precisa_trocar_senha,
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

        if (this.user) {
          await this.loadProfile()
        } else {
          this.profile = null
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          this.session = session
          this.user = session?.user || null

          if (this.user) {
            await this.loadProfile()
          } else {
            this.profile = null
          }
        })
      } catch (error) {
        console.error('Erro no initialize auth:', error)
      } finally {
        this.initialized = true
        this.loading = false
      }
    },

    async loadProfile() {
      if (!this.user?.id) {
        this.profile = null
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .single()

      if (error) {
        throw error
      }

      this.profile = data
    },

    async login(email, password) {
      try {
        this.loading = true

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          throw error
        }

        this.session = data.session
        this.user = data.user

        await this.loadProfile()

        return data
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        this.loading = true

        const { error } = await supabase.auth.signOut()

        if (error) {
          throw error
        }

        this.session = null
        this.user = null
        this.profile = null
        this.initialized = false
      } finally {
        this.loading = false
      }
    },
  },
})
