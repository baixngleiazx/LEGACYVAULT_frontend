<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2>可信联系人 / Trusted Contacts</h2>
        <p class="page-subtitle">触发验证阶段会向可信联系人发送核查请求。建议配置 3-5 人。</p>
      </div>
      <el-button type="primary" @click="openAddDialog" :disabled="contacts.length >= 5">
        添加联系人 / Add
      </el-button>
    </div>

    <el-alert
      v-if="contacts.length < 3"
      type="warning"
      show-icon
      :closable="false"
      title="可信联系人不足"
      description="PRD 要求触发核查阶段配置 3-5 名可信联系人；当前数量不足时，触发流程可能无法进入下一阶段。"
      style="margin-bottom:16px"
    />

    <el-card>
      <el-table :data="contacts" v-loading="loading" style="width:100%" empty-text="暂无可信联系人">
        <el-table-column prop="name" label="姓名 / Name" width="150" show-overflow-tooltip />
        <el-table-column prop="email" label="邮箱 / Email" min-width="220" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号 / Phone" width="150" show-overflow-tooltip />
        <el-table-column prop="relationship" label="关系 / Relationship" width="160" show-overflow-tooltip />
        <el-table-column label="状态 / Status" width="140">
          <template #default>
            <el-tag type="success">已配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作 / Actions" width="120">
          <template #default="{ row }">
            <el-popconfirm title="确定删除该可信联系人？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" text size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="添加可信联系人 / Add Trusted Contact" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" maxlength="50" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" maxlength="100" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" maxlength="20" />
        </el-form-item>
        <el-form-item label="关系" prop="relationship">
          <el-select v-model="form.relationship" placeholder="请选择关系" style="width:100%" filterable allow-create default-first-option>
            <el-option v-for="item in relationshipOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { addTrustedContact, deleteTrustedContact, listTrustedContacts } from '../../api/trustedContact'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const contacts = ref<any[]>([])
const formRef = ref<FormInstance>()
const form = reactive({ name: '', email: '', phone: '', relationship: '' })
const relationshipOptions = [
  '配偶',
  '父亲',
  '母亲',
  '子女',
  '兄弟姐妹',
  '亲属',
  '朋友',
  '同事',
  '律师',
  '财务顾问',
  '家庭信托顾问',
  '其他'
]

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}

onMounted(() => {
  loadContacts()
})

async function loadContacts() {
  loading.value = true
  try {
    const res: any = await listTrustedContacts()
    contacts.value = res.data || []
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  Object.assign(form, { name: '', email: '', phone: '', relationship: '' })
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    await addTrustedContact({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      relationship: form.relationship || undefined
    })
    ElMessage.success('可信联系人已添加')
    dialogVisible.value = false
    await loadContacts()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await deleteTrustedContact(id)
  ElMessage.success('可信联系人已删除')
  await loadContacts()
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.page-subtitle {
  color: #909399;
  font-size: 13px;
  margin-top: 6px;
}
</style>
