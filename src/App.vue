<template>
  <div class="app-container">
    <!-- 顶部导航栏（登录后显示） -->
    <el-container v-if="authStore.isLoggedIn">
      <el-header class="app-header">
        <div class="header-left">
          <h1 class="logo" @click="router.push('/dashboard')">LegacyVault</h1>
          <el-menu mode="horizontal" :default-active="activeMenu" router class="nav-menu">
            <el-menu-item index="/dashboard">仪表盘 / Dashboard</el-menu-item>
            <el-menu-item index="/heartbeat">心跳打卡 / Heartbeat</el-menu-item>
            <el-menu-item index="/content">资产保管 / Assets</el-menu-item>
            <el-menu-item index="/heir">继承人管理 / Heirs</el-menu-item>
            <el-menu-item index="/trigger">触发状态 / Trigger</el-menu-item>
          </el-menu>
        </div>
        <div class="header-right">
          <span class="user-info">{{ authStore.userInfo?.nickname || authStore.userInfo?.email }}</span>
          <el-button type="danger" size="small" @click="handleLogout">退出 / Logout</el-button>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 未登录时直接显示路由内容 -->
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

/** 当前激活的菜单项 */
const activeMenu = computed(() => route.path)

/** 退出登录 */
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.logo {
  font-size: 20px;
  color: #409eff;
  cursor: pointer;
  white-space: nowrap;
}
.nav-menu {
  border-bottom: none;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-info {
  color: #606266;
  font-size: 14px;
}
.app-main {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}
</style>
