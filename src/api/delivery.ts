import request from './request'

/** 获取交付链接列表 */
export function listDeliveryLinks() {
  return request.get('/delivery/links')
}

/** 继承人身份核验并获取内容 */
export function verifyAndDecrypt(data: {
  linkToken: string
  emailOtp: string
  phoneOtp: string
  faceImageBase64?: string
  deviceFingerprint?: string
}) {
  return request.post('/delivery/verify', data)
}

/** 发送/重发交付核验OTP */
export function sendDeliveryOtp(data: { linkToken: string; channel: 'email' | 'phone' }) {
  return request.post('/delivery/send-otp', data)
}
