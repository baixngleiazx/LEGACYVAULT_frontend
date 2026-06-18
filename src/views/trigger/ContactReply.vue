<template>
  <div class="reply-page">
    <el-card class="reply-card">
      <h2>可信联系人核查</h2>
      <p v-if="!done" class="hint">请根据你掌握的真实情况回复本次核查请求。</p>

      <div v-if="!done">
        <el-radio-group v-model="verificationStatus" class="reply-options">
          <el-radio :label="1">确认用户失联</el-radio>
          <el-radio :label="2">确认用户仍然活跃</el-radio>
        </el-radio-group>

        <el-button type="primary" size="large" @click="handleSubmit" :loading="loading" class="submit-btn">
          提交回复
        </el-button>
      </div>

      <el-result
        v-else
        icon="success"
        title="回复已提交"
        sub-title="感谢你的确认，系统会根据核查结果继续处理。"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { replyContactVerification } from '../../api/trigger'

const route = useRoute()
const loading = ref(false)
const done = ref(false)
const verificationStatus = ref<1 | 2>(1)

async function handleSubmit() {
  const rawId = Number(route.query.id)
  if (!Number.isInteger(rawId) || rawId <= 0) {
    ElMessage.error('核查链接无效')
    return
  }

  loading.value = true
  try {
    await replyContactVerification({
      verificationId: rawId,
      verificationStatus: verificationStatus.value,
      replyChannel: 'web'
    })
    done.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reply-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.reply-card {
  width: 440px;
  max-width: 100%;
  text-align: center;
}

.hint {
  color: #606266;
  margin: 16px 0 24px;
}

.reply-options {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin: 0 auto 24px;
  width: 220px;
}

.submit-btn {
  width: 180px;
}
</style>
