<template>
  <div class="login-page">
    <div class="login-card">
      <h2>LegacyVault 登录 / Log In</h2>

      <!-- Tab 切换：密码登录 / 验证码登录 -->
      <el-tabs v-model="activeTab" stretch style="margin-bottom: 16px;">
        <el-tab-pane label="密码登录 / Password" name="password" />
        <el-tab-pane label="验证码登录 / Code" name="code" />
      </el-tabs>

      <!-- 密码登录表单 -->
      <el-form v-if="activeTab === 'password'" :model="pwdForm" :rules="pwdRules" ref="pwdFormRef" label-width="0">
        <el-form-item prop="email">
          <el-input v-model="pwdForm.email" placeholder="手机号或邮箱/ Phone Number" prefix-icon="Message" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="pwdForm.password" type="password" placeholder="密码 / Password" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item prop="totpCode" v-if="showTotp">
          <el-input v-model="pwdForm.totpCode" placeholder="TOTP验证码（6位）/ TOTP Code (6 digits)" size="large" maxlength="6" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" @click="handlePwdLogin" :loading="loading">登录 / Log In</el-button>
        </el-form-item>
      </el-form>

      <!-- 验证码登录表单 -->
      <el-form v-if="activeTab === 'code'" :model="codeForm" :rules="codeRules" ref="codeFormRef" label-width="0">
        <el-form-item prop="target">
          <el-input v-model="codeForm.target" placeholder="手机号或邮箱 / Phone Number or Email" prefix-icon="Message" size="large" />
        </el-form-item>
        <el-form-item prop="verifyCode">
          <div style="display:flex;gap:8px;width:100%">
            <el-input v-model="codeForm.verifyCode" placeholder="验证码 / Verification Code" size="large" style="flex:1" maxlength="6" />
            <el-button size="large" @click="handleSendCode" :disabled="countdown > 0" :loading="sendingCode">
              {{ countdown > 0 ? `${countdown}s 重新获取 / Resend` : '获取验证码 / Get Code' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" @click="handleCodeLogin" :loading="loading">验证码登录 / Code Log In</el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>还没有账号？/ Don't have an account?</span>
        <el-link type="primary" @click="$router.push('/register')">立即注册 / Sign Up</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { sendVerifyCode } from '../../api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const pwdFormRef = ref()
const codeFormRef = ref()
const loading = ref(false)
const sendingCode = ref(false)
const showTotp = ref(false)
const activeTab = ref('password')
const countdown = ref(0)

const pwdForm = reactive({ email: '', password: '', totpCode: '' })
const pwdRules = {
  email: [{ required: true, message: '请输入邮箱 / Please enter your email', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码 / Please enter your password', trigger: 'blur' }]
}

const codeForm = reactive({ target: '', verifyCode: '' })
const codeRules = {
  target: [{ required: true, message: '请输入手机号或邮箱 / Please enter your phone number or email', trigger: 'blur' }],
  verifyCode: [{ required: true, message: '请输入验证码 / Please enter the verification code', trigger: 'blur' }, { len: 6, message: '验证码为6位 / Code must be 6 digits', trigger: 'blur' }]
}

/** 密码登录 */
const handlePwdLogin = async () => {
  await pwdFormRef.value?.validate()
  loading.value = true
  try {
    await authStore.login(pwdForm.email, pwdForm.password, pwdForm.totpCode || undefined)
    ElMessage.success('登录成功 / Login successful')
    router.push('/dashboard')
  } catch (e: any) {
    if (e.message?.includes('TOTP')) showTotp.value = true
  } finally {
    loading.value = false
  }
}

/** 发送验证码 */
const handleSendCode = async () => {
  if (!codeForm.target) {
    ElMessage.warning('请先输入手机号或邮箱 / Please enter phone number or email first')
    return
  }
  sendingCode.value = true
  try {
    await sendVerifyCode({ target: codeForm.target, codeType: 'login' })
    ElMessage.success('验证码已发送（Mock模式请查看控制台日志）/ Code sent (check console log in Mock mode)')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } finally {
    sendingCode.value = false
  }
}

/** 验证码登录 */
const handleCodeLogin = async () => {
  await codeFormRef.value?.validate()
  loading.value = true
  try {
    await authStore.loginByCode(codeForm.target, codeForm.verifyCode)
    ElMessage.success('登录成功 / Login successful')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 420px; padding: 40px; background: white;
  border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-card h2 { text-align: center; margin-bottom: 24px; color: #303133; }
.login-footer { text-align: center; margin-top: 16px; font-size: 14px; color: #909399; }
</style>
