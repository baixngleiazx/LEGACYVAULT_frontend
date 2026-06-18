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
            <div style="display:flex;gap:8px;width:100%">
              <el-input v-model="verifyForm.emailOtp" placeholder="邮箱验证码（6位）" maxlength="6" />
              <el-button @click="handleSendOtp('email')" :loading="otpLoading === 'email'">发送</el-button>
            </div>
          </el-form-item>
          <el-form-item label="手机OTP">
            <div style="display:flex;gap:8px;width:100%">
              <el-input v-model="verifyForm.phoneOtp" placeholder="手机验证码（6位）" maxlength="6" />
              <el-button @click="handleSendOtp('phone')" :loading="otpLoading === 'phone'">发送</el-button>
            </div>
          </el-form-item>
          <el-form-item label="人脸核验">
            <el-input v-model="verifyForm.faceImageBase64" type="textarea" :rows="2" placeholder="Mock模式可点击下方按钮生成采集占位数据" />
            <el-button style="margin-top:8px" @click="captureMockFace">模拟采集人脸</el-button>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleVerify" :loading="loading" size="large">开始核验</el-button>
          </el-form-item>
        </el-form>
      </div>
      <!-- 步骤2：内容展示 -->
      <div v-if="step === 1">
        <el-alert title="核验成功。密文材料已授权下发，内容将在本浏览器内解密展示。" type="success" show-icon :closable="false" style="margin-bottom:16px" />
        <el-card v-for="item in contents" :key="item.contentId" style="margin-bottom:12px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
              <span>{{ item.contentTypeText }} - {{ item.title }}</span>
              <el-button size="small" @click="decryptItem(item)" :loading="item.decrypting">本地解密</el-button>
            </div>
          </template>
          <p style="word-break:break-all;font-family:monospace;background:#f5f7fa;padding:12px;border-radius:4px;white-space:pre-wrap">
            {{ item.localPlainText || '待本地解密 / Waiting for local decrypt' }}
          </p>
          <p style="color:#909399;font-size:12px;margin-top:8px">内容哈希：{{ item.contentHash }}</p>
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
import { sendDeliveryOtp, verifyAndDecrypt } from '../../api/delivery'
import { ElMessage } from 'element-plus'
import { decryptContent } from '../../utils/crypto'

const route = useRoute()
const loading = ref(false)
const otpLoading = ref<'email' | 'phone' | ''>('')
const step = ref(0)
const contents = ref<any[]>([])

const verifyForm = reactive({
  linkToken: (route.query.token as string) || '',
  emailOtp: '',
  phoneOtp: '',
  faceImageBase64: '',
  deviceFingerprint: 'web-h5-' + Date.now()
})

const handleVerify = async () => {
  if (!verifyForm.emailOtp || !verifyForm.phoneOtp || !verifyForm.faceImageBase64) {
    ElMessage.warning('请完成邮箱、手机和人脸三重核验'); return
  }
  loading.value = true
  try {
    const res: any = await verifyAndDecrypt(verifyForm)
    contents.value = res.data || []
    step.value = 1
    ElMessage.success('身份核验通过')
  } catch (e: any) {
    const message = e.message || '核验失败'
    ElMessage.error(message)
  } finally { loading.value = false }
}

const handleSendOtp = async (channel: 'email' | 'phone') => {
  if (!verifyForm.linkToken) {
    ElMessage.warning('请先填写链接Token')
    return
  }
  otpLoading.value = channel
  try {
    await sendDeliveryOtp({ linkToken: verifyForm.linkToken, channel })
    ElMessage.success('验证码发送成功')
  } catch (e: any) {
    ElMessage.error(e.message || '验证码发送失败')
  } finally {
    otpLoading.value = ''
  }
}

const captureMockFace = () => {
  verifyForm.faceImageBase64 = btoa(`mock-face:${Date.now()}`)
}

const decryptItem = async (item: any) => {
  item.decrypting = true
  try {
    item.localPlainText = await decryptContent(item.encryptedData, item.k2Shard, item.k3Shard)
  } catch (e: any) {
    ElMessage.error(e.message || '本地解密失败')
  } finally {
    item.decrypting = false
  }
}
</script>

<style scoped>
.login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f7fa; }

@media print {
  .login-page {
    display: none;
  }
}
</style>
