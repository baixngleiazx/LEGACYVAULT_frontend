<template>
  <div class="register-page">
    <div class="register-card">
      <div class="register-header">
        <RegisterBackLogin />
        <h2>LegacyVault 安全注册 / Secure Registration</h2>
      </div>

      <!-- 步骤条 -->
      <el-steps :active="activeStepIndex" finish-status="success" align-center style="margin-bottom: 24px;">
        <el-step v-for="s in steps" :key="s.step"
                 :title="`步骤 ${s.step}`"
                 :description="s.stepName"
                 :status="stepIconStatus(s)" />
      </el-steps>

      <!-- 当前步骤内容 -->
      <div class="step-content" v-if="currentStep && !registrationStore.allCompleted">
        <Step1Account v-if="currentStep === 1" @next="goNext" />
        <Step2Totp v-else-if="currentStep === 2" @next="goNext" @prev="goPrev" @skip="handleSkip" />
        <Step3Biometric v-else-if="currentStep === 3" @next="goNext" @prev="goPrev" @skip="handleSkip" />
        <Step4Kyc v-else-if="currentStep === 4" @next="goNext" @prev="goPrev" @skip="handleSkip" />
        <Step5Recovery v-else-if="currentStep === 5" @next="goNext" @prev="goPrev" />
      </div>

      <!-- 全部完成 -->
      <div v-else class="step-content">
        <el-result icon="success" title="注册流程已完成" sub-title="正在跳转到仪表盘...">
          <template #extra>
            <el-button type="primary" @click="$router.push('/dashboard')">前往仪表盘</el-button>
          </template>
        </el-result>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRegistrationStore } from '../../stores/registration'
import { ElMessageBox, ElMessage } from 'element-plus'
import Step1Account from './Step1Account.vue'
import Step2Totp from './Step2Totp.vue'
import Step3Biometric from './Step3Biometric.vue'
import Step4Kyc from './Step4Kyc.vue'
import Step5Recovery from './Step5Recovery.vue'
import RegisterBackLogin from './RegisterBackLogin.vue'

const route = useRoute()
const router = useRouter()
const registrationStore = useRegistrationStore()

const defaultSteps = [
  { step: 1, stepName: '创建账户', done: 0, skipped: 0, accessible: true, skipRiskHint: '创建账户是注册流程的起点' },
  { step: 2, stepName: '绑定 TOTP', done: 0, skipped: 0, accessible: false, skipRiskHint: '绑定 TOTP 可以显著提高账户安全' },
  { step: 3, stepName: '录入生物特征', done: 0, skipped: 0, accessible: false, skipRiskHint: '录入生物特征可以增强账户找回能力' },
  { step: 4, stepName: '完成 KYC', done: 0, skipped: 0, accessible: false, skipRiskHint: 'KYC 有助于提升账户可信度' },
  { step: 5, stepName: '设置恢复码', done: 0, skipped: 0, accessible: false, skipRiskHint: '恢复码用于极端情况下找回账户' }
]

const steps = computed(() => registrationStore.steps)
const currentStep = computed(() => registrationStore.currentStep)

function syncStepFromRoute() {
  const rawStep = route.params.n
  const nextStep = rawStep == null ? null : Number(rawStep)
  if (typeof nextStep === 'number' && Number.isInteger(nextStep) && nextStep >= 1 && nextStep <= 5) {
    registrationStore.currentStep = nextStep
  }
}

/** 步骤条高亮索引 */
const activeStepIndex = computed(() => {
  if (currentStep.value == null) return steps.value.length
  return currentStep.value - 1
})

/** 步骤图标状态 */
function stepIconStatus(s: any): '' | 'wait' | 'process' | 'finish' | 'error' | 'success' {
  if (s.done === 1) return 'success'
  if (s.skipped === 1) return 'finish'
  if (s.step === currentStep.value) return 'process'
  return 'wait'
}

onMounted(async () => {
  registrationStore.restore()
  syncStepFromRoute()

  // 公开注册入口：未登录时不请求状态接口，避免 401 被全局拦截器踢回登录页。
  if (!localStorage.getItem('token')) {
    if (!registrationStore.steps.length) {
      registrationStore.steps = defaultSteps
    }
    if (registrationStore.currentStep == null) {
      registrationStore.currentStep = 1
    }
    registrationStore.allCompleted = false
    return
  }

  await registrationStore.fetchStatus()
  // 若已完成直接跳完成页
  if (registrationStore.allCompleted) {
    router.push('/register/complete')
  }
})

watch(() => route.params.n, () => {
  syncStepFromRoute()
})

watch(() => registrationStore.allCompleted, (done) => {
  if (done) router.push('/register/complete')
})

/** 前往下一步 */
async function goNext() {
  await registrationStore.fetchStatus()
}

/** 返回上一步 */
function goPrev() {
  if (currentStep.value && currentStep.value > 1) {
    router.push(`/register/step/${currentStep.value - 1}`)
  }
}

/** 跳过当前步骤 */
async function handleSkip() {
  if (currentStep.value == null) return
  const step = steps.value.find(s => s.step === currentStep.value)
  try {
    await ElMessageBox.confirm(
      step?.skipRiskHint || '跳过此步骤后可能影响账户安全，确定继续？',
      '确认跳过',
      { confirmButtonText: '确定跳过', cancelButtonText: '返回完成', type: 'warning' }
    )
    await registrationStore.skipStep(currentStep.value)
    ElMessage.success(`步骤 ${currentStep.value} 已跳过`)
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.register-page {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}
.register-card {
  width: 680px; padding: 40px; background: white;
  border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.register-header {
  margin-bottom: 24px;
}
.register-card h2 {
  margin: 0;
  text-align: center;
  color: #303133;
}
.step-content { min-height: 300px; }

@media (max-width: 720px) {
  .register-card {
    width: calc(100vw - 32px);
    padding: 28px 20px;
  }

  .register-header {
    margin-bottom: 20px;
  }
}
</style>
