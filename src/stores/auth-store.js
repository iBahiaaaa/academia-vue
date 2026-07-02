import { defineStore } from 'pinia'

import { apiRequest, getAccessToken, setAccessToken } from 'src/services/api-client'

function mapUserToProfile(user) {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    tenant_id: user.tenantId,
    filial_id: user.filialId,
    cliente_id: user.clienteId,
    precisa_trocar_senha: user.precisaTrocarSenha,
  }
}

function mapUserToSession(user, accessToken) {
  if (!user || !accessToken) {
    return null
  }

  return {
    access_token: accessToken,
    user: {
      id: user.id,
      email: user.email,
    },
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    profile: null,
    accessToken: getAccessToken(),
    loading: false,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,

    perfil: (state) => state.profile?.perfil || null,

    canAccessAdmin: (state) =>
      ['dev', 'super_admin', 'admin', 'instrutor', 'recepcao', 'financeiro'].includes(
        state.profile?.perfil,
      ),

    isDev: (state) => state.profile?.perfil === 'dev',

    isSuperAdmin: (state) => state.profile?.perfil === 'super_admin',

    isAdmin: (state) => ['dev', 'super_admin', 'admin'].includes(state.profile?.perfil),

    canAccessClientes: (state) =>
      ['dev', 'super_admin', 'admin', 'instrutor', 'recepcao'].includes(state.profile?.perfil),

    canAccessTreinos: (state) =>
      ['dev', 'super_admin', 'admin', 'instrutor'].includes(state.profile?.perfil),

    canAccessPagamentos: (state) =>
      ['dev', 'super_admin', 'admin', 'recepcao', 'financeiro'].includes(state.profile?.perfil),

    canAccessConfiguracoes: (state) =>
      ['dev', 'super_admin', 'admin'].includes(state.profile?.perfil),

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

        if (this.accessToken) {
          try {
            await this.loadProfile()
            return
          } catch {
            this.clearAuthState()
          }
        }

        try {
          const data = await apiRequest('/auth/refresh', {
            method: 'POST',
            body: {},
          })

          this.applyAuthResult(data)
        } catch {
          this.clearAuthState()
        }
      } catch (error) {
        console.error('Erro no initialize auth:', error)
        this.clearAuthState()
      } finally {
        this.initialized = true
        this.loading = false
      }
    },

    async loadProfile() {
      const user = await apiRequest('/auth/me')

      this.user = {
        id: user.id,
        email: user.email,
      }
      this.profile = mapUserToProfile(user)
      this.session = mapUserToSession(user, this.accessToken)
    },

    async login(email, password) {
      try {
        this.loading = true

        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: {
            email,
            password,
          },
        })

        this.applyAuthResult(data)

        if (this.profile?.perfil === 'aluno') {
          await this.logout()
          throw new Error('Este e-mail pertence a um aluno e nao tem acesso ao painel administrativo')
        }

        if (!this.canAccessAdmin) {
          await this.logout()
          throw new Error('Este usuario nao tem acesso ao painel administrativo')
        }

        return data
      } finally {
        this.loading = false
      }
    },

    async changePassword(currentPassword, newPassword) {
      await apiRequest('/auth/password', {
        method: 'PATCH',
        body: {
          currentPassword,
          newPassword,
        },
      })

      await this.loadProfile()
    },

    async logout() {
      try {
        this.loading = true

        try {
          await apiRequest('/auth/logout', {
            method: 'POST',
            body: {},
          })
        } finally {
          this.clearAuthState()
          this.initialized = false
        }
      } finally {
        this.loading = false
      }
    },

    applyAuthResult(data) {
      this.accessToken = data.accessToken
      setAccessToken(data.accessToken)

      this.user = {
        id: data.user.id,
        email: data.user.email,
      }
      this.profile = mapUserToProfile(data.user)
      this.session = mapUserToSession(data.user, data.accessToken)
    },

    clearAuthState() {
      this.accessToken = ''
      setAccessToken('')
      this.session = null
      this.user = null
      this.profile = null
    },
  },
})
