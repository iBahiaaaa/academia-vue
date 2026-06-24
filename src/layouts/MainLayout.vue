<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title>
          Bahia Gym
        </q-toolbar-title>

        <q-btn flat dense round icon="logout" @click="confirmLogout">
          <q-tooltip>Sair</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="260"
      class="bg-grey-1"
    >
      <div class="q-pa-md">
        <div class="text-h6 text-weight-bold">Academia</div>
        <div class="text-caption text-grey-7">Gestão Bahia Gym</div>
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
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-2">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth-store'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)

function confirmLogout() {
  $q.dialog({
    title: 'Sair',
    message: 'Deseja realmente sair do sistema?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await authStore.logout()
    router.push('/login')
  })
}
</script>
