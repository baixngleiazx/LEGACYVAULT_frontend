<template>
  <div>
    <h3 style="margin-bottom:16px">步骤 1：创建账户 / Create Account</h3>

    <!-- Tab 切换：邮箱 / 手机号 -->
    <el-tabs v-model="registerType" stretch style="margin-bottom: 16px;">
      <el-tab-pane label="邮箱注册 / Email" name="email" />
      <el-tab-pane label="手机号注册 / Phone" name="phone" />
    </el-tabs>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
      <el-form-item prop="email" v-if="registerType === 'email'">
        <el-input v-model="form.email" placeholder="邮箱 / Email" size="large" />
      </el-form-item>
      <el-form-item prop="phone" v-if="registerType === 'phone'">
        <el-input v-model="form.phone" placeholder="手机号 / Phone" size="large" />
      </el-form-item>
      <el-form-item prop="verifyCode">
        <div style="display:flex;gap:8px;width:100%">
          <el-input v-model="form.verifyCode" placeholder="验证码 / Code" size="large" style="flex:1" maxlength="6" />
          <el-button size="large" @click="handleSendCode" :disabled="countdown > 0" :loading="sendingCode">
            {{ countdown > 0 ? `${countdown}s` : '获取验证码 / Get Code' }}
          </el-button>
        </div>
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="form.password" type="password" placeholder="密码（8-32位）/ Password" size="large" show-password />
      </el-form-item>
      <el-form-item prop="nickname">
        <el-input v-model="form.nickname" placeholder="昵称（选填）/ Nickname" size="large" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="large" style="width:100%" @click="handleRegister" :loading="loading">
          注册并进入下一步 / Register & Next
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { register, sendVerifyCode } from '../../api/auth'
import { useAuthStore } from '../../stores/auth'
import { useRegistrationStore } from '../../stores/registration'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['next'])
const authStore = useAuthStore()
const registrationStore = useRegistrationStore()
const formRef = ref()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const registerType = ref('email')
const form = reactive({ email: '', phone: '', verifyCode: '', password: '', nickname: '' })

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^1[3-9]\d{9}$/

const rules = computed(() => {
  const base: any = {
    verifyCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 8, message: '密码至少8位', trigger: 'blur' }
    ]
  }
  if (registerType.value === 'email') {
    base.email = [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email' as const, message: '邮箱格式不正确', trigger: 'blur' }
    ]
  } else {
    base.phone = [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: phoneRegex, message: '手机号格式不正确', trigger: 'blur' }
    ]
  }
  return base
})

async function handleSendCode() {
  const target = registerType.value === 'email' ? form.email : form.phone
  if (!target) { ElMessage.warning('请先填写联系方式'); return }
  if (registerType.value === 'email' && !emailRegex.test(target)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }
  if (registerType.value === 'phone' && !phoneRegex.test(target)) {
    ElMessage.warning('手机号格式不正确')
    return
  }
  sendingCode.value = true
  try {
    await sendVerifyCode({ target, codeType: 'register' })
    ElMessage.success('验证码发送成功')
    countdown.value = 60
    const t = setInterval(() => { countdown.value--; if (countdown.value <= 0) clearInterval(t) }, 1000)
  } catch (e: any) {
    ElMessage.error(e.message || '验证码发送失败')
  } finally { sendingCode.value = false }
}

async function handleRegister() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const data: any = { verifyCode: form.verifyCode, password: form.password, nickname: form.nickname || undefined }
    if (registerType.value === 'email') data.email = form.email
    else data.phone = form.phone
    await register(data)
    ElMessage.success('账户创建成功，请登录以继续安全设置')
    // 注册完成后需要登录才能继续步骤 2-5
    await authStore.login(
      registerType.value === 'email' ? form.email : form.phone!,
      form.password
    )
    await registrationStore.fetchStatus()
    emit('next')
  } finally { loading.value = false }
}
</script>
