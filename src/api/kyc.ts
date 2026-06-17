import request from './request'

/**
 * KYC 相关 API
 */

/** 提交 KYC 材料 */
export function submitKyc(data: {
  realName: string
  idType?: string
  idNo: string
  frontImage?: string
  backImage?: string
  livenessPassed?: boolean
}) {
  return request.post('/kyc/submit', data)
}

/** 查询 KYC 状态 */
export function getKycStatus() {
  return request.get('/kyc/status')
}
