import request from './request'

/**
 * 认证相关API
 */

/** 发送验证码 */
export function sendVerifyCode(data: { target: string; codeType: string; channel?: string }) {
  return request.post('/auth/send-code', data)
}

/** 用户注册（支持邮箱或手机号） */
export function register(data: { email?: string; phone?: string; verifyCode: string; password: string; nickname?: string }) {
  return request.post('/auth/register', data)
}

/** 用户登录（账号密码） */
export function login(data: { email: string; password: string; totpCode?: string }) {
  return request.post('/auth/login', data)
}

/** 验证码登录（手机号/邮箱 + 验证码） */
export function loginByCode(data: { target: string; verifyCode: string }) {
  return request.post('/auth/login/code', data)
}

/** 用户登出 */
export function logout() {
  return request.post('/auth/logout')
}

/** 初始化TOTP绑定 */
export function initTotpBind() {
  return request.post('/auth/totp/init')
}

/** 确认TOTP绑定 */
export function confirmTotpBind(totpCode: string) {
  return request.post('/auth/totp/confirm', { totpCode })
}

/** 生成紧急恢复码 */
export function generateRecoveryCodes() {
  return request.post('/auth/recovery-codes/generate')
}

/** 使用恢复码中止触发 */
export function useRecoveryCode(code: string) {
  return request.post('/auth/recovery-codes/use', null, { params: { code } })
}
