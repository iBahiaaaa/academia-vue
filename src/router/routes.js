const routes = [

  {
    path: '/',
    redirect: '/dashboard'
  },

  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },

  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),

    children: [

      {
        path: '/dashboard',
        component: () => import('pages/DashboardPage.vue')
      },

      {
        path: '/clientes',
        component: () => import('pages/clientes/ClientesPage.vue')
      },

      {
        path: '/pagamentos',
        component: () => import('pages/pagamentos/PagamentosPage.vue')
      },

      {
        path: '/treinos',
        component: () => import('pages/treinos/TreinosPage.vue')
      }

    ]
  },


  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }

]


export default routes
