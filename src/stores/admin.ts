import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as adminApi from '../api/admin'
import router from '../router'

/**
 * 管理员状态管理
 * 独立于 useAuthStore，使用独立的 adminToken 存储
 */
export const useAdminStore = defineStore('admin', () => {
  const ADMIN_TOKEN_KEY = 'admin_token'
  const ADMIN_INFO_KEY = 'admin_info'

  const token = ref<string | null>(localStorage.getItem(ADMIN_TOKEN_KEY))
  const adminInfo = ref<any>(null)
  const isLoggedIn = ref(!!token.value)

  // 从 localStorage 恢复 adminInfo
  try {
    const raw = localStorage.getItem(ADMIN_INFO_KEY)
    if (raw) adminInfo.value = JSON.parse(raw)
  } catch {}

  /**
   * 管理员登录
   */
  async function login(username: string, password: string) {
    const res: any = await adminApi.adminLogin({ username, password })
    token.value = res.data.token
    adminInfo.value = {
      adminId: res.data.adminId,
      username: res.data.username,
      realName: res.data.realName,
      role: res.data.role
    }
    isLoggedIn.value = true
    localStorage.setItem(ADMIN_TOKEN_KEY, res.data.token)
    localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(adminInfo.value))
  }

  /**
   * 管理员登出
   */
  async function logout() {
    try {
      await adminApi.adminLogout()
    } catch {}
    token.value = null
    adminInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_INFO_KEY)
    router.push('/admin/login')
  }

  return { token, adminInfo, isLoggedIn, login, logout }
})
