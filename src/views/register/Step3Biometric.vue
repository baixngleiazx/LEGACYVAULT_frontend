<template>
  <div>
    <h3 style="margin-bottom:16px">步骤 3：生物特征录入 / Biometric</h3>
    <el-alert type="info" :closable="false" show-icon style="margin-bottom:16px">
      录入人脸或指纹用于高风险操作二次确认。仅存储加密特征标识，不保存原始图像。
    </el-alert>

    <div style="display:flex;gap:16px;margin-bottom:24px">
      <el-card v-for="t in types" :key="t.type"
               :class="{selected: selected === t.type}"
               style="flex:1;cursor:pointer" @click="selected = t.type">
        <div style="text-align:center">
          <el-icon :size="48"><component :is="t.icon" /></el-icon>
          <div style="margin-top:8px;font-weight:bold">{{ t.label }}</div>
        </div>
      </el-card>
    </div>

    <div style="text-align:center;padding:20px">
      <el-button type="primary" size="large" @click="handleCapture" :loading="loading" :disabled="!selected">
        开始采集 / Start Capture
      </el-button>
      <div v-if="captureResult" style="margin-top:16px">
        <el-result icon="success" title="采集成功" />
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-top:24px;justify-content:space-between">
      <el-button @click="$emit('prev')">上一步 / Prev</el-button>
      <div style="display:flex;gap:12px">
        <el-button @click="$emit('skip')">跳过 / Skip</el-button>
        <el-button type="primary" @click="handleNext" :disabled="!captureResult">下一步 / Next</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { User, Stamp } from '@element-plus/icons-vue'
import { registerBiometric } from '../../api/auth'
import { useRegistrationStore } from '../../stores/registration'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['next', 'prev', 'skip'])
const registrationStore = useRegistrationStore()
const selected = ref<string | null>(null)
const loading = ref(false)
const captureResult = ref(false)

const types = [
  { type: 'FACE', label: '人脸 / Face', icon: shallowRef(User) },
  { type: 'FINGER', label: '指纹 / Finger', icon: shallowRef(Stamp) }
]

async function handleCapture() {
  if (!selected.value) return
  loading.value = true
  try {
    // Mock：生成一个模拟特征哈希（真实模式调用浏览器 WebAuthn / MediaDevices API）
    const mockHash = 'HASH_' + Date.now() + '_' + Math.random().toString(36).slice(2)
    await registerBiometric({
      biometricType: selected.value,
      featureHash: mockHash,
      deviceInfo: navigator.userAgent.slice(0, 100)
    })
    captureResult.value = true
    ElMessage.success('生物特征录入成功')
  } catch (e: any) {
    ElMessage.error(e.message || '采集失败，请检查设备权限')
  } finally { loading.value = false }
}

async function handleNext() {
  await registrationStore.completeStep(3)
  emit('next')
}
</script>

<style scoped>
.selected { border: 2px solid #409eff; }
</style>
