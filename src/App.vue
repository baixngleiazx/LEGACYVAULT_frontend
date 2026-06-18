<template>
  <div class="app-container">
    <!-- 布局 1：用户端（顶部导航） -->
    <el-container v-if="currentLayout === 'user'" class="user-layout">
      <el-header class="app-header">
        <div class="header-left">
          <h1 class="logo" @click="router.push('/dashboard')">LegacyVault</h1>
          <el-menu mode="horizontal" :default-active="activeMenu" router class="nav-menu">
            <el-menu-item index="/dashboard">仪表盘 / Dashboard</el-menu-item>
            <el-menu-item index="/heartbeat">心跳打卡 / Heartbeat</el-menu-item>
            <el-menu-item index="/content">资产保管 / Assets</el-menu-item>
            <el-menu-item index="/heir">继承人管理 / Heirs</el-menu-item>
            <el-menu-item index="/trusted-contact">可信联系人 / Contacts</el-menu-item>
            <el-menu-item index="/trigger">触发状态 / Trigger</el-menu-item>
          </el-menu>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleUserCommand">
            <span class="user-info">{{ authStore.userInfo?.nickname || authStore.userInfo?.email || '用户' }}</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="security">账户安全</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 布局 2：管理员端（侧边栏导航） -->
    <el-container v-else-if="currentLayout === 'admin'" class="admin-layout">
      <el-aside width="220px" class="admin-aside">
        <h2 class="admin-logo" @click="router.push('/admin/dashboard')">LegacyVault<br><small>Admin Console</small></h2>
        <el-menu :default-active="activeMenu" router class="admin-menu">
          <el-menu-item index="/admin/dashboard">
            <span>仪表盘 / Dashboard</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <span>用户管理 / Users</span>
          </el-menu-item>
          <el-menu-item index="/admin/kyc">
            <span>KYC 审核 / KYC Review</span>
          </el-menu-item>
          <el-menu-item index="/admin/config">
            <span>系统配置 / Config</span>
          </el-menu-item>
          <el-menu-item index="/admin/audit-logs">
            <span>审计日志 / Audit Logs</span>
          </el-menu-item>
        </el-menu>
        <div class="admin-footer">
          <div class="admin-user">{{ adminStore.adminInfo?.realName || adminStore.adminInfo?.username }}</div>
          <el-button type="danger" size="small" @click="handleAdminLogout">退出</el-button>
        </div>
      </el-aside>
      <el-container>
        <el-header class="admin-breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">管理后台</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </el-header>
        <el-main class="admin-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>

    <!-- 布局 3：空白布局（登录/注册/公开页面） -->
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useAdminStore } from './stores/admin'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const adminStore = useAdminStore()

/** 当前布局类型 */
const currentLayout = computed(() => {
  return (route.meta.layout as string) || 'blank'
})

/** 当前菜单激活项 */
const activeMenu = computed(() => route.path)

/** 当前页面标题（面包屑用） */
const currentTitle = computed(() => (route.meta.title as string) || '')

/** 用户下拉菜单命令 */
function handleUserCommand(cmd: string) {
  if (cmd === 'security') {
    router.push('/account/security')
  } else if (cmd === 'logout') {
    authStore.logout()
  }
}

/** 管理员退出 */
async function handleAdminLogout() {
  await adminStore.logout()
}
</script>

<style scoped>
/* 通用 */
.app-container { min-height: 100vh; padding-top: 0; margin-top: 0; }

/* 用户布局 */
.user-layout {
  margin-top: 0;
  padding-top: 0;
}
.user-layout .app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  gap: 12px;
  margin-top: 0;
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
  height: 60px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: nowrap;
  min-width: 0;
  flex: 1 1 auto;
  height: 100%;
}
.logo {
  font-size: 20px;
  color: #409eff;
  cursor: pointer;
  white-space: nowrap;
  margin: 0;
  flex-shrink: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  height: 100%;
}
.nav-menu {
  border-bottom: none;
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 4px;
  margin-top: 0;
  overflow: hidden !important;
  white-space: nowrap !important;
  height: 100%;
}
.nav-menu.el-menu--horizontal {
  overflow: hidden !important;
  white-space: nowrap !important;
}
.nav-menu .el-menu-item {
  display: inline-flex;
  align-items: center;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
  padding: 0 12px;
  height: 60px;
  line-height: 60px;
}
.nav-menu .el-menu-item span {
  white-space: nowrap !important;
}
.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 0 0 auto;
  min-width: 0;
  margin-left: auto;
  height: 100%;
}
.user-info {
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  height: 100%;
}
.app-main { padding: 20px; background: #f5f7fa; min-height: calc(100vh - 60px); }

/* 管理员布局 */
.admin-layout { height: 100vh; }
.admin-aside {
  background: #1a1a2e; color: white;
  display: flex; flex-direction: column;
}
.admin-logo {
  padding: 20px; margin: 0; color: white; text-align: center; cursor: pointer;
  border-bottom: 1px solid #2a2a4e; font-size: 18px;
}
.admin-logo small { font-size: 12px; color: #909399; }
.admin-menu { flex: 1; background: transparent; border-right: none; }
.admin-menu .el-menu-item { color: #ccc; }
.admin-menu .el-menu-item:hover, .admin-menu .el-menu-item.is-active {
  background: #2a2a4e; color: white;
}
.admin-footer {
  padding: 16px; border-top: 1px solid #2a2a4e;
  display: flex; align-items: center; justify-content: space-between;
}
.admin-user { color: #ccc; font-size: 14px; }
.admin-breadcrumb {
  border-bottom: 1px solid #e4e7ed;
  display: flex; align-items: center; padding: 0 20px;
}
.admin-main { padding: 20px; background: #f5f7fa; min-height: calc(100vh - 60px); }
</style>
