<template>
  <div class="page-container">
    <h2 style="margin-bottom:20px">触发验证状态 / Trigger Verification Status</h2>
    <el-alert v-if="!latestProcess" title="当前无触发流程 / No active trigger process" description="您的心跳状态正常，未触发任何遗产交付流程。/ Your heartbeat is normal, no delivery process triggered." type="success" show-icon :closable="false" style="margin-bottom:20px" />
    <el-card v-if="latestProcess">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>当前触发流程 / Current Trigger Process</span>
          <el-tag :type="latestProcess.status === 'ABORTED' ? 'info' : latestProcess.status === 'COMPLETED' ? 'success' : 'danger'">
            {{ latestProcess.statusText }}
          </el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="流程ID / Process ID">{{ latestProcess.id }}</el-descriptions-item>
        <el-descriptions-item label="状态 / Status">{{ latestProcess.statusText }}</el-descriptions-item>
        <el-descriptions-item label="宽限期开始 / Grace Period Start">{{ latestProcess.gracePeriodStart || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人核查 / Contact Check">{{ latestProcess.contactCheckStart || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公证人通知 / Notary Notify">{{ latestProcess.notaryNotifyAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="最终确认 / Final Confirm">{{ latestProcess.finalConfirmAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="区块链存证 / Blockchain Tx">{{ latestProcess.blockchainTxHash || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间 / Created At">{{ latestProcess.createdAt }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="isActive" style="margin-top:20px;text-align:center">
        <el-button type="danger" size="large" @click="showAbortDialog = true">紧急中止触发流程 / Emergency Abort</el-button>
        <p style="color:#909399;margin-top:8px">可使用TOTP或离线恢复码中止当前流程 / Use TOTP or an offline recovery code to abort</p>
      </div>
    </el-card>
    <el-dialog v-model="showAbortDialog" title="中止触发流程 / Abort Trigger Process" width="440px">
      <el-tabs v-model="abortMode">
        <el-tab-pane label="TOTP 验证码" name="totp">
          <p style="margin-bottom:16px;color:#606266">输入账户密码和TOTP验证码以中止当前触发流程：</p>
          <el-input v-model="abortPassword" type="password" show-password placeholder="账户密码 / Password" size="large" style="margin-bottom:12px" />
          <el-input v-model="abortTotpCode" placeholder="6位TOTP验证码 / 6-digit TOTP code" maxlength="6" size="large" />
        </el-tab-pane>
        <el-tab-pane label="离线恢复码" name="recovery">
          <p style="margin-bottom:16px;color:#606266">输入离线恢复码以中止当前触发流程：</p>
          <el-input v-model="recoveryCode" placeholder="16位恢复码 / Recovery code" maxlength="32" size="large" show-password />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showAbortDialog = false">取消 / Cancel</el-button>
        <el-button type="danger" @click="handleAbort" :loading="loading">确认中止 / Confirm Abort</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getLatestProcess, abortProcess } from '../../api/trigger'
import { useRecoveryCode } from '../../api/auth'
import { ElMessage } from 'element-plus'

const latestProcess = ref<any>(null)
const showAbortDialog = ref(false)
const abortMode = ref<'totp' | 'recovery'>('totp')
const abortPassword = ref('')
const abortTotpCode = ref('')
const recoveryCode = ref('')
const loading = ref(false)

const isActive = computed(() => {
  if (!latestProcess.value) return false
  const s = latestProcess.value.status
  return ['T0_ALERT', 'T72_CONTACT_CHECK', 'T96_NOTARY', 'T120_FINAL_CONFIRM'].includes(s)
})

onMounted(async () => { const res: any = await getLatestProcess(); latestProcess.value = res.data })

const handleAbort = async () => {
  if (abortMode.value === 'totp' && (!abortPassword.value || !abortTotpCode.value)) {
    ElMessage.warning('请输入账户密码和TOTP验证码')
    return
  }
  if (abortMode.value === 'recovery' && !recoveryCode.value) {
    ElMessage.warning('请输入离线恢复码')
    return
  }

  loading.value = true
  try {
    if (abortMode.value === 'totp') {
      await abortProcess({ password: abortPassword.value, totpCode: abortTotpCode.value })
    } else {
      await useRecoveryCode(recoveryCode.value)
    }
    ElMessage.success('触发流程已中止 / Trigger process aborted')
    showAbortDialog.value = false
    abortPassword.value = ''
    abortTotpCode.value = ''
    recoveryCode.value = ''
    const res: any = await getLatestProcess(); latestProcess.value = res.data
  } finally { loading.value = false }
}
</script>
