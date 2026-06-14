import request from './request'

/** 获取继承人列表 */
export function listHeirs() {
  return request.get('/heir/list')
}

/** 添加继承人 */
export function addHeir(data: { name: string; email: string; phone?: string }) {
  return request.post('/heir/add', data)
}

/** 删除继承人 */
export function deleteHeir(heirId: number) {
  return request.delete(`/heir/${heirId}`)
}

/** 确认继承人邀请 */
export function confirmHeirInvite(token: string) {
  return request.post('/heir/confirm', null, { params: { token } })
}

/** 为继承人分配内容 */
export function assignContent(heirId: number, contentIds: number[]) {
  return request.post(`/heir/${heirId}/assign`, contentIds)
}
