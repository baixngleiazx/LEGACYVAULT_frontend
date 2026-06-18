import request from './request'

export interface TrustedContactPayload {
  name: string
  email: string
  phone?: string
  relationship?: string
}

/** 获取可信联系人列表 */
export function listTrustedContacts() {
  return request.get('/trusted-contact/list')
}

/** 添加可信联系人 */
export function addTrustedContact(data: TrustedContactPayload) {
  return request.post('/trusted-contact/add', data)
}

/** 删除可信联系人 */
export function deleteTrustedContact(contactId: number) {
  return request.delete(`/trusted-contact/${contactId}`)
}
