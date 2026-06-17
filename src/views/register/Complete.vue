<template>
  <div class="register-page">
    <div class="register-card" style="width:500px">
      <el-result icon="success" title="注册流程全部完成 / Registration Complete"
                 sub-title="欢迎加入 LegacyVault，请前往仪表盘开始使用">
        <template #extra>
          <el-button type="primary" size="large" @click="$router.push('/dashboard')">
            前往仪表盘 / Go to Dashboard
          </el-button>
          <el-button size="large" @click="$router.push('/account/security')">
            账户安全设置 / Security Settings
          </el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.register-card {
  padding: 40px; background: white;
  border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
</style>
