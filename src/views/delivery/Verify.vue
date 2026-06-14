<template>
  <div class="login-page">
    <el-card style="width:600px;max-width:90vw">
      <h2 style="text-align:center;margin-bottom:24px">遗产交付核验</h2>
      <!-- 步骤条 -->
      <el-steps :active="step" finish-status="success" style="margin-bottom:32px">
        <el-step title="身份核验" />
        <el-step title="查看内容" />
      </el-steps>
      <!-- 步骤1：身份核验 -->
      <div v-if="step === 0">
        <el-form :model="verifyForm" label-width="100px">
          <el-form-item label="链接Token">
            <el-input v-model="verifyForm.linkToken" :placeholder="route.query.token as string || '输入交付链接Token'" />
          </el-form-item>
          <el-form-item label="邮箱OTP">
            <el-input v-model="verifyForm.emailOtp" placeholder="邮箱验证码（6位）" maxlength="6" />
          </el-form-item>
          <el-form-item label="手机OTP">
            <el-input v-model="verifyForm.phoneOtp" placeholder="手机验证码（6位）" maxlength="6" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleVerify" :loading="loading" size="large">开始核验</el-button>
          </el-form-item>
        </el-form>
      </div>
      <!-- 步骤2：内容展示 -->
      <div v-if="step === 1">
        <el-alert title="核验成功！以下为可交付的加密内容" type="success" show-icon :closable="false" style="margin-bottom:16px" />
        <el-card v-for="item in contents" :key="item.contentId" style="margin-bottom:12px">
          <template #header>
            <span>{{ item.contentTypeText }} - {{ item.title }}</span>
          </template>
          <p style="word-break:break-all;font-family:monospace;background:#f5f7fa;padding:12px;border-radius:4px">
            {{ item.decryptedData }}
          </p>
          <p style="color:#909399;font-size:12px;margin-top:8px">
            存证哈希：{{ item.blockchainTxHash }}
          </p>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { verifyAndDecrypt } from '../../api/delivery'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const step = ref(0)
const contents = ref<any[]>([])

const verifyForm = reactive({
  linkToken: (route.query.token as string) || '',
  emailOtp: '',
  phoneOtp: '',
  faceImageBase64: undefined as string | undefined,
  deviceFingerprint: 'web-h5-' + Date.now()
})

const handleVerify = async () => {
  if (!verifyForm.emailOtp || !verifyForm.phoneOtp) {
    ElMessage.warning('请填写邮箱和手机验证码'); return
  }
  loading.value = true
  try {
    const res: any = await verifyAndDecrypt(verifyForm)
    contents.value = res.data || []
    step.value = 1
    ElMessage.success('身份核验通过')
  } catch (e: any) {
    ElMessage.error(e.message || '核验失败')
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f7fa; }
</style>
