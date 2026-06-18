<template>
  <div class="page-container">
    <div class="checkin-fullscreen" v-if="!showTotpInput">
      <div :class="'status-' + (status?.statusColor || 'green')" style="font-size:72px;font-weight:bold">
        {{ status?.daysRemaining || 0 }}
      </div>
      <p style="font-size:20px;margin:16px 0">天 / Days</p>
      <p style="color:#909399;margin-bottom:32px">距下次打卡截止 / Until next check-in deadline</p>
      <el-button class="confirm-active-btn" type="primary" size="large" @click="showTotpInput = true">
        确认活跃 / Confirm Active
      </el-button>
      <p style="margin-top:16px;color:#909399">打卡需要输入TOTP验证码 / TOTP code required for check-in</p>
    </div>
    <!-- TOTP输入弹窗 -->
    <el-dialog v-model="showTotpInput" title="输入TOTP验证码 / Enter TOTP Code" width="400px">
      <el-input v-model="totpCode" placeholder="6位TOTP验证码 / 6-digit TOTP code" maxlength="6" size="large" @keyup.enter="handleCheckIn" />
      <template #footer>
        <el-button @click="showTotpInput = false">取消 / Cancel</el-button>
        <el-button class="dialog-confirm-btn" type="primary" @click="handleCheckIn" :loading="loading">确认打卡 / Confirm Check-in</el-button>
      </template>
    </el-dialog>
    <!-- 设置区域 -->
    <el-card style="margin-top:40px">
      <template #header><span>打卡设置 / Check-in Settings</span></template>
      <el-form label-width="140px">
        <el-form-item label="打卡周期 / Period">
          <el-select v-model="periodDays" @change="handleSetPeriod">
            <el-option :value="30" label="30天 / 30 days" />
            <el-option :value="60" label="60天 / 60 days" />
            <el-option :value="90" label="90天（默认）/ 90 days (default)" />
            <el-option :value="180" label="180天 / 180 days" />
          </el-select>
        </el-form-item>
        <el-form-item label="旅行模式 / Travel Mode">
          <el-switch v-model="travelEnabled" @change="handleTravelToggle" />
          <span style="margin-left:12px;color:#909399">旅行期间暂停心跳检测 / Pause heartbeat during travel</span>
        </el-form-item>
      </el-form>
    </el-card>
    <!-- 最近打卡记录 -->
    <el-card style="margin-top:16px">
      <template #header><span>打卡记录 / Check-in Records</span></template>
      <p style="color:#909399">上次打卡 / Last check-in：{{ status?.lastCheckInAt || '暂无记录 / No records' }}</p>
      <p style="color:#909399">下次截止 / Next deadline：{{ status?.nextDeadline || '暂无 / N/A' }}</p>
      <p v-if="status?.travelModeEnabled" style="color:#E6A23C">
        旅行模式：{{ status.travelStartDate }} ~ {{ status.travelEndDate }}
      </p>
    </el-card>
    <el-dialog v-model="showTravelDialog" title="开启旅行模式 / Enable Travel Mode" width="460px" @close="travelEnabled = Boolean(status?.travelModeEnabled)">
      <el-form :model="travelForm" label-width="120px">
        <el-form-item label="开始日期">
          <el-date-picker v-model="travelForm.startDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="travelForm.endDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="TOTP">
          <el-input v-model="travelForm.totpCode" maxlength="6" placeholder="6位TOTP验证码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTravelDialog = false">取消 / Cancel</el-button>
        <el-button type="primary" @click="confirmTravelMode" :loading="travelSaving">开启 / Enable</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHeartbeatStore } from '../../stores/heartbeat'
import { setCheckInPeriod, enableTravelMode, disableTravelMode } from '../../api/heartbeat'
import { ElMessage } from 'element-plus'

const heartbeatStore = useHeartbeatStore()
const status = ref<any>(null)
const showTotpInput = ref(false)
const totpCode = ref('')
const loading = ref(false)
const periodDays = ref(90)
const travelEnabled = ref(false)
const showTravelDialog = ref(false)
const travelSaving = ref(false)
const travelForm = ref({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  totpCode: ''
})

onMounted(async () => {
  await heartbeatStore.fetchStatus()
  status.value = heartbeatStore.status
  periodDays.value = status.value?.checkInPeriodDays || 90
  travelEnabled.value = Boolean(status.value?.travelModeEnabled)
})

const handleCheckIn = async () => {
  if (!totpCode.value) { ElMessage.warning('请输入TOTP验证码 / Please enter TOTP code'); return }
  loading.value = true
  try {
    await heartbeatStore.checkIn(totpCode.value)
    status.value = heartbeatStore.status
    showTotpInput.value = false
    totpCode.value = ''
    ElMessage.success('打卡成功！/ Check-in successful!')
  } finally { loading.value = false }
}

const handleSetPeriod = async (days: number) => {
  await setCheckInPeriod(days)
  ElMessage.success('打卡周期已更新 / Check-in period updated')
  await heartbeatStore.fetchStatus()
  status.value = heartbeatStore.status
}

const handleTravelToggle = async (val: boolean) => {
  if (val) {
    showTravelDialog.value = true
  } else {
    await disableTravelMode()
    ElMessage.success('旅行模式已关闭 / Travel mode disabled')
    await refreshStatus()
  }
}

const confirmTravelMode = async () => {
  if (!travelForm.value.startDate || !travelForm.value.endDate || !travelForm.value.totpCode) {
    ElMessage.warning('请填写日期和TOTP验证码 / Please enter dates and TOTP code')
    return
  }
  travelSaving.value = true
  try {
    await enableTravelMode(travelForm.value)
    ElMessage.success('旅行模式已开启 / Travel mode enabled')
    showTravelDialog.value = false
    await refreshStatus()
  } finally {
    travelSaving.value = false
  }
}

const refreshStatus = async () => {
  await heartbeatStore.fetchStatus()
  status.value = heartbeatStore.status
  periodDays.value = status.value?.checkInPeriodDays || 90
  travelEnabled.value = Boolean(status.value?.travelModeEnabled)
}
</script>

<style scoped>
.checkin-fullscreen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  text-align: center;
}

.confirm-active-btn {
  width: 240px;
  min-height: 56px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 999px;
  box-shadow: 0 8px 18px rgba(64, 158, 255, 0.22);
}

.dialog-confirm-btn {
  min-width: 132px;
}
</style>
