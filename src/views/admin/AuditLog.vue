<template>
  <div>
    <h2 style="margin-bottom:20px">审计日志 / Audit Logs</h2>

    <!-- 筛选栏 -->
    <el-card style="margin-bottom:16px">
      <el-form :inline="true" :model="query">
        <el-form-item label="模块">
          <el-select v-model="query.module" placeholder="全部" clearable @change="loadData">
            <el-option label="认证" value="auth" />
            <el-option label="注册流程" value="registration" />
            <el-option label="KYC" value="kyc" />
            <el-option label="生物特征" value="biometric" />
            <el-option label="继承人" value="heir" />
            <el-option label="管理员" value="admin" />
            <el-option label="系统配置" value="sys_config" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="query.userId" placeholder="用户ID" clearable @clear="loadData" @keyup.enter="loadData" style="width:120px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-table :data="logs" v-loading="loading" style="width:100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column prop="userId" label="用户/管理员ID" width="100" />
      <el-table-column prop="module" label="模块" width="110">
        <template #default="{ row }">
          <el-tag size="small">{{ row.module }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="action" label="操作" width="160" />
      <el-table-column prop="targetType" label="对象类型" width="100" />
      <el-table-column prop="targetId" label="对象ID" width="80" />
      <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
      <el-table-column prop="ipAddress" label="IP" width="130" />
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.size"
      :total="total"
      :page-sizes="[20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      style="margin-top:16px;justify-content:flex-end"
      @size-change="loadData"
      @current-change="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { listAuditLogs } from '../../api/admin'

const loading = ref(false)
const logs = ref<any[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 50, module: '', userId: '' })

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: query.page, size: query.size }
    if (query.module) params.module = query.module
    if (query.userId) params.userId = parseInt(query.userId)
    const res: any = await listAuditLogs(params)
    logs.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}
</script>
