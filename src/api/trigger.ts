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
export function abortProcess(totpCode: string) {
  return request.post('/trigger/abort', null, { params: { totpCode } })
}
