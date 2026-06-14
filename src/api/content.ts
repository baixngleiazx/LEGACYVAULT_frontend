import request from './request'

/** 获取加密内容列表 */
export function listContents(type?: string) {
  return request.get('/content/list', { params: { type } })
}

/** 创建加密内容 */
export function createContent(data: {
  contentType: string
  title: string
  encryptedData: string
  contentHash: string
  fileName?: string
  fileSize?: number
  k2Shard?: string
  k3Shard?: string
}) {
  return request.post('/content/create', data)
}

/** 删除加密内容 */
export function deleteContent(contentId: number) {
  return request.delete(`/content/${contentId}`)
}

/** 获取内容详情 */
export function getContentDetail(contentId: number) {
  return request.get(`/content/${contentId}`)
}
