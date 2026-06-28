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
        meta: {
          perfis: ['dev', 'super_admin', 'admin', 'instrutor', 'recepcao', 'financeiro'],
        },
        component: () => import('pages/DashboardPage.vue'),
      },
      {
        path: 'clientes',
        name: 'clientes',
        meta: {
          perfis: ['dev', 'super_admin', 'admin', 'instrutor', 'recepcao'],
        },
        component: () => import('pages/clientes/ClientesPage.vue'),
      },
      {
        path: 'treinos',
        name: 'treinos',
        meta: {
          perfis: ['dev', 'super_admin', 'admin', 'instrutor'],
        },
        component: () => import('pages/treinos/TreinosPage.vue'),
      },
      {
        path: 'pagamentos',
        name: 'pagamentos',
        meta: {
          perfis: ['dev', 'super_admin', 'admin', 'recepcao', 'financeiro'],
        },
        component: () => import('pages/pagamentos/PagamentosPage.vue'),
      },
      {
        path: 'funcionarios',
        name: 'funcionarios',
        meta: {
          perfis: ['dev', 'super_admin', 'admin'],
        },
        component: () => import('pages/funcionarios/FuncionariosPage.vue'),
      },
      {
        path: 'configuracoes',
        name: 'configuracoes',
        meta: {
          perfis: ['dev', 'super_admin', 'admin'],
        },
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
