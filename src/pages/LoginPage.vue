<template>
  <q-page class="login-page flex flex-center">
    <q-card class="login-card">
      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold">{{ nomeAcademia }}</div>
        <div class="text-grey-7 q-mt-sm">Acesse sua conta</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input
            v-model="form.email"
            label="E-mail"
            type="email"
            outlined
            dense
            :disable="loading"
            lazy-rules
            :rules="[(val) => !!val || 'Informe o e-mail']"
          />

          <q-input
            v-model="form.password"
            label="Senha"
            type="password"
            outlined
            dense
            :disable="loading"
            lazy-rules
            :rules="[(val) => !!val || 'Informe a senha']"
          />

          <q-btn
            label="Entrar"
            type="submit"
            color="primary"
            unelevated
            class="full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth-store'
import { useConfigStore } from 'src/stores/config-store'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const configStore = useConfigStore()

const form = reactive({
  email: '',
  password: ''
})

const loading = computed(() => authStore.loading)
const nomeAcademia = computed(() => configStore.nomeAcademia)

onMounted(async () => {
  if (!configStore.initialized) {
    try {
      await configStore.loadConfig()
    } catch (error) {
      console.error('Erro ao carregar configurações no login:', error)
    }
  }
})

async function handleLogin() {
  try {
    await authStore.login(form.email, form.password)

    $q.notify({
      type: 'positive',
      message: 'Login realizado com sucesso'
    })

    router.push('/dashboard')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao fazer login'
    })
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #111827, #1f2937);
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
}
</style>
