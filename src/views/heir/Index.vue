<template>
  <div>
    <div style="display:flex;justify-content:space-between;margin-bottom:20px">
      <h2>继承人管理 / Heir Management</h2>
      <el-button type="primary" @click="openAddDialog">添加继承人 / Add Heir</el-button>
    </div>

    <!-- 解锁门槛配置 -->
    <el-card style="margin-bottom:16px">
      <template #header><span>资产解锁门槛 / Unlock Threshold</span></template>
      <el-form :inline="true">
        <el-form-item label="最低解锁继承人数">
          <el-input-number v-model="unlockThreshold" :min="1" :max="heirs.length || 1" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSaveThreshold" :loading="thresholdLoading">保存</el-button>
        </el-form-item>
      </el-form>
      <div style="color:#909399;font-size:12px">
        当前已确认继承人 {{ confirmedCount }} 人。解锁资产时需要至少 {{ unlockThreshold }} 名继承人同时通过核验。
      </div>
    </el-card>

    <!-- 继承人列表 -->
    <div class="table-wrapper">
      <el-table :data="heirs" style="width:100%" class="heir-table" stripe>
        <el-table-column prop="name" label="姓名 / Name" width="140" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱 / Email" min-width="220" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号 / Phone" width="140" show-overflow-tooltip />
        <el-table-column label="状态 / Status" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ row.confirmationStatusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="invitedAt" label="邀请时间" width="170" show-overflow-tooltip />
        <el-table-column prop="lastInviteSentAt" label="最后发送" width="170" show-overflow-tooltip />
        <el-table-column label="分配内容 / Assigned" width="120">
          <template #default="{ row }">{{ (row.assignedContentIds || []).length }}</template>
        </el-table-column>
        <el-table-column label="操作 / Actions" min-width="260">
          <template #default="{ row }">
            <div class="actions-cell">
              <el-button size="small" @click="openEditDialog(row)" :disabled="row.status === 2">编辑</el-button>
              <el-button size="small" type="warning" @click="handleResend(row)" :disabled="row.status !== 1">重发邀请</el-button>
              <el-button size="small" @click="openAssignDialog(row)">分配内容</el-button>
              <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)" :disabled="row.status === 2">
                <template #reference><el-button type="danger" size="small" text :disabled="row.status === 2">删除</el-button></template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑继承人' : '添加继承人'" width="450px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="证件号" v-if="isProPlan">
          <el-input v-model="form.idCardNo" placeholder="Pro/Vault 套餐可录入" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">{{ isEdit ? '保存' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- 内容分配弹窗 -->
    <el-dialog v-model="assignDialogVisible" title="分配内容" width="600px">
      <div style="margin-bottom:12px;color:#909399">
        为继承人 {{ assignHeir?.name }} 分配加密内容
      </div>
      <el-checkbox-group v-model="selectedContentIds">
        <el-checkbox v-for="c in allContents" :key="c.id" :label="c.id" style="display:block;margin-bottom:8px">
          {{ c.title || `内容 #${c.id}` }} ({{ c.contentType }})
        </el-checkbox>
      </el-checkbox-group>
      <div v-if="allContents.length === 0" style="text-align:center;padding:20px;color:#909399">
        暂无可分配内容，请先在「资产保管」页面添加内容
      </div>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssign" :loading="assignLoading">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { listHeirs, addHeir, updateHeir, deleteHeir, resendHeirInvite, assignHeirContent, getUnlockThreshold, setUnlockThreshold } from '../../api/heir'
import { listContents } from '../../api/content'
import { useAuthStore } from '../../stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const heirs = ref<any[]>([])
const unlockThreshold = ref(1)
const thresholdLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const submitLoading = ref(false)
const form = reactive({ name: '', email: '', phone: '', idCardNo: '' })

const assignDialogVisible = ref(false)
const assignLoading = ref(false)
const assignHeir = ref<any>(null)
const selectedContentIds = ref<number[]>([])
const allContents = ref<any[]>([])

const confirmedCount = computed(() => heirs.value.filter(h => h.status === 2).length)
const isProPlan = computed(() => {
  const plan = authStore.userInfo?.planId
  return plan != null && plan >= 2
})

onMounted(async () => {
  await loadData()
  try {
    const res: any = await getUnlockThreshold()
    unlockThreshold.value = res.data || 1
  } catch {}
})

async function loadData() {
  const res: any = await listHeirs()
  heirs.value = res.data || []
}

function statusTagType(status: number) {
  switch (status) {
    case 0: return 'info'
    case 1: return 'warning'
    case 2: return 'success'
    case 3: return 'danger'
    default: return 'info'
  }
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, { name: '', email: '', phone: '', idCardNo: '' })
  dialogVisible.value = true
}

function openEditDialog(row: any) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, { name: row.name, email: row.email, phone: row.phone || '', idCardNo: '' })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.name || !form.email) {
    ElMessage.warning('请填写姓名和邮箱')
    return
  }
  submitLoading.value = true
  try {
    if (isEdit.value && editId.value) {
      await updateHeir(editId.value, form)
      ElMessage.success('继承人已更新')
    } else {
      await addHeir(form)
      ElMessage.success('继承人已添加，确认邀请已发送')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(id: number) {
  await deleteHeir(id)
  ElMessage.success('已删除')
  await loadData()
}

async function handleResend(row: any) {
  try {
    await resendHeirInvite(row.id)
    ElMessage.success('邀请已重发')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '重发失败')
  }
}

async function handleSaveThreshold() {
  thresholdLoading.value = true
  try {
    await setUnlockThreshold(unlockThreshold.value)
    ElMessage.success('解锁门槛已更新')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    thresholdLoading.value = false
  }
}

async function openAssignDialog(row: any) {
  assignHeir.value = row
  selectedContentIds.value = row.assignedContentIds || []
  try {
    const res: any = await listContents()
    allContents.value = res.data || []
  } catch {
    allContents.value = []
  }
  assignDialogVisible.value = true
}

async function handleAssign() {
  if (!assignHeir.value) return
  assignLoading.value = true
  try {
    await assignHeirContent(assignHeir.value.id, selectedContentIds.value)
    ElMessage.success('内容已分配')
    assignDialogVisible.value = false
    await loadData()
  } finally {
    assignLoading.value = false
  }
}
</script>

<style scoped>
.table-wrapper {
  overflow-x: auto;
  margin-top: 8px;
  padding-bottom: 4px;
}
.heir-table ::v-deep(.el-table__header-wrapper),
.heir-table ::v-deep(.el-table__body-wrapper) {
  overflow-x: auto;
}
.heir-table ::v-deep(.el-table th),
.heir-table ::v-deep(.el-table td) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.actions-cell ::v-deep(.el-button) {
  flex: 0 0 auto;
}
</style>
