import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '../api/auth'

/**
 * 5 步注册流程跨步骤状态管理
 * 持久化到 sessionStorage 以支持页面刷新恢复
 */

interface StepStatus {
  step: number
  stepName: string
  done: number
  skipped: number
  accessible: boolean
  skipRiskHint: string
}

const SESSION_KEY = 'legacy_vault_registration'

export const useRegistrationStore = defineStore('registration', () => {
  /** 步骤状态列表（5 项） */
  const steps = ref<StepStatus[]>([])

  /** 当前应引导用户进入的步骤编号 */
  const currentStep = ref<number | null>(null)

  /** 是否全部完成 */
  const allCompleted = ref(false)

  /** TOTP 是否已绑定（步骤 5 强依赖） */
  const totpBound = ref(false)

  /** 当前套餐 ID */
  const planId = ref<number | null>(null)

  /** 临时 TOTP 密钥（仅在前端展示用，不入库） */
  const tempTotpSecret = ref<string | null>(null)

  /** 临时 TOTP 二维码 URL */
  const tempTotpQrCodeUrl = ref<string | null>(null)

  /** 临时恢复码明文（仅一次性展示） */
  const tempRecoveryCodes = ref<string[] | null>(null)

  /** 当前步骤计算属性 */
  const currentStepStatus = computed(() => {
    if (currentStep.value == null) return null
    return steps.value.find(s => s.step === currentStep.value) || null
  })

  /**
   * 拉取服务端最新注册状态
   */
  async function fetchStatus() {
    try {
      const res: any = await authApi.getRegistrationStatus()
      const data = res.data
      steps.value = data.steps || []
      currentStep.value = data.currentStep
      allCompleted.value = !!data.allCompleted
      totpBound.value = !!data.totpBound
      planId.value = data.planId
      persist()
    } catch (e) {
      console.error('拉取注册状态失败', e)
    }
  }

  /**
   * 标记某一步完成
   */
  async function completeStep(step: number) {
    await authApi.completeRegistrationStep(step)
    await fetchStatus()
  }

  /**
   * 标记某一步跳过
   */
  async function skipStep(step: number) {
    await authApi.skipRegistrationStep(step)
    await fetchStatus()
  }

  /**
   * 完成全部流程
   */
  async function completeAll() {
    await authApi.completeRegistration()
    await fetchStatus()
    clearTempData()
  }

  /**
   * 清除临时数据（恢复码/TOTP 密钥）
   */
  function clearTempData() {
    tempTotpSecret.value = null
    tempTotpQrCodeUrl.value = null
    tempRecoveryCodes.value = null
  }

  /**
   * 重置整个流程状态（用于登出后清理）
   */
  function reset() {
    steps.value = []
    currentStep.value = null
    allCompleted.value = false
    totpBound.value = false
    planId.value = null
    clearTempData()
    try { sessionStorage.removeItem(SESSION_KEY) } catch {}
  }

  /** 持久化到 sessionStorage（仅元数据，不含敏感临时数据） */
  function persist() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        steps: steps.value,
        currentStep: currentStep.value,
        allCompleted: allCompleted.value,
        totpBound: totpBound.value,
        planId: planId.value
      }))
    } catch {}
  }

  /** 从 sessionStorage 恢复 */
  function restore() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      steps.value = data.steps || []
      currentStep.value = data.currentStep
      allCompleted.value = !!data.allCompleted
      totpBound.value = !!data.totpBound
      planId.value = data.planId
    } catch {}
  }

  return {
    steps,
    currentStep,
    allCompleted,
    totpBound,
    planId,
    tempTotpSecret,
    tempTotpQrCodeUrl,
    tempRecoveryCodes,
    currentStepStatus,
    fetchStatus,
    completeStep,
    skipStep,
    completeAll,
    clearTempData,
    reset,
    restore
  }
})
