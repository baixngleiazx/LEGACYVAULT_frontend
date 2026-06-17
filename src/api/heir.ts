import request from './request'

/**
 * 继承人管理 API（含增强：编辑 / 重发邀请 / 内容分配 / 解锁门槛）
 */

/** 获取继承人列表 */
export function listHeirs() {
  return request.get('/heir/list')
}

/** 添加继承人 */
export function addHeir(data: { name: string; email: string; phone?: string; idCardNo?: string }) {
  return request.post('/heir/add', data)
}

/** 编辑继承人 */
export function updateHeir(heirId: number, data: { name: string; email: string; phone?: string; idCardNo?: string }) {
  return request.put(`/heir/${heirId}`, data)
}

/** 删除继承人 */
export function deleteHeir(heirId: number) {
  return request.delete(`/heir/${heirId}`)
}

/** 重发继承人确认邀请 */
export function resendHeirInvite(heirId: number) {
  return request.post(`/heir/${heirId}/resend-invite`)
}

/** 确认继承人邀请 */
export function confirmHeirInvite(token: string) {
  return request.post('/heir/confirm', null, { params: { token } })
}

/** 为继承人分配内容（差异化分配） */
export function assignHeirContent(heirId: number, contentIds: number[]) {
  return request.put(`/heir/${heirId}/assign`, { contentIds })
}

/** 设置解锁门槛 */
export function setUnlockThreshold(minHeirsToUnlock: number) {
  return request.put('/heir/unlock-threshold', { minHeirsToUnlock })
}

/** 查询解锁门槛 */
export function getUnlockThreshold() {
  return request.get('/heir/unlock-threshold')
}
