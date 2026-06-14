<template>
  <div class="page-container">
    <h2 style="margin-bottom:20px">仪表盘 / Dashboard</h2>
    <el-row :gutter="20">
      <!-- 心跳状态卡 -->
      <el-col :span="8">
        <el-card class="status-card" :class="'border-' + (heartbeatStatus?.statusColor || 'green')">
          <template #header><span>心跳状态 / Heartbeat Status</span></template>
          <div v-if="heartbeatStatus">
            <div :class="'status-' + heartbeatStatus.statusColor" style="font-size:36px;font-weight:bold">
              {{ heartbeatStatus.daysRemaining || 0 }} 天 / Days
            </div>
            <p style="color:#909399;margin-top:8px">距下次打卡截止 / Until next check-in deadline</p>
            <p style="margin-top:8px">打卡周期 / Check-in period：{{ heartbeatStatus.checkInPeriodDays }}天 / days</p>
            <p>截止日期 / Deadline：{{ heartbeatStatus.nextDeadline }}</p>
          </div>
        </el-card>
      </el-col>
      <!-- 资产保管箱 -->
      <el-col :span="8">
        <el-card class="status-card">
          <template #header><span>资产保管箱 / Asset Vault</span></template>
          <div style="font-size:36px;font-weight:bold;color:#409eff">{{ contentCount }}</div>
          <p style="color:#909399;margin-top:8px">已存储加密内容 / Encrypted contents stored</p>
        </el-card>
      </el-col>
      <!-- 继承人状态 -->
      <el-col :span="8">
        <el-card class="status-card">
          <template #header><span>继承人状态 / Heir Status</span></template>
          <div style="font-size:36px;font-weight:bold;color:#67c23a">{{ heirCount }}</div>
          <p style="color:#909399;margin-top:8px">已绑定继承人 / Bound heirs</p>
        </el-card>
      </el-col>
    </el-row>
    <!-- 安全健康分 -->
    <el-card style="margin-top:20px">
      <template #header><span>安全健康分 / Security Health Score</span></template>
      <el-progress :percentage="authStore.userInfo?.securityScore || 0" :stroke-width="20" :text-inside="true" />
      <div style="margin-top:12px;color:#909399">
        <p>提升方式 / Ways to improve：绑定TOTP / Bind TOTP(+20) | 完成KYC / Complete KYC(+30) | 添加继承人 / Add heir(+10) | 绑定紧急恢复码 / Bind recovery code(+10)</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useHeartbeatStore } from '../../stores/heartbeat'
import { listContents } from '../../api/content'
import { listHeirs } from '../../api/heir'

const authStore = useAuthStore()
const heartbeatStore = useHeartbeatStore()
const heartbeatStatus = ref<any>(null)
const contentCount = ref(0)
const heirCount = ref(0)

onMounted(async () => {
  await authStore.fetchUserInfo()
  await heartbeatStore.fetchStatus()
  heartbeatStatus.value = heartbeatStore.status
  const [contentRes, heirRes]: any[] = await Promise.all([listContents(), listHeirs()])
  contentCount.value = contentRes.data?.length || 0
  heirCount.value = heirRes.data?.length || 0
})
</script>

<style scoped>
.border-green { border-left: 4px solid #67c23a; }
.border-yellow { border-left: 4px solid #e6a23c; }
.border-red { border-left: 4px solid #f56c6c; }
</style>
