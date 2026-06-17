<template>
  <div>
    <h3 style="margin-bottom:16px">步骤 4：KYC 身份核验 / KYC Verification</h3>

    <!-- Pro 套餐以下用户 -->
    <div v-if="!showKycForm">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:16px">
        普通用户可跳过此步骤。若账户资产超过阈值，将触发后置 KYC 核验。
      </el-alert>
    </div>

    <!-- Pro / Vault 套餐用户：显示表单 -->
    <div v-else>
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom:16px">
        Pro / Vault 套餐用户需完成 KYC 核验后方可使用完整资产功能
      </el-alert>
      <el-form :model="form" label-width="120px">
        <el-form-item label="真实姓名 / Name">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="证件类型 / Type">
          <el-select v-model="form.idType" style="width:100%">
            <el-option label="身份证 / ID Card" value="ID_CARD" />
            <el-option label="护照 / Passport" value="PASSPORT" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件号 / ID No.">
          <el-input v-model="form.idNo" placeholder="请输入证件号" />
        </el-form-item>
      </el-form>
    </div>

    <div style="display:flex;gap:12px;margin-top:24px;justify-content:space-between">
      <el-button @click="$emit('prev')">上一步 / Prev</el-button>
      <div style="display:flex;gap:12px">
        <el-button @click="$emit('skip')">跳过 / Skip</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading" :disabled="!showKycForm">
          提交并下一步 / Submit & Next
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { submitKyc } from '../../api/kyc'
import { useRegistrationStore } from '../../stores/registration'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['next', 'prev', 'skip'])
const registrationStore = useRegistrationStore()
const loading = ref(false)
const form = reactive({ realName: '', idType: 'ID_CARD', idNo: '' })

/** Pro (2) / Vault (3) 套餐才展示 KYC 表单 */
const showKycForm = computed(() => {
  const plan = registrationStore.planId
  return plan != null && plan >= 2
})

async function handleSubmit() {
  if (!form.realName || !form.idNo) {
    ElMessage.warning('请填写完整信息')
    return
  }
  loading.value = true
  try {
    await submitKyc({
      realName: form.realName,
      idType: form.idType,
      idNo: form.idNo,
      livenessPassed: true // Mock：活体直接通过
    })
    await registrationStore.completeStep(4)
    ElMessage.success('KYC 材料已提交')
    emit('next')
  } finally { loading.value = false }
}
</script>
