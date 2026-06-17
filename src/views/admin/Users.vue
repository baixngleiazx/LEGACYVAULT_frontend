<template>
  <div>
    <h2 style="margin-bottom:20px">用户管理 / User Management</h2>

    <!-- 搜索栏 -->
    <el-card style="margin-bottom:16px">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="邮箱/手机/昵称" clearable @clear="loadData" @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable @change="loadData">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
            <el-option label="锁定" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-table :data="users" v-loading="loading" style="width:100%">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="email" label="邮箱" width="160" />
      <el-table-column prop="phone" label="手机" width="120" />
      <el-table-column label="套餐" width="80">
        <template #default="{ row }">
          <el-tag :type="row.planId === 3 ? 'danger' : row.planId === 2 ? 'warning' : 'info'">
            {{ row.planName }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册进度" width="140">
        <template #default="{ row }">
          <span>
            <el-icon v-if="row.step1Done" color="#67c23a"><CircleCheck /></el-icon>
            <el-icon v-else color="#dcdfe6"><CircleClose /></el-icon>
            <el-icon v-if="row.step2Done" color="#67c23a"><CircleCheck /></el-icon>
            <el-icon v-else color="#dcdfe6"><CircleClose /></el-icon>
            <el-icon v-if="row.step3Done" color="#67c23a"><CircleCheck /></el-icon>
            <el-icon v-else color="#dcdfe6"><CircleClose /></el-icon>
            <el-icon v-if="row.step4Done" color="#67c23a"><CircleCheck /></el-icon>
            <el-icon v-else color="#dcdfe6"><CircleClose /></el-icon>
            <el-icon v-if="row.step5Done" color="#67c23a"><CircleCheck /></el-icon>
            <el-icon v-else color="#dcdfe6"><CircleClose /></el-icon>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="KYC" width="80">
        <template #default="{ row }">
          <el-tag :type="row.kycStatus === 2 ? 'success' : row.kycStatus === 1 ? 'warning' : row.kycStatus === 3 ? 'danger' : 'info'" size="small">
            {{ row.kycStatusText }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="heirCount" label="继承人" width="70" />
      <el-table-column prop="securityScore" label="安全分" width="70" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="showHeirs(row)">继承人</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.size"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      style="margin-top:16px;justify-content:flex-end"
      @size-change="loadData"
      @current-change="loadData"
    />

    <!-- 继承人抽屉 -->
    <el-drawer v-model="drawerVisible" :title="`用户 ${currentUser?.nickname} 的继承人`" size="500px">
      <el-table :data="heirs" v-loading="heirsLoading">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="confirmationStatusText" label="状态" />
        <el-table-column prop="assignedContentCount" label="分配内容" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { listAdminUsers, getAdminUserHeirs } from '../../api/admin'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const users = ref<any[]>([])
const total = ref(0)
const query = reactive({ page: 1, size: 20, keyword: '', status: undefined as number | undefined })

const drawerVisible = ref(false)
const heirsLoading = ref(false)
const heirs = ref<any[]>([])
const currentUser = ref<any>(null)

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res: any = await listAdminUsers(query)
    users.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

async function showHeirs(user: any) {
  currentUser.value = user
  drawerVisible.value = true
  heirsLoading.value = true
  try {
    const res: any = await getAdminUserHeirs(user.id)
    heirs.value = res.data || []
  } catch (e: any) {
    ElMessage.error(e.message || '查询继承人失败')
  } finally {
    heirsLoading.value = false
  }
}
</script>
