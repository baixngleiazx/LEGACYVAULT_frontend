# LegacyVault 前端

## 技术栈
- Vue 3 + TypeScript
- Element Plus
- Pinia 状态管理
- Axios
- Vite

## 快速启动

### 1. 安装依赖
```bash
cd LEGACY_VAULT-frontend
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:3000
```

### 3. 构建生产版本
```bash
npm run build
```

## 项目结构
```
src/
├── api/          # API接口封装
├── views/        # 页面组件
│   ├── auth/     # 登录注册
│   ├── dashboard/# 仪表盘
│   ├── heartbeat/# 心跳打卡
│   ├── content/  # 资产保管
│   ├── heir/     # 继承人管理
│   ├── trigger/  # 触发状态
│   └── delivery/ # 遗产交付
├── components/   # 公共组件
├── router/       # 路由配置
├── stores/       # Pinia状态管理
├── utils/        # 工具函数
└── styles/       # 全局样式
```

## Mock对接说明
前端所有API请求默认代理到后端Mock接口（`vite.config.ts`中配置）。
后端返回Mock数据，前端正常展示交互流程。
