const routes = [
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('pages/LoginPage.vue'),
      },
    ],
  },

  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue'),
      },
      {
        path: 'clientes',
        name: 'clientes',
        component: () => import('pages/clientes/ClientesPage.vue'),
      },
      {
        path: 'treinos',
        name: 'treinos',
        component: () => import('pages/treinos/TreinosPage.vue'),
      },
      {
        path: 'pagamentos',
        name: 'pagamentos',
        component: () => import('pages/pagamentos/PagamentosPage.vue'),
      },
      {
        path: 'configuracoes',
        name: 'configuracoes',
        component: () => import('pages/configuracoes/ConfiguracoesPage.vue'),
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
