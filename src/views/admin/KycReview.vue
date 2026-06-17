<template>
  <div>
    <h2 style="margin-bottom:20px">KYC 审核工作台 / KYC Review</h2>

    <el-tabs v-model="activeTab" @tab-change="loadData">
      <el-tab-pane label="待审核 / Pending" name="pending" />
      <el-tab-pane label="全部 / All" name="all" />
    </el-tabs>

    <el-table :data="records" v-loading="loading" style="width:100%">
      <el-table-column prop="id" label="单据ID" width="80" />
      <el-table-column prop="userId" label="用户ID" width="80" />
      <el-table-column prop="userEmail" label="用户邮箱" width="160" />
      <el-table-column prop="realName" label="真实姓名" width="120" />
      <el-table-column prop="idType" label="证件类型" width="100" />
      <el-table-column prop="idNoMasked" label="证件号" width="140" />
      <el-table-column label="活体检测" width="90">
        <template #default="{ row }">
          <el-tag :type="row.livenessPassed ? 'success' : 'danger'" size="small">
            {{ row.livenessPassed ? '通过' : '未通过' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.statusText }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rejectReason" label="驳回原因" min-width="160" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="提交时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right" v-if="activeTab === 'pending'">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
          <el-button type="danger" size="small" @click="showRejectDialog(row)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      style="margin-top:16px;justify-content:flex-end"
      @size-change="loadData"
      @current-change="loadData"
    />

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回 KYC 审核" width="500px">
      <el-form>
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入驳回原因..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleReject" :loading="rejectLoading">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listPendingKyc, listAllKyc, approveKyc, rejectKyc } from '../../api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('pending')
const loading = ref(false)
const records = ref<any[]>([])
const page = ref(1)
const size = ref(20)
const total = ref(0)

const rejectDialogVisible = ref(false)
const rejectLoading = ref(false)
const rejectReason = ref('')
const currentRecord = ref<any>(null)

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    let res: any
    if (activeTab.value === 'pending') {
      res = await listPendingKyc({ page: page.value, size: size.value })
    } else {
      res = await listAllKyc({ page: page.value, size: size.value })
    }
    records.value = res.data?.records || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

async function handleApprove(row: any) {
  await ElMessageBox.confirm(`确认通过用户 ${row.userEmail} 的 KYC 审核？`, '审核确认', {
    type: 'info'
  })
  try {
    await approveKyc(row.id)
    ElMessage.success('审核已通过')
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

function showRejectDialog(row: any) {
  currentRecord.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  rejectLoading.value = true
  try {
    await rejectKyc(currentRecord.value.id, rejectReason.value)
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    rejectLoading.value = false
  }
}

function statusTagType(status: number) {
  switch (status) {
    case 1: return 'success'
    case 3: return 'warning'
    case 4: return 'success'
    case 5: return 'danger'
    default: return 'info'
  }
}
</script>
