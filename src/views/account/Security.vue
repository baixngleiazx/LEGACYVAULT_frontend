<template>
  <div>
    <h2 style="margin-bottom:20px">账户安全 / Account Security</h2>

    <!-- 5 步注册流程状态 -->
    <el-card style="margin-bottom:20px">
      <template #header><span>5 步安全注册进度 / 5-Step Registration Progress</span></template>
      <el-timeline>
        <el-timeline-item
          v-for="step in steps"
          :key="step.step"
          :type="stepType(step)"
          :hollow="!stepDone(step)"
          :timestamp="stepTimestamp(step)"
          placement="top">
          <el-card shadow="hover">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <h4 style="margin:0">步骤 {{ step.step }}：{{ step.stepName }}</h4>
                <div style="color:#909399;font-size:13px;margin-top:4px">
                  <span v-if="step.done === 1" style="color:#67c23a">✓ 已完成</span>
                  <span v-else-if="step.skipped === 1" style="color:#e6a23c">⊘ 已跳过</span>
                  <span v-else style="color:#909399">○ 未完成</span>
                </div>
              </div>
              <div>
                <el-button v-if="!stepDone(step)" type="primary" size="small" @click="goToStep(step.step)">
                  去完成
                </el-button>
                <el-button v-else size="small" @click="goToStep(step.step)">
                  查看详情
                </el-button>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- KYC 状态 -->
    <el-card style="margin-bottom:20px">
      <template #header><span>KYC 身份核验 / KYC Verification</span></template>
      <div v-if="kycStatus" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <el-tag :type="kycTagType" size="large">{{ kycStatus.statusText }}</el-tag>
          <div v-if="kycStatus.rejectReason" style="color:#f56c6c;margin-top:8px">
            驳回原因：{{ kycStatus.rejectReason }}
          </div>
        </div>
        <el-button v-if="authStore.userInfo?.kycStatus !== 2" type="primary" @click="$router.push('/register/step/4')">
          {{ authStore.userInfo?.kycStatus === 0 ? '去完成 KYC' : '重新提交' }}
        </el-button>
      </div>
    </el-card>

    <!-- 生物特征状态 -->
    <el-card>
      <template #header><span>生物特征 / Biometric</span></template>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <el-tag :type="authStore.userInfo?.biometricBound ? 'success' : 'info'">
            {{ authStore.userInfo?.biometricBound ? '已录入' : '未录入' }}
          </el-tag>
          <span v-if="biometricInfo" style="margin-left:12px;color:#909399">
            {{ biometricInfo.biometricType }} · {{ biometricInfo.deviceInfo }}
          </span>
        </div>
        <el-button v-if="!authStore.userInfo?.biometricBound" type="primary" @click="$router.push('/register/step/3')">
          去录入
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useRegistrationStore } from '../../stores/registration'
import { getBiometricStatus } from '../../api/auth'
import { getKycStatus } from '../../api/kyc'

const router = useRouter()
const authStore = useAuthStore()
const registrationStore = useRegistrationStore()

const steps = computed(() => registrationStore.steps)
const biometricInfo = ref<any>(null)
const kycStatus = ref<any>(null)

onMounted(async () => {
  await registrationStore.fetchStatus()
  try {
    const bioRes: any = await getBiometricStatus()
    biometricInfo.value = bioRes.data
  } catch {}
  try {
    const kycRes: any = await getKycStatus()
    kycStatus.value = kycRes.data
  } catch {}
})

function stepDone(step: any) {
  return step.done === 1 || step.skipped === 1
}

function stepType(step: any): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (step.done === 1) return 'success'
  if (step.skipped === 1) return 'warning'
  return 'info'
}

function stepTimestamp(step: any) {
  return step.done === 1 ? '已完成' : step.skipped === 1 ? '已跳过' : '待完成'
}

const kycTagType = computed(() => {
  const s = authStore.userInfo?.kycStatus
  if (s === 2) return 'success'
  if (s === 1) return 'warning'
  if (s === 3) return 'danger'
  return 'info'
})

function goToStep(n: number) {
  router.push(`/register/step/${n}`)
}
</script>
