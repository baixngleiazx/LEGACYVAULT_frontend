import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as authApi from '../api/auth'
import * as userApi from '../api/user'
import router from '../router'

/**
 * 认证状态管理
 * 管理用户登录状态、Token、用户信息
 */
export const useAuthStore = defineStore('auth', () => {
  /** 登录Token */
  const token = ref<string | null>(localStorage.getItem('token'))

  /** 用户信息 */
  const userInfo = ref<any>(null)

  /** 是否已登录 */
  const isLoggedIn = ref(!!token.value)

  /**
   * 账号密码登录
   */
  async function login(email: string, password: string, totpCode?: string) {
    const res: any = await authApi.login({ email, password, totpCode })
    token.value = res.data.token
    userInfo.value = res.data
    isLoggedIn.value = true
    localStorage.setItem('token', res.data.token)
    // 获取完整用户信息
    await fetchUserInfo()
  }

  /**
   * 验证码登录（手机号/邮箱）
   */
  async function loginByCode(target: string, verifyCode: string) {
    const res: any = await authApi.loginByCode({ target, verifyCode })
    token.value = res.data.token
    userInfo.value = res.data
    isLoggedIn.value = true
    localStorage.setItem('token', res.data.token)
    await fetchUserInfo()
  }

  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    try {
      const res: any = await userApi.getUserInfo()
      userInfo.value = res.data
    } catch (e) {
      console.error('获取用户信息失败', e)
    }
  }

  /**
   * 登出
   */
  async function logout() {
    try {
      await authApi.logout()
    } catch (e) {
      // 忽略登出错误
    }
    token.value = null
    userInfo.value = null
    isLoggedIn.value = false
    localStorage.removeItem('token')
    router.push('/login')
  }

  return { token, userInfo, isLoggedIn, login, loginByCode, fetchUserInfo, logout }
})
