import request from './request'

/** 获取用户信息 */
export function getUserInfo() {
  return request.get('/user/info')
}

/** 更新昵称 */
export function updateNickname(nickname: string) {
  return request.put('/user/nickname', { nickname })
}

/** 提交KYC核验 */
export function submitKyc(name: string, idCardNo: string) {
  return request.post('/user/kyc', { name, idCardNo })
}
