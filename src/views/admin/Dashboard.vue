<template>
  <div>
    <h2 style="margin-bottom:20px">管理后台仪表盘 / Admin Dashboard</h2>

    <el-row :gutter="20" v-loading="loading">
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header><span>总用户数 / Total Users</span></template>
          <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header><span>注册进行中 / In Progress</span></template>
          <div class="stat-value" style="color:#e6a23c">{{ stats.registrationInProgress || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header><span>KYC 待审核 / KYC Pending</span></template>
          <div class="stat-value" style="color:#f56c6c">{{ stats.kycPending || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header><span>今日活跃 / Today Active</span></template>
          <div class="stat-value" style="color:#67c23a">{{ stats.todayActiveUsers || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top:20px">
      <template #header><span>快捷操作 / Quick Actions</span></template>
      <el-space wrap>
        <el-button type="primary" @click="$router.push('/admin/users')">用户管理 / Users</el-button>
        <el-button type="warning" @click="$router.push('/admin/kyc')">KYC 审核 / KYC Review</el-button>
        <el-button @click="$router.push('/admin/config')">系统配置 / Config</el-button>
        <el-button @click="$router.push('/admin/audit-logs')">审计日志 / Audit Logs</el-button>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAdminDashboard } from '../../api/admin'

const loading = ref(false)
const stats = ref<any>({})

onMounted(async () => {
  loading.value = true
  try {
    const res: any = await getAdminDashboard()
    stats.value = res.data || {}
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
}
</style>
