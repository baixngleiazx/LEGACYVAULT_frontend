<template>
  <div>
    <h2 style="margin-bottom:20px">系统配置 / System Configuration</h2>

    <el-card v-loading="loading">
      <el-form :model="form" label-width="220px" style="max-width:600px">
        <el-form-item label="全局继承人绑定上限">
          <el-input-number v-model="form.heirLimit" :min="1" :max="20" />
          <span style="margin-left:12px;color:#909399">单用户最多可绑定的继承人数</span>
        </el-form-item>

        <el-form-item label="KYC 触发资产阈值 (USD)">
          <el-input-number v-model="form.kycThreshold" :min="0" :step="100000" />
          <span style="margin-left:12px;color:#909399">超过此金额触发后置 KYC</span>
        </el-form-item>

        <el-form-item label="KYC 服务商">
          <el-select v-model="form.kycProvider" style="width:200px">
            <el-option label="Mock（模拟）" value="MOCK" />
            <el-option label="Jumio" value="JUMIO" />
            <el-option label="Sum&Substance" value="SUM_SUBSTANCE" />
          </el-select>
        </el-form-item>

        <el-form-item label="新加坡存储节点路径">
          <el-input v-model="form.storageSgPath" style="width:300px" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存配置 / Save</el-button>
          <el-button @click="loadConfig">重置 / Reset</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getSysConfig, updateSysConfig } from '../../api/admin'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saving = ref(false)
const form = reactive({
  heirLimit: 10,
  kycThreshold: 1000000,
  kycProvider: 'MOCK',
  storageSgPath: '/data/legacyvault/sg/'
})

onMounted(() => loadConfig())

async function loadConfig() {
  loading.value = true
  try {
    const res: any = await getSysConfig()
    const configs = res.data || []
    configs.forEach((c: any) => {
      if (c.configKey === 'heir.global_limit') form.heirLimit = parseInt(c.configValue) || 10
      if (c.configKey === 'kyc.asset_threshold') form.kycThreshold = parseFloat(c.configValue) || 1000000
      if (c.configKey === 'kyc.provider') form.kycProvider = c.configValue || 'MOCK'
      if (c.configKey === 'storage.sg_path') form.storageSgPath = c.configValue || '/data/legacyvault/sg/'
    })
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    await updateSysConfig([
      { configKey: 'heir.global_limit', configValue: String(form.heirLimit) },
      { configKey: 'kyc.asset_threshold', configValue: String(form.kycThreshold) },
      { configKey: 'kyc.provider', configValue: form.kycProvider },
      { configKey: 'storage.sg_path', configValue: form.storageSgPath }
    ])
    ElMessage.success('配置已保存')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
