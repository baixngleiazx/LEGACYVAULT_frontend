<template>
  <div class="login-page">
    <div class="login-card">
      <h2>LegacyVault 注册 / Sign Up</h2>

      <!-- Tab 切换：邮箱注册 / 手机号注册 -->
      <el-tabs v-model="registerType" stretch style="margin-bottom: 16px;">
        <el-tab-pane label="邮箱注册 / Email" name="email" />
        <el-tab-pane label="手机号注册 / Phone" name="phone" />
      </el-tabs>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <!-- 邮箱注册 -->
        <el-form-item prop="email" v-if="registerType === 'email'">
          <el-input v-model="form.email" placeholder="邮箱 / Email" size="large" />
        </el-form-item>

        <!-- 手机号注册 -->
        <el-form-item prop="phone" v-if="registerType === 'phone'">
          <el-input v-model="form.phone" placeholder="手机号 / Phone Number" size="large" />
        </el-form-item>

        <!-- 验证码 -->
        <el-form-item prop="verifyCode">
          <div style="display:flex;gap:8px;width:100%">
            <el-input v-model="form.verifyCode" placeholder="验证码 / Verification Code" size="large" style="flex:1" maxlength="6" />
            <el-button size="large" @click="handleSendCode" :disabled="countdown > 0" :loading="sendingCode">
              {{ countdown > 0 ? `${countdown}s 重新获取 / Resend` : '获取验证码 / Get Code' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码（8-32位）/ Password (8-32 chars)" size="large" show-password />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input v-model="form.nickname" placeholder="昵称（选填）/ Nickname (optional)" size="large" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" style="width:100%" @click="handleRegister" :loading="loading">注册 / Sign Up</el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>已有账号？/ Already have an account?</span>
        <el-link type="primary" @click="$router.push('/login')">去登录 / Log In</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register, sendVerifyCode } from '../../api/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const registerType = ref('email')

const form = reactive({ email: '', phone: '', verifyCode: '', password: '', nickname: '' })

/** 邮箱正则 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** 手机号正则 */
const phoneRegex = /^1[3-9]\d{9}$/

/** 动态校验规则 */
const rules = computed(() => {
  const base: any = {
    verifyCode: [
      { required: true, message: '请输入验证码 / Please enter the verification code', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码 / Please enter your password', trigger: 'blur' },
      { min: 8, message: '密码至少8位 / Password must be at least 8 characters', trigger: 'blur' }
    ]
  }
  if (registerType.value === 'email') {
    base.email = [
      { required: true, message: '请输入邮箱 / Please enter your email', trigger: 'blur' },
      { type: 'email' as const, message: '邮箱格式不正确 / Invalid email format', trigger: 'blur' }
    ]
  } else {
    base.phone = [
      { required: true, message: '请输入手机号 / Please enter your phone number', trigger: 'blur' },
      { pattern: phoneRegex, message: '手机号格式不正确 / Invalid phone number format', trigger: 'blur' }
    ]
  }
  return base
})

/** 发送验证码 */
const handleSendCode = async () => {
  let target = ''
  if (registerType.value === 'email') {
    target = form.email
    if (!target) { ElMessage.warning('请先输入邮箱 / Please enter your email first'); return }
    if (!emailRegex.test(target)) { ElMessage.warning('邮箱格式不正确 / Invalid email format'); return }
  } else {
    target = form.phone
    if (!target) { ElMessage.warning('请先输入手机号 / Please enter your phone number first'); return }
    if (!phoneRegex.test(target)) { ElMessage.warning('手机号格式不正确 / Invalid phone number format'); return }
  }

  sendingCode.value = true
  try {
    await sendVerifyCode({ target, codeType: 'register' })
    ElMessage.success('验证码发送成功 / Code sent successfully')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (e: any) {
    ElMessage.error(e.message || '验证码发送失败 / Failed to send code')
  } finally {
    sendingCode.value = false
  }
}

/** 注册 */
const handleRegister = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    const data: any = {
      verifyCode: form.verifyCode,
      password: form.password,
      nickname: form.nickname || undefined
    }
    if (registerType.value === 'email') {
      data.email = form.email
    } else {
      data.phone = form.phone
    }
    await register(data)
    ElMessage.success('注册成功，请登录 / Registration successful, please log in')
    router.push('/login')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-card { width: 420px; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.login-card h2 { text-align: center; margin-bottom: 24px; }
.login-footer { text-align: center; margin-top: 16px; font-size: 14px; color: #909399; }
</style>
