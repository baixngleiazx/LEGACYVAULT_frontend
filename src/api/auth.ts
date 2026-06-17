import request from './request'

/**
 * 认证相关 API（扩展：注册流程步骤 + 生物特征 + WebAuthn）
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

/** 初始化 TOTP 绑定 */
export function initTotpBind() {
  return request.post('/auth/totp/init')
}

/** 确认 TOTP 绑定 */
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

// ========== 5 步注册流程 ==========

/** 查询 5 步注册流程整体状态 */
export function getRegistrationStatus() {
  return request.get('/auth/registration/status')
}

/** 标记某一步骤完成 */
export function completeRegistrationStep(step: number) {
  return request.post(`/auth/registration/step/${step}/complete`)
}

/** 标记某一步骤跳过 */
export function skipRegistrationStep(step: number) {
  return request.post(`/auth/registration/step/${step}/skip`)
}

/** 标记整个注册流程完成 */
export function completeRegistration() {
  return request.post('/auth/registration/complete')
}

// ========== 生物特征 ==========

/** 录入生物特征 */
export function registerBiometric(data: { biometricType: string; featureHash: string; deviceInfo?: string }) {
  return request.post('/auth/biometric/register', data)
}

/** 查询生物特征状态 */
export function getBiometricStatus() {
  return request.get('/auth/biometric/status')
}

// ========== WebAuthn (YubiKey) ==========

/** 初始化 WebAuthn 注册（下发挑战） */
export function initWebAuthn() {
  return request.post('/auth/totp/webauthn/init')
}

/** 确认 WebAuthn 注册（回传凭证） */
export function confirmWebAuthn(data: {
  credentialId: string
  clientDataJSON: string
  authenticatorData: string
  signature?: string
  publicKey: string
  deviceName?: string
}) {
  return request.post('/auth/totp/webauthn/confirm', data)
}
