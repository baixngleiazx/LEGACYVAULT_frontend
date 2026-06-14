<template>
  <div class="page-container">
    <div style="display:flex;justify-content:space-between;margin-bottom:20px">
      <h2>资产保管箱 / Asset Vault</h2>
      <el-button type="primary" @click="showAddDialog = true">添加内容 / Add Content</el-button>
    </div>
    <el-tabs v-model="activeType">
      <el-tab-pane label="全部 / All" name="" />
      <el-tab-pane label="私钥 / Private Key" name="private_key" />
      <el-tab-pane label="密码 / Password" name="account_password" />
      <el-tab-pane label="遗言 / Last Words" name="last_words" />
      <el-tab-pane label="文件 / File" name="file" />
    </el-tabs>
    <el-table :data="contents" style="width:100%">
      <el-table-column prop="title" label="标题 / Title" />
      <el-table-column prop="contentTypeText" label="类型 / Type" width="120" />
      <el-table-column prop="contentHash" label="哈希（前16位）/ Hash (first 16)" width="220">
        <template #default="{ row }">{{ row.contentHash?.substring(0, 16) }}...</template>
      </el-table-column>
      <el-table-column prop="shardCount" label="分片 / Shards" width="100" />
      <el-table-column prop="createdAt" label="创建时间 / Created At" width="180" />
      <el-table-column label="操作 / Actions" width="120">
        <template #default="{ row }">
          <el-popconfirm title="确定删除？/ Are you sure to delete?" @confirm="handleDelete(row.id)">
            <template #reference><el-button type="danger" size="small" text>删除 / Delete</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <!-- 添加内容弹窗 -->
    <el-dialog v-model="showAddDialog" title="添加加密内容 / Add Encrypted Content" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="类型 / Type">
          <el-select v-model="addForm.contentType">
            <el-option value="private_key" label="加密私钥 / Private Key" />
            <el-option value="account_password" label="账户密码 / Account Password" />
            <el-option value="last_words" label="遗言文本 / Last Words" />
            <el-option value="file" label="文件附件 / File Attachment" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题 / Title"><el-input v-model="addForm.title" /></el-form-item>
        <el-form-item label="数据 / Data">
          <el-input v-model="addForm.encryptedData" type="textarea" :rows="4" placeholder="加密后的数据（Base64）- 实际应由WebCrypto在本地加密 / Encrypted data (Base64) - should be encrypted by WebCrypto locally" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消 / Cancel</el-button>
        <el-button type="primary" @click="handleAdd">保存 / Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { listContents, createContent, deleteContent } from '../../api/content'
import { ElMessage } from 'element-plus'

const contents = ref<any[]>([])
const activeType = ref('')
const showAddDialog = ref(false)
const addForm = reactive({ contentType: 'private_key', title: '', encryptedData: '', contentHash: '' })

const fetchContents = async () => {
  const res: any = await listContents(activeType.value || undefined)
  contents.value = res.data || []
}

onMounted(fetchContents)
watch(activeType, fetchContents)

const handleAdd = async () => {
  // 模拟哈希（实际由前端WebCrypto计算）
  addForm.contentHash = Array.from({length:64}, () => '0123456789abcdef'[Math.floor(Math.random()*16)]).join('')
  await createContent(addForm)
  ElMessage.success('加密内容已保存 / Encrypted content saved')
  showAddDialog.value = false
  Object.assign(addForm, { contentType: 'private_key', title: '', encryptedData: '' })
  await fetchContents()
}

const handleDelete = async (id: number) => {
  await deleteContent(id)
  ElMessage.success('已删除 / Deleted')
  await fetchContents()
}
</script>
