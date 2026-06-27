<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title>
          {{ nomeAcademia }}
        </q-toolbar-title>

        <!-- Botão de tema -->
        <label class="switch q-mr-md">
          <span class="sun">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g fill="#ffd43b">
                <circle r="5" cy="12" cx="12"></circle>
                <path
                  d="m21 13h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm-17 0h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm13.66-5.66a1 1 0 0 1 -.66-.29 1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1 -.75.29zm-12.02 12.02a1 1 0 0 1 -.71-.29 1 1 0 0 1 0-1.41l.71-.66a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1 -.7.24zm6.36-14.36a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm0 17a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm-5.66-14.66a1 1 0 0 1 -.7-.29l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.29zm12.02 12.02a1 1 0 0 1 -.7-.29l-.66-.71a1 1 0 0 1 1.36-1.36l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.24z"
                ></path>
              </g>
            </svg>
          </span>

          <span class="moon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
              <path
                d="m223.5 32c-123.5 0-223.5 100.3-223.5 224s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"
              ></path>
            </svg>
          </span>

          <input type="checkbox" class="input" :checked="isDark" @change="toggleTheme" />
          <span class="slider"></span>
        </label>

        <q-btn flat dense round icon="logout" @click="confirmLogout">
          <q-tooltip>Sair</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="260">
      <div class="q-pa-md">
        <div class="text-h6 text-weight-bold">{{ nomeAcademia }}</div>
        <div class="text-caption text-grey-7">{{ sloganAcademia }}</div>
      </div>

      <q-separator />

      <q-list padding>
        <q-item clickable v-ripple to="/dashboard" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/clientes">
          <q-item-section avatar>
            <q-icon name="groups" />
          </q-item-section>
          <q-item-section>Clientes</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/treinos">
          <q-item-section avatar>
            <q-icon name="fitness_center" />
          </q-item-section>
          <q-item-section>Treinos</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/pagamentos">
          <q-item-section avatar>
            <q-icon name="payments" />
          </q-item-section>
          <q-item-section>Pagamentos</q-item-section>
        </q-item>

        <q-item v-if="authStore.canManageFuncionarios" clickable v-ripple to="/funcionarios">
          <q-item-section avatar>
            <q-icon name="badge" />
          </q-item-section>
          <q-item-section>Funcionários</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/configuracoes">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>Configurações</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="trocarSenhaModal.open" persistent>
      <q-card style="width: 420px; max-width: 95vw">
        <q-card-section>
          <div class="text-h6">Troque sua senha</div>
          <div class="text-grey-7">
            Por segurança, altere a senha temporária antes de continuar.
          </div>
        </q-card-section>

        <q-separator />

        <q-form @submit.prevent="trocarSenha">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model="trocarSenhaForm.novaSenha"
              outlined
              dense
              label="Nova senha"
              type="password"
              :disable="trocandoSenha"
              lazy-rules
              :rules="[
                (val) => !!val || 'Informe a nova senha',
                (val) => String(val).length >= 6 || 'A senha precisa ter pelo menos 6 caracteres',
              ]"
            />

            <q-input
              v-model="trocarSenhaForm.confirmarSenha"
              outlined
              dense
              label="Confirmar nova senha"
              type="password"
              :disable="trocandoSenha"
              lazy-rules
              :rules="[
                (val) => !!val || 'Confirme a senha',
                (val) => val === trocarSenhaForm.novaSenha || 'As senhas não conferem',
              ]"
            />
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              color="primary"
              unelevated
              type="submit"
              label="Salvar nova senha"
              :loading="trocandoSenha"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar, Dark } from 'quasar'

import { supabase } from 'src/boot/supabase'
import { useAuthStore } from 'src/stores/auth-store'
import { useConfigStore } from 'src/stores/config-store'

const router = useRouter()
const $q = useQuasar()

const authStore = useAuthStore()
const configStore = useConfigStore()

const leftDrawerOpen = ref(false)

const nomeAcademia = computed(() => configStore.nomeAcademia)
const sloganAcademia = computed(() => configStore.slogan)
const isDark = computed(() => Dark.isActive)

const trocandoSenha = ref(false)

const trocarSenhaModal = reactive({
  open: false,
})

const trocarSenhaForm = reactive({
  novaSenha: '',
  confirmarSenha: '',
})

watch(
  () => authStore.precisaTrocarSenha,
  () => {
    verificarTrocaSenha()
  },
)

onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  if (!configStore.initialized) {
    await configStore.loadConfig()
  }

  verificarTrocaSenha()
})

function confirmLogout() {
  $q.dialog({
    title: 'Sair',
    message: 'Deseja realmente sair do sistema?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await authStore.logout()
    router.push('/login')
  })
}

function toggleTheme() {
  configStore.toggleTheme()
}

function verificarTrocaSenha() {
  if (authStore.precisaTrocarSenha) {
    trocarSenhaModal.open = true
  }
}

async function trocarSenha() {
  try {
    trocandoSenha.value = true

    if (!trocarSenhaForm.novaSenha || trocarSenhaForm.novaSenha.length < 6) {
      throw new Error('A nova senha precisa ter pelo menos 6 caracteres')
    }

    if (trocarSenhaForm.novaSenha !== trocarSenhaForm.confirmarSenha) {
      throw new Error('As senhas não conferem')
    }

    const { error: authError } = await supabase.auth.updateUser({
      password: trocarSenhaForm.novaSenha,
    })

    if (authError) {
      throw authError
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        precisa_trocar_senha: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authStore.user.id)

    if (profileError) {
      throw profileError
    }

    await authStore.loadProfile()

    trocarSenhaModal.open = false
    trocarSenhaForm.novaSenha = ''
    trocarSenhaForm.confirmarSenha = ''

    $q.notify({
      type: 'positive',
      message: 'Senha alterada com sucesso',
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao trocar senha',
    })
  } finally {
    trocandoSenha.value = false
  }
}
</script>

<style scoped>
.switch {
  font-size: 17px;
  position: relative;
  display: inline-block;
  width: 64px;
  height: 34px;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #73c0fc;
  transition: 0.4s;
  border-radius: 30px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 30px;
  width: 30px;
  border-radius: 20px;
  left: 2px;
  bottom: 2px;
  z-index: 2;
  background-color: #e8e8e8;
  transition: 0.4s;
}

.sun svg {
  position: absolute;
  top: 6px;
  left: 36px;
  z-index: 1;
  width: 24px;
  height: 24px;
}

.moon svg {
  fill: #73c0fc;
  position: absolute;
  top: 5px;
  left: 5px;
  z-index: 1;
  width: 24px;
  height: 24px;
}

.switch:hover .sun svg {
  animation: rotate 15s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0);
  }

  100% {
    transform: rotate(360deg);
  }
}

.switch:hover .moon svg {
  animation: tilt 5s linear infinite;
}

@keyframes tilt {
  0% {
    transform: rotate(0deg);
  }

  25% {
    transform: rotate(-10deg);
  }

  75% {
    transform: rotate(10deg);
  }

  100% {
    transform: rotate(0deg);
  }
}

.input:checked + .slider {
  background-color: #183153;
}

.input:focus + .slider {
  box-shadow: 0 0 1px #183153;
}

.input:checked + .slider:before {
  transform: translateX(30px);
}
</style>
