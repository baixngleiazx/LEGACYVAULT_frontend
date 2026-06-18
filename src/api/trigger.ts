import request from './request'

/** 获取触发流程列表 */
export function listTriggerProcesses() {
  return request.get('/trigger/list')
}

/** 获取最新触发流程 */
export function getLatestProcess() {
  return request.get('/trigger/latest')
}

/** 中止触发流程 */
export function abortProcess(data: { password: string; totpCode: string }) {
  return request.post('/trigger/abort', data)
}

/** 可信联系人回复核查请求 */
export function replyContactVerification(data: {
  verificationId: number
  verificationStatus: number
  replyChannel?: string
}) {
  return request.post('/trigger/contact-reply', data)
}
