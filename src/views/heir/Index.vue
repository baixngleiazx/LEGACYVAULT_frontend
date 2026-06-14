<template>
  <div class="page-container">
    <div style="display:flex;justify-content:space-between;margin-bottom:20px">
      <h2>继承人管理 / Heir Management</h2>
      <el-button type="primary" @click="showAddDialog = true">添加继承人 / Add Heir</el-button>
    </div>
    <el-table :data="heirs" style="width:100%">
      <el-table-column prop="name" label="姓名 / Name" />
      <el-table-column prop="email" label="邮箱 / Email" />
      <el-table-column prop="phone" label="手机号 / Phone" />
      <el-table-column prop="confirmationStatusText" label="状态 / Status" width="120">
        <template #default="{ row }">
          <el-tag :type="row.confirmationStatus === 1 ? 'success' : row.confirmationStatus === 2 ? 'danger' : 'warning'">
            {{ row.confirmationStatusText }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="assignedContentCount" label="分配内容 / Assigned" width="120" />
      <el-table-column label="操作 / Actions" width="120">
        <template #default="{ row }">
          <el-popconfirm title="确定删除？/ Are you sure to delete?" @confirm="handleDelete(row.id)">
            <template #reference><el-button type="danger" size="small" text>删除 / Delete</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="showAddDialog" title="添加继承人 / Add Heir" width="400px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="姓名 / Name"><el-input v-model="addForm.name" /></el-form-item>
        <el-form-item label="邮箱 / Email"><el-input v-model="addForm.email" /></el-form-item>
        <el-form-item label="手机号 / Phone"><el-input v-model="addForm.phone" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消 / Cancel</el-button>
        <el-button type="primary" @click="handleAdd">添加 / Add</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { listHeirs, addHeir, deleteHeir } from '../../api/heir'
import { ElMessage } from 'element-plus'

const heirs = ref<any[]>([])
const showAddDialog = ref(false)
const addForm = reactive({ name: '', email: '', phone: '' })

onMounted(async () => { const res: any = await listHeirs(); heirs.value = res.data || [] })

const handleAdd = async () => {
  await addHeir(addForm)
  ElMessage.success('继承人已添加，确认邀请已发送 / Heir added, confirmation invite sent')
  showAddDialog.value = false
  Object.assign(addForm, { name: '', email: '', phone: '' })
  const res: any = await listHeirs(); heirs.value = res.data || []
}

const handleDelete = async (id: number) => {
  await deleteHeir(id); ElMessage.success('已删除 / Deleted')
  const res: any = await listHeirs(); heirs.value = res.data || []
}
</script>
