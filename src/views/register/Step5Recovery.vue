<template>
  <div>
    <h3 style="margin-bottom:16px">步骤 5：离线恢复码 / Recovery Codes</h3>

    <!-- 强依赖 TOTP -->
    <div v-if="!registrationStore.totpBound">
      <el-alert type="error" :closable="false" show-icon title="请先完成 TOTP 绑定" style="margin-bottom:16px">
        恢复码生成依赖 TOTP 绑定。请返回步骤 2 完成 TOTP 绑定后再继续。
      </el-alert>
      <el-button @click="$router.push('/register/step/2')">返回步骤 2</el-button>
    </div>

    <!-- 已生成 -->
    <div v-else-if="codes">
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom:16px">
        恢复码仅展示一次！刷新或离开页面后将无法再次查看。请立即复制 / 下载保存。
      </el-alert>
      <div class="codes-box">
        <div v-for="(code, idx) in codes" :key="idx" class="code-item">
          <span class="code-index">{{ idx + 1 }}.</span>
          <span class="code-value">{{ code }}</span>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px">
        <el-button @click="copyAll">复制全部 / Copy All</el-button>
        <el-button @click="downloadTxt">下载 TXT / Download</el-button>
      </div>
    </div>

    <!-- 未生成 -->
    <div v-else style="text-align:center;padding:40px">
      <el-button type="primary" size="large" @click="handleGenerate" :loading="loading">
        生成恢复码 / Generate Codes
      </el-button>
    </div>

    <div style="display:flex;gap:12px;margin-top:24px;justify-content:space-between">
      <el-button @click="$emit('prev')">上一步 / Prev</el-button>
      <div style="display:flex;gap:12px">
        <el-button type="primary" @click="handleFinish" :loading="loading">
          完成注册 / Finish
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { generateRecoveryCodes } from '../../api/auth'
import { useRegistrationStore } from '../../stores/registration'
import { useAuthStore } from '../../stores/auth'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['next', 'prev'])
const router = useRouter()
const registrationStore = useRegistrationStore()
const authStore = useAuthStore()
const loading = ref(false)
const codes = ref<string[] | null>(null)

// 优先使用 store 中已缓存的恢复码（防止刷新后丢失）
if (registrationStore.tempRecoveryCodes) {
  codes.value = registrationStore.tempRecoveryCodes
}

async function handleGenerate() {
  loading.value = true
  try {
    const res: any = await generateRecoveryCodes()
    codes.value = res.data
    registrationStore.tempRecoveryCodes = res.data
  } finally { loading.value = false }
}

function copyAll() {
  if (!codes.value) return
  navigator.clipboard.writeText(codes.value.join('\n'))
  ElMessage.success('已复制到剪贴板')
}

function downloadTxt() {
  if (!codes.value) return
  const blob = new Blob(
    ['LegacyVault 恢复码 / Recovery Codes\n生成时间: ' + new Date().toLocaleString() + '\n\n' + codes.value.join('\n')],
    { type: 'text/plain' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'legacyvault-recovery-codes.txt'
  a.click()
  URL.revokeObjectURL(url)
}

async function handleFinish() {
  if (!codes.value) {
    loading.value = true
    try {
      const res: any = await generateRecoveryCodes()
      codes.value = res.data
      registrationStore.tempRecoveryCodes = res.data
    } finally {
      loading.value = false
    }
  }

  await registrationStore.completeStep(5)
  await registrationStore.completeAll()
  ElMessage.success('注册完成')

  // 自动登录：如果当前没有 token，优先复用步骤 1/2 中已建立的登录态；否则直接进入仪表盘
  if (!authStore.token) {
    router.push('/login')
    return
  }

  router.push('/dashboard')
}

// 页面卸载时销毁前端缓存（恢复码仅一次性展示）
onBeforeUnmount(() => {
  if (router.currentRoute.value.path !== '/register/step/5') {
    registrationStore.tempRecoveryCodes = null
  }
})
</script>

<style scoped>
.codes-box {
  background: #f5f7fa; padding: 16px; border-radius: 8px;
  font-family: 'Courier New', monospace;
}
.code-item {
  display: flex; gap: 12px; padding: 6px 0;
  border-bottom: 1px dashed #dcdfe6;
}
.code-item:last-child { border-bottom: none; }
.code-index { color: #909399; width: 24px; }
.code-value { font-size: 16px; font-weight: bold; letter-spacing: 2px; color: #303133; }
</style>
