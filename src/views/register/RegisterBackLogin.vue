<template>
  <div class="register-back-login">
    <el-button class="back-login-btn" text type="primary" @click="goLogin">
      ← 返回登录页 / Back to Login
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
.register-back-login {
  display: flex;
  justify-content: flex-end;
  min-height: 24px;
  margin-bottom: 4px;
}

.back-login-btn {
  padding: 4px 0;
  font-size: 13px;
}

@media (max-width: 720px) {
  .register-back-login {
    justify-content: center;
  }
}
</style>
