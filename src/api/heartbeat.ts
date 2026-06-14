import request from './request'

/** 获取心跳状态 */
export function getHeartbeatStatus() {
  return request.get('/heartbeat/status')
}

/** 心跳打卡 */
export function checkIn(totpCode: string) {
  return request.post('/heartbeat/check-in', { totpCode })
}

/** 设置打卡周期 */
export function setCheckInPeriod(periodDays: number) {
  return request.put('/heartbeat/period', { periodDays })
}

/** 开启旅行模式 */
export function enableTravelMode(data: { startDate: string; endDate: string; totpCode: string }) {
  return request.post('/heartbeat/travel-mode', data)
}

/** 关闭旅行模式 */
export function disableTravelMode() {
  return request.delete('/heartbeat/travel-mode')
}
