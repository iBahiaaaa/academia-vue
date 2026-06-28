import { route } from 'quasar/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'

import routes from './routes'
import { useAuthStore } from 'src/stores/auth-store'

const fallbackRouteByPerfil = {
  dev: '/dashboard',
  super_admin: '/dashboard',
  admin: '/dashboard',
  instrutor: '/dashboard',
  recepcao: '/dashboard',
  financeiro: '/dashboard',
}

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    if (!authStore.initialized) {
      await authStore.initialize()
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    if (requiresAuth && !authStore.isAuthenticated) {
      return '/login'
    }

    if (requiresAuth && !authStore.canAccessAdmin) {
      await authStore.logout()
      return '/login'
    }

    const perfisPermitidos = to.matched.flatMap((record) => record.meta.perfis || [])

    if (
      requiresAuth &&
      perfisPermitidos.length > 0 &&
      !perfisPermitidos.includes(authStore.perfil)
    ) {
      return fallbackRouteByPerfil[authStore.perfil] || '/login'
    }

    if (to.name === 'login' && authStore.isAuthenticated) {
      if (!authStore.canAccessAdmin) {
        await authStore.logout()
        return true
      }

      return '/dashboard'
    }

    return true
  })

  return Router
})
