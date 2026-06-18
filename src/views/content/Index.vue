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
      <el-table-column label="操作 / Actions" width="220" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button type="primary" size="small" text @click="handleView(row.id)">查看 / View</el-button>
            <el-popconfirm title="确定删除？/ Are you sure to delete?" @confirm="handleDelete(row.id)">
              <template #reference><el-button type="danger" size="small" text>删除 / Delete</el-button></template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- 添加内容弹窗 -->
    <el-dialog v-model="showAddDialog" title="添加加密内容 / Add Encrypted Content" width="640px">
      <el-form :model="addForm" label-width="130px">
        <el-form-item label="类型 / Type">
          <el-select v-model="addForm.contentType">
            <el-option value="private_key" label="加密私钥 / Private Key" />
            <el-option value="account_password" label="账户密码 / Account Password" />
            <el-option value="last_words" label="遗言文本 / Last Words" />
            <el-option value="file" label="文件附件 / File Attachment" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题 / Title"><el-input v-model="addForm.title" /></el-form-item>
        <template v-if="addForm.contentType === 'account_password'">
          <el-form-item label="账号 / Account"><el-input v-model="passwordFields.account" /></el-form-item>
          <el-form-item label="密码 / Password"><el-input v-model="passwordFields.password" type="password" show-password /></el-form-item>
          <el-form-item label="URL"><el-input v-model="passwordFields.url" /></el-form-item>
        </template>
        <template v-else-if="addForm.contentType === 'file'">
          <el-form-item label="文件 / File">
            <input type="file" @change="handleFileChange" />
          </el-form-item>
          <el-form-item label="文件预览 / Preview">
            <el-input v-model="addForm.plainText" type="textarea" :rows="3" disabled />
          </el-form-item>
        </template>
        <el-form-item v-else label="明文 / Plain Data">
          <el-input v-model="addForm.plainText" type="textarea" :rows="5" placeholder="明文仅在浏览器本地加密，不会直接上传 / Plain data is encrypted locally before upload" />
        </el-form-item>
        <el-form-item label="主密码 / Master Key">
          <el-input v-model="addForm.masterPassword" type="password" show-password placeholder="用于PBKDF2派生AES-GCM密钥 / Used to derive AES-GCM key" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消 / Cancel</el-button>
        <el-button type="primary" @click="handleAdd" :loading="saving">本地加密并保存 / Encrypt & Save</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="showViewDialog" title="本地解密查看 / Local Decrypt Preview" width="680px" @closed="clearViewState">
      <div v-if="viewItem">
        <el-descriptions :column="2" border style="margin-bottom:16px">
          <el-descriptions-item label="标题">{{ viewItem.title }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ viewItem.contentTypeText }}</el-descriptions-item>
          <el-descriptions-item label="哈希">{{ viewItem.contentHash }}</el-descriptions-item>
          <el-descriptions-item label="文件">{{ viewItem.fileName || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-alert
          v-if="!localPlainText"
          type="info"
          :closable="false"
          show-icon
          title="将使用本设备 IndexedDB 中的 K1 和服务端托管 K2 在浏览器内解密。"
          style="margin-bottom:16px"
        />
        <el-input
          v-if="localPlainText"
          v-model="localPlainText"
          type="textarea"
          :rows="10"
          readonly
          class="plain-preview"
        />
      </div>
      <template #footer>
        <el-button @click="showViewDialog = false">关闭 / Close</el-button>
        <el-button type="primary" @click="decryptViewItem" :loading="viewLoading" :disabled="!viewItem || !!localPlainText">
          本地解密 / Decrypt Locally
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { listContents, createContent, deleteContent, getContentDetail } from '../../api/content'
import { ElMessage } from 'element-plus'
import { decryptContent, encryptContent, getLocalShard, saveLocalShard } from '../../utils/crypto'

const contents = ref<any[]>([])
const activeType = ref('')
const showAddDialog = ref(false)
const showViewDialog = ref(false)
const saving = ref(false)
const viewLoading = ref(false)
const viewItem = ref<any>(null)
const localPlainText = ref('')
const addForm = reactive({
  contentType: 'private_key',
  title: '',
  plainText: '',
  masterPassword: '',
  fileName: '',
  fileSize: 0
})
const passwordFields = reactive({ account: '', password: '', url: '' })

const fetchContents = async () => {
  const res: any = await listContents(activeType.value || undefined)
  contents.value = res.data || []
}

onMounted(fetchContents)
watch(activeType, fetchContents)

const handleAdd = async () => {
  const plainText = buildPlainText()
  if (!addForm.title || !plainText || !addForm.masterPassword) {
    ElMessage.warning('请填写标题、内容和主密码 / Title, content and master key are required')
    return
  }
  saving.value = true
  try {
    const encrypted = await encryptContent(plainText, addForm.masterPassword)
    await saveLocalShard(encrypted.contentHash, encrypted.k1Shard)
    await createContent({
      contentType: addForm.contentType,
      title: addForm.title,
      encryptedData: encrypted.encryptedData,
      contentHash: encrypted.contentHash,
      fileName: addForm.fileName || undefined,
      fileSize: addForm.fileSize || undefined,
      k2Shard: encrypted.k2Shard,
      k3Shard: encrypted.k3Shard
    })
    ElMessage.success('已本地加密并保存 / Encrypted locally and saved')
    showAddDialog.value = false
    resetAddForm()
    await fetchContents()
  } finally {
    saving.value = false
  }
}

const buildPlainText = () => {
  if (addForm.contentType === 'account_password') {
    return JSON.stringify(passwordFields)
  }
  return addForm.plainText
}

const resetAddForm = () => {
  Object.assign(addForm, { contentType: 'private_key', title: '', plainText: '', masterPassword: '', fileName: '', fileSize: 0 })
  Object.assign(passwordFields, { account: '', password: '', url: '' })
}

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('当前自测模式限制单文件10MB / Current self-test mode limits files to 10MB')
    return
  }
  addForm.fileName = file.name
  addForm.fileSize = file.size
  addForm.plainText = await fileToDataUrl(file)
}

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const handleDelete = async (id: number) => {
  await deleteContent(id)
  ElMessage.success('已删除 / Deleted')
  await fetchContents()
}

const handleView = async (id: number) => {
  viewLoading.value = true
  try {
    const res: any = await getContentDetail(id)
    viewItem.value = res.data
    localPlainText.value = ''
    showViewDialog.value = true
  } finally {
    viewLoading.value = false
  }
}

const decryptViewItem = async () => {
  if (!viewItem.value) return
  viewLoading.value = true
  try {
    const k1Shard = await getLocalShard(viewItem.value.contentHash)
    if (!k1Shard) {
      ElMessage.error('当前设备未找到本地K1分片，无法解密。请使用创建该资产的设备或恢复本地分片。')
      return
    }
    if (!viewItem.value.encryptedData || !viewItem.value.k2Shard) {
      ElMessage.error('内容详情缺少密文或托管K2分片')
      return
    }
    localPlainText.value = await decryptContent(viewItem.value.encryptedData, k1Shard, viewItem.value.k2Shard)
  } catch (e: any) {
    ElMessage.error(e.message || '本地解密失败')
  } finally {
    viewLoading.value = false
  }
}

const clearViewState = () => {
  localPlainText.value = ''
  viewItem.value = null
}
</script>

<style scoped>
.action-buttons {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.action-buttons :deep(.el-button) {
  margin-left: 0;
}

.plain-preview :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
</style>
