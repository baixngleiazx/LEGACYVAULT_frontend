<template>
  <div class="legal-page">
    <h1>隐私政策</h1>
    <p>LegacyVault 采用零知识设计原则，业务服务端只保存密文、元数据和授权分片，不主动保存用户明文内容。</p>
    <h2>数据类型</h2>
    <p>平台处理账户联系方式、继承人信息、可信联系人信息、加密内容元数据、心跳记录、触发记录和交付审计记录。</p>
    <h2>敏感数据</h2>
    <p>证件号、生物特征、短信邮件验证码和交付核验材料应按最小化原则处理。开发环境可由后端 Mock 服务生成模拟结果。</p>
    <h2>数据删除</h2>
    <p>用户可删除托管内容和联系人配置。审计日志因安全举证需要会按合规策略保留。</p>
  </div>
</template>

<style scoped>
.legal-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 20px;
  line-height: 1.8;
}

h1 {
  font-size: 28px;
}

h2 {
  margin-top: 24px;
  font-size: 18px;
}
</style>
