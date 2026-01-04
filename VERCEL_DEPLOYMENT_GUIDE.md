# Vercel 部署指南

## 前提条件
- 已将代码推送到 GitHub 仓库
- 拥有 Vercel 账号

## 部署步骤

### 1. 登录 Vercel
访问 [Vercel 官网](https://vercel.com/) 并登录你的账号。

### 2. 导入 GitHub 仓库
1. 点击页面右上角的 **New Project**
2. 在 **Import Git Repository** 部分，找到并选择你的 Mermaid 编辑器仓库
3. 点击 **Import**

### 3. 配置项目设置
1. **Framework Preset**: 选择 **Other**（因为这是一个纯静态 HTML/CSS/JS 项目）
2. **Root Directory**: 保持为 `/`
3. **Build and Output Settings**:
   - **Build Command**: 留空（不需要构建步骤）
   - **Output Directory**: 留空（Vercel 会自动检测静态文件）
4. **Environment Variables**: 无需配置
5. 点击 **Deploy**

### 4. 验证部署
部署完成后，你会看到一个成功页面，包含以下信息：
- 预览 URL: 如 `https://your-project.vercel.app`
- 部署状态: 成功

点击预览 URL 测试应用是否正常运行。

### 5. 配置自定义域名（可选）
1. 进入项目设置
2. 点击 **Domains** 选项卡
3. 输入你的自定义域名，然后点击 **Add**
4. 按照 Vercel 提供的 DNS 配置指南，在你的域名注册商处添加相应的 DNS 记录
5. 等待 DNS 记录生效后，你的应用将可以通过自定义域名访问

## 注意事项

### 1. SEO 配置
项目已经包含了基本的 SEO 配置：
- `robots.txt`: 允许搜索引擎抓取
- `sitemap.xml`: 网站地图
- `index.html`: 包含 meta 标签、Open Graph 和 Twitter Card 配置

### 2. CORS 策略
当前 `vercel.json` 中的 CORS 策略配置如下：
```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      {
        "key": "Content-Security-Policy",
        "value": "default-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; script-src 'self' https://cdn.jsdelivr.net; img-src 'self' data:"
      }
    ]
  }
]
```

如果你需要添加其他外部资源，可以修改这个配置。

### 3. 性能优化
- 项目使用 CDN 加载 Mermaid 库，提高加载速度
- 静态资源设置了适当的缓存策略

## 常见问题

### 404 错误
如果遇到 404 错误，检查以下几点：
1. 确认 `vercel.json` 中的路由配置正确
2. 确认 `index.html` 文件存在于根目录
3. 重新部署项目

### 资源加载错误
检查浏览器控制台的错误信息，确认：
1. Mermaid 库是否正确加载
2. 其他外部资源的 URL 是否正确
3. CORS 策略是否允许加载该资源

## 后续维护

- 每次将代码推送到 GitHub 仓库，Vercel 会自动触发重新部署
- 可以在 Vercel 控制台监控部署状态和访问统计
- 可以设置环境变量、自定义域名、SSL 证书等高级配置

如需进一步帮助，请参考 [Vercel 官方文档](https://vercel.com/docs)。