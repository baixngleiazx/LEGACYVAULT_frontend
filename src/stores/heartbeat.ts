import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as heartbeatApi from '../api/heartbeat'

/**
 * 心跳状态管理
 */
export const useHeartbeatStore = defineStore('heartbeat', () => {
  /** 心跳状态 */
  const status = ref<any>(null)

  /** 加载心跳状态 */
  async function fetchStatus() {
    const res: any = await heartbeatApi.getHeartbeatStatus()
    status.value = res.data
  }

  /** 执行打卡 */
  async function checkIn(totpCode: string) {
    await heartbeatApi.checkIn(totpCode)
    await fetchStatus()
  }

  return { status, fetchStatus, checkIn }
})
