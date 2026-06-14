<template>
  <div class="login-page">
    <el-card style="width:400px;text-align:center">
      <h2>继承人确认</h2>
      <p v-if="!done" style="margin:20px 0">您被指定为LegacyVault用户的继承人，请确认您已知晓此安排。</p>
      <el-button v-if="!done" type="primary" @click="handleConfirm" :loading="loading">确认知晓</el-button>
      <el-result v-else icon="success" title="确认成功" sub-title="您已成功确认继承人身份" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { confirmHeirInvite } from '../../api/heir'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const done = ref(false)

const handleConfirm = async () => {
  loading.value = true
  try {
    await confirmHeirInvite(route.query.token as string)
    done.value = true
    ElMessage.success('确认成功')
  } catch (e: any) {
    ElMessage.error(e.message || '确认失败')
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f7fa; }
</style>
