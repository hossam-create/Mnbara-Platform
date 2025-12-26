import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { guest: true }
    },
    {
      path: '/',
      redirect: '/home-builder'
    },
    {
      path: '/home-builder',
      name: 'HomeBuilder',
      component: () => import('../views/HomeBuilder.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/banners',
      name: 'Banners',
      component: () => import('../views/Banners.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/themes',
      name: 'Themes',
      component: () => import('../views/Themes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/versions',
      name: 'Versions',
      component: () => import('../views/Versions.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/analytics',
      name: 'Analytics',
      component: () => import('../views/Analytics.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('../views/Settings.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/home-builder')
  } else {
    next()
  }
})

export default router
