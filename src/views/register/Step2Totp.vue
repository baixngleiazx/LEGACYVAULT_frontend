<template>
  <div>
    <h3 style="margin-bottom:16px">步骤 2：绑定 TOTP / Bind TOTP</h3>
    <el-alert type="info" :closable="false" show-icon style="margin-bottom:16px">
      使用 Google Authenticator / Microsoft Authenticator 扫码，或插入 YubiKey 硬件密钥
    </el-alert>

    <el-tabs v-model="mode" stretch>
      <el-tab-pane label="软件令牌 / App" name="app" />
      <el-tab-pane label="硬件密钥 / YubiKey" name="hardware" />
    </el-tabs>

    <!-- 软件令牌模式 -->
    <div v-if="mode === 'app'">
      <div v-if="!totpSecret" style="text-align:center;padding:20px">
        <el-button type="primary" @click="handleInitTotp" :loading="loading">初始化绑定 / Init</el-button>
      </div>
      <div v-else>
        <div style="text-align:center;margin:16px 0">
          <img :src="qrCodeUrl" alt="QR Code" style="width:200px;height:200px" />
        </div>
        <el-input :model-value="totpSecret || ''" readonly placeholder="手动输入密钥">
          <template #append>
            <el-button @click="copySecret">复制</el-button>
          </template>
        </el-input>
        <el-input v-model="totpCode" placeholder="输入 6 位验证码 / 6-digit code" maxlength="6" style="margin-top:12px" size="large" />
      </div>
    </div>

    <!-- 硬件密钥模式 -->
    <div v-else style="text-align:center;padding:40px 20px">
      <el-icon :size="64" color="#409eff"><Key /></el-icon>
      <p style="margin:16px 0">请插入 YubiKey 并按下按钮</p>
      <el-button type="primary" @click="handleWebAuthn" :loading="loading">开始绑定 / Start</el-button>
    </div>

    <!-- 底部按钮 -->
    <div style="display:flex;gap:12px;margin-top:24px;justify-content:space-between">
      <el-button @click="$emit('prev')">上一步 / Prev</el-button>
      <div style="display:flex;gap:12px">
        <el-button @click="$emit('skip')">跳过 / Skip</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="loading" :disabled="mode === 'app' && !totpSecret">
          确认并下一步 / Next
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Key } from '@element-plus/icons-vue'
import { initTotpBind, confirmTotpBind, initWebAuthn, confirmWebAuthn } from '../../api/auth'
import { useRegistrationStore } from '../../stores/registration'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['next', 'prev', 'skip'])
const registrationStore = useRegistrationStore()
const mode = ref<'app' | 'hardware'>('app')
const loading = ref(false)
const totpSecret = ref<string | null>(null)
const qrCodeUrl = ref('')
const totpCode = ref('')

async function handleInitTotp() {
  loading.value = true
  try {
    const res: any = await initTotpBind()
    totpSecret.value = res.data.secret
    qrCodeUrl.value = res.data.qrCodeUrl
    registrationStore.tempTotpSecret = res.data.secret
    registrationStore.tempTotpQrCodeUrl = res.data.qrCodeUrl
  } finally { loading.value = false }
}

function copySecret() {
  if (totpSecret.value) {
    navigator.clipboard.writeText(totpSecret.value)
    ElMessage.success('密钥已复制')
  }
}

async function handleWebAuthn() {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    ElMessage.error('当前浏览器不支持 WebAuthn / Passkey')
    return
  }
  loading.value = true
  try {
    const initRes: any = await initWebAuthn()
    const options = initRes.data
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: base64UrlToBuffer(options.challenge),
        rp: {
          id: location.hostname,
          name: options.rpName || 'LegacyVault'
        },
        user: {
          id: new TextEncoder().encode(options.userId),
          name: options.userName || `user-${options.userId}`,
          displayName: options.userName || `user-${options.userId}`
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        timeout: options.timeout || 300000,
        attestation: 'none',
        authenticatorSelection: {
          userVerification: 'preferred',
          residentKey: 'preferred'
        }
      }
    }) as PublicKeyCredential | null

    if (!credential) {
      throw new Error('未获取到硬件密钥凭证')
    }
    const response = credential.response as AuthenticatorAttestationResponse
    const publicKeyGetter = response as AuthenticatorAttestationResponse & { getPublicKey?: () => ArrayBuffer | null }
    const payload = {
      credentialId: bufferToBase64Url(credential.rawId),
      clientDataJSON: bufferToBase64Url(response.clientDataJSON),
      authenticatorData: bufferToBase64Url(response.getAuthenticatorData()),
      attestationObject: bufferToBase64Url(response.attestationObject),
      publicKey: publicKeyGetter.getPublicKey?.() ? bufferToBase64Url(publicKeyGetter.getPublicKey()!) : undefined,
      origin: location.origin,
      deviceName: 'YubiKey 5'
    }
    await confirmWebAuthn(payload)
    ElMessage.success('硬件密钥绑定成功')
    await registrationStore.completeStep(2)
    emit('next')
  } catch (e: any) {
    ElMessage.error(e.message || '硬件密钥绑定失败')
  } finally { loading.value = false }
}

function base64UrlToBuffer(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function handleConfirm() {
  if (mode.value === 'hardware') {
    await handleWebAuthn()
    return
  }
  if (!totpCode.value || totpCode.value.length !== 6) {
    ElMessage.warning('请输入 6 位验证码')
    return
  }
  loading.value = true
  try {
    await confirmTotpBind(totpCode.value)
    await registrationStore.completeStep(2)
    registrationStore.tempTotpSecret = null
    registrationStore.tempTotpQrCodeUrl = null
    ElMessage.success('TOTP 绑定成功')
    emit('next')
  } finally { loading.value = false }
}
</script>
