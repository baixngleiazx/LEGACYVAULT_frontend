import axios, { type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

/**
 * Axios 请求封装
 * 统一处理请求头、响应拦截、错误处理
 */

const service = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：自动附加Token
service.interceptors.request.use(
  (config) => {
    const url = config.url?.toString() || ''
    if (url.startsWith('/admin/')) {
      const adminToken = localStorage.getItem('admin_token')
      if (adminToken) {
        config.headers['Authorization'] = `Bearer ${adminToken}`
      }
    } else {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理错误
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    const url = response.config.url?.toString() || ''

    // 成功
    if (res.code === 200) {
      return res
    }

    // Token过期或无效
    if (res.code === 401 || res.code === 1009) {
      ElMessage.error('登录已过期，请重新登录')
      const isAdminRequest = url.startsWith('/admin/')
      const isLoginRequest = url === '/auth/login' || url === '/admin/auth/login'

      if (isAdminRequest) {
        localStorage.removeItem('admin_token')
      } else {
        localStorage.removeItem('token')
      }

      if (!isLoginRequest) {
        if (isAdminRequest) {
          router.push('/admin/login')
        } else {
          router.push('/login')
        }
      }
      return Promise.reject(new Error(res.message))
    }

    // 业务错误：由调用方统一处理，避免重复提示
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    ElMessage.error('网络错误，请检查服务是否运行')
    return Promise.reject(error)
  }
)

export default service
