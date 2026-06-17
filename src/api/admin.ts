import request from './request'

/**
 * 管理员后台 API
 */

/** 管理员登录 */
export function adminLogin(data: { username: string; password: string }) {
  return request.post('/admin/auth/login', data)
}

/** 管理员登出 */
export function adminLogout() {
  return request.post('/admin/auth/logout')
}

/** 仪表盘统计 */
export function getAdminDashboard() {
  return request.get('/admin/dashboard')
}

/** 用户列表（分页） */
export function listAdminUsers(params: { page?: number; size?: number; keyword?: string; status?: number }) {
  return request.get('/admin/users', { params })
}

/** 用户详情 */
export function getAdminUserDetail(userId: number) {
  return request.get(`/admin/users/${userId}`)
}

/** 用户继承人只读查询 */
export function getAdminUserHeirs(userId: number) {
  return request.get(`/admin/users/${userId}/heirs`)
}

/** KYC 待审列表 */
export function listPendingKyc(params: { page?: number; size?: number }) {
  return request.get('/admin/kyc/pending', { params })
}

/** KYC 全量列表 */
export function listAllKyc(params: { page?: number; size?: number; status?: number }) {
  return request.get('/admin/kyc/list', { params })
}

/** KYC 审核通过 */
export function approveKyc(recordId: number) {
  return request.post(`/admin/kyc/${recordId}/approve`)
}

/** KYC 审核驳回 */
export function rejectKyc(recordId: number, rejectReason: string) {
  return request.post(`/admin/kyc/${recordId}/reject`, { rejectReason })
}

/** 查询系统配置 */
export function getSysConfig() {
  return request.get('/admin/config')
}

/** 批量更新系统配置 */
export function updateSysConfig(configs: Array<{ configKey: string; configValue: string; description?: string }>) {
  return request.put('/admin/config', { configs })
}

/** 审计日志分页查询 */
export function listAuditLogs(params: { page?: number; size?: number; module?: string; userId?: number }) {
  return request.get('/admin/audit-logs', { params })
}
