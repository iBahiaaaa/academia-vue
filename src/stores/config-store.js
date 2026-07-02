import { defineStore } from 'pinia'
import { setCssVar, Dark } from 'quasar'
import { apiRequest, getAccessToken } from 'src/services/api-client'

export const useConfigStore = defineStore('config', {
  state: () => ({
    loading: false,
    initialized: false,
    config: {
      id: 1,
      nome_academia: 'Bahia Gym',
      slogan: 'Gestão inteligente para academia',
      cor_primaria: '#1976D2',
      cor_secundaria: '#26A69A',
      cor_acento: '#9C27B0',
      tema: 'light',
      valor_mensalidade: 0,
      dias_vencimento_padrao: 30,
      whatsapp: '',
      email: '',
      endereco: ''
    }
  }),

  getters: {
    nomeAcademia: (state) => state.config.nome_academia || 'Bahia Gym',
    slogan: (state) => state.config.slogan || ''
  },

  actions: {
    async loadConfig() {
      try {
        this.loading = true

        const data = await this.fetchConfig()

        if (data) {
          this.config = {
            ...this.config,
            ...data
          }

          this.applyTheme()
        }

        this.initialized = true
      } catch (error) {
        console.warn('Nao foi possivel carregar configuracoes; usando padrao local.', error)
        this.applyTheme()
        this.initialized = true
      } finally {
        this.loading = false
      }
    },

    async saveConfig(payload) {
      try {
        this.loading = true

        const updatePayload = {
          ...payload,
          updated_at: new Date().toISOString()
        }

        const data = await this.persistConfig(updatePayload)

        this.config = {
          ...this.config,
          ...data
        }

        this.applyTheme()

        return data
      } finally {
        this.loading = false
      }
    },

    async fetchConfig() {
      if (!getAccessToken()) {
        return apiRequest('/configuracoes/publica')
      }

      try {
        return await apiRequest('/configuracoes')
      } catch (error) {
        console.warn('Nao foi possivel carregar configuracoes autenticadas; tentando publica.', error)
        return apiRequest('/configuracoes/publica')
      }
    },

    async persistConfig(payload) {
      try {
        return await apiRequest('/configuracoes', {
          method: 'PATCH',
          body: payload
        })
      } catch (error) {
        console.warn('PATCH /configuracoes falhou; tentando PUT /configuracoes.', error)
        return apiRequest('/configuracoes', {
          method: 'PUT',
          body: payload
        })
      }
    },

    applyTheme() {
      if (this.config.cor_primaria) {
        setCssVar('primary', this.config.cor_primaria)
      }

      if (this.config.cor_secundaria) {
        setCssVar('secondary', this.config.cor_secundaria)
      }

      if (this.config.cor_acento) {
        setCssVar('accent', this.config.cor_acento)
      }

      Dark.set(this.config.tema === 'dark')
    },

    async toggleTheme() {
      this.config.tema = this.config.tema === 'dark' ? 'light' : 'dark'
      this.applyTheme()
      
      // Salvar a alteração no banco
      await this.saveConfig({ tema: this.config.tema })
    }
  }
})
