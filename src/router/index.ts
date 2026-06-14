import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由配置
 * 所有页面路由与业务模块一一对应
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ===== 认证页面（无需登录） =====
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/auth/Login.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/auth/Register.vue'),
      meta: { title: '注册' }
    },

    // ===== 主应用页面（需要登录） =====
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/dashboard/Index.vue'),
      meta: { title: '仪表盘', requireAuth: true }
    },
    {
      path: '/heartbeat',
      name: 'Heartbeat',
      component: () => import('../views/heartbeat/Index.vue'),
      meta: { title: '心跳打卡', requireAuth: true }
    },
    {
      path: '/content',
      name: 'Content',
      component: () => import('../views/content/Index.vue'),
      meta: { title: '资产保管', requireAuth: true }
    },
    {
      path: '/heir',
      name: 'Heir',
      component: () => import('../views/heir/Index.vue'),
      meta: { title: '继承人管理', requireAuth: true }
    },
    {
      path: '/trigger',
      name: 'Trigger',
      component: () => import('../views/trigger/Index.vue'),
      meta: { title: '触发状态', requireAuth: true }
    },

    // ===== 交付页面（无需登录，继承人访问） =====
    {
      path: '/delivery/verify',
      name: 'DeliveryVerify',
      component: () => import('../views/delivery/Verify.vue'),
      meta: { title: '遗产交付核验' }
    },

    // ===== 其他 =====
    {
      path: '/heir/confirm',
      name: 'HeirConfirm',
      component: () => import('../views/heir/Confirm.vue'),
      meta: { title: '继承人确认' }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requireAuth && !token) {
    next('/login')
  } else {
    next()
  }
  // 更新页面标题
  document.title = (to.meta.title as string) || 'LegacyVault'
})

export default router
