import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由配置
 * 三段式结构：
 *   1. 公开路由（登录 / 注册向导 / 继承人确认 / 交付核验）
 *   2. 用户路由（requireAuth）
 *   3. 管理员路由（requireAdmin）
 *
 * 每个路由通过 meta.layout 控制 App.vue 布局：
 *   - 'blank'：无导航（登录 / 注册 / 管理员登录）
 *   - 'user'：用户顶部导航
 *   - 'admin'：管理员侧边栏
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ==================== 1. 公开路由 ====================
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/auth/Login.vue'),
      meta: { title: '登录', layout: 'blank' }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/register/Index.vue'),
      meta: { title: '注册', layout: 'blank' },
      children: [
        {
          path: 'step/:n',
          name: 'RegisterStep',
          component: () => import('../views/register/Index.vue'),
          meta: { title: '注册', layout: 'blank' }
        },
        {
          path: 'complete',
          name: 'RegisterComplete',
          component: () => import('../views/register/Complete.vue'),
          meta: { title: '注册完成', layout: 'blank' }
        }
      ]
    },

    // ==================== 2. 用户路由（requireAuth） ====================
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/dashboard/Index.vue'),
      meta: { title: '仪表盘', requireAuth: true, layout: 'user' }
    },
    {
      path: '/heartbeat',
      name: 'Heartbeat',
      component: () => import('../views/heartbeat/Index.vue'),
      meta: { title: '心跳打卡', requireAuth: true, layout: 'user' }
    },
    {
      path: '/content',
      name: 'Content',
      component: () => import('../views/content/Index.vue'),
      meta: { title: '资产保管', requireAuth: true, layout: 'user' }
    },
    {
      path: '/heir',
      name: 'Heir',
      component: () => import('../views/heir/Index.vue'),
      meta: { title: '继承人管理', requireAuth: true, layout: 'user' }
    },
    {
      path: '/trigger',
      name: 'Trigger',
      component: () => import('../views/trigger/Index.vue'),
      meta: { title: '触发状态', requireAuth: true, layout: 'user' }
    },
    {
      path: '/account/security',
      name: 'AccountSecurity',
      component: () => import('../views/account/Security.vue'),
      meta: { title: '账户安全', requireAuth: true, layout: 'user' }
    },

    // ==================== 3. 管理员路由（requireAdmin） ====================
    {
      path: '/admin/login',
      name: 'AdminLogin',
      component: () => import('../views/admin/Login.vue'),
      meta: { title: '管理员登录', layout: 'blank' }
    },
    {
      path: '/admin',
      redirect: '/admin/dashboard'
    },
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: () => import('../views/admin/Dashboard.vue'),
      meta: { title: '管理后台', requireAdmin: true, layout: 'admin' }
    },
    {
      path: '/admin/users',
      name: 'AdminUsers',
      component: () => import('../views/admin/Users.vue'),
      meta: { title: '用户管理', requireAdmin: true, layout: 'admin' }
    },
    {
      path: '/admin/kyc',
      name: 'AdminKyc',
      component: () => import('../views/admin/KycReview.vue'),
      meta: { title: 'KYC 审核', requireAdmin: true, layout: 'admin' }
    },
    {
      path: '/admin/config',
      name: 'AdminConfig',
      component: () => import('../views/admin/Config.vue'),
      meta: { title: '系统配置', requireAdmin: true, layout: 'admin' }
    },
    {
      path: '/admin/audit-logs',
      name: 'AdminAuditLogs',
      component: () => import('../views/admin/AuditLog.vue'),
      meta: { title: '审计日志', requireAdmin: true, layout: 'admin' }
    },

    // ==================== 其他公开页面 ====================
    {
      path: '/delivery/verify',
      name: 'DeliveryVerify',
      component: () => import('../views/delivery/Verify.vue'),
      meta: { title: '遗产交付核验', layout: 'blank' }
    },
    {
      path: '/heir/confirm',
      name: 'HeirConfirm',
      component: () => import('../views/heir/Confirm.vue'),
      meta: { title: '继承人确认', layout: 'blank' }
    },

    // ==================== 兜底 ====================
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// 路由守卫：按角色校验
router.beforeEach((to, from, next) => {
  const userToken = localStorage.getItem('token')
  const adminToken = localStorage.getItem('admin_token')

  if (to.meta.requireAdmin && !adminToken) {
    next('/admin/login')
  } else if (to.meta.requireAuth && !userToken) {
    next('/login')
  } else {
    next()
  }

  document.title = (to.meta.title as string) || 'LegacyVault'
})

export default router
