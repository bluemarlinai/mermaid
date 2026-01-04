# Vercel 标准部署流程（解决项目已存在问题）

## 一、检查 GitHub 与 Vercel 的授权连接

如果在 Vercel 中找不到你的 GitHub 项目，首先需要检查授权连接是否正常：

1. 访问 [Vercel 集成页面](https://vercel.com/integrations/github)
2. 确保 GitHub 集成处于 "Enabled" 状态
3. 点击 "Configure" 按钮，检查以下设置：
   - 已授权的 GitHub 账号是否正确
   - 是否选择了正确的组织/用户
   - 是否授权了包含你的 Mermaid 编辑器仓库的 GitHub 组织
   - 权限设置是否包含 "Repository permissions" 和 "Organization permissions"

## 二、在 Vercel 中查找已存在的项目

如果项目已经在 Vercel 中但你找不到它：

1. 登录 Vercel 后，点击页面左上角的 **Projects** 菜单
2. 在搜索框中输入项目名称或仓库名称
3. 检查是否在以下位置：
   - 你当前登录的 Vercel 团队/个人账户下
   - 其他 Vercel 团队/账户下（可能是之前用不同账户创建的）

## 三、重新导入项目的步骤

如果确定项目存在但无法找到，可以按照以下步骤重新导入：

### 方法 1：使用 GitHub 仓库 URL 直接导入

1. 在 Vercel  dashboard 点击 **New Project**
2. 点击 **Import Git Repository** 下方的 **Import** 按钮
3. 在 **Git Repository URL** 字段中直接输入你的 GitHub 仓库 URL（格式：`https://github.com/你的用户名/仓库名.git`）
4. 点击 **Continue**
5. 选择 GitHub 账号进行授权
6. 按照正常流程完成部署配置

### 方法 2：重新克隆仓库并创建新的 Vercel 项目

如果直接导入失败，可以尝试重新克隆仓库：

1. 在本地创建一个新目录
2. 克隆 GitHub 仓库：
   ```bash
git clone https://github.com/你的用户名/仓库名.git
cd 仓库名
```
3. 登录 Vercel CLI：
   ```bash
vercel login
```
4. 初始化并部署项目：
   ```bash
vercel
```
5. 按照 CLI 提示完成配置：
   - 选择 Vercel 团队/个人账户
   - 确认项目名称
   - 确认根目录
   - 确认构建命令（留空）
   - 确认输出目录（留空）
   - 确认环境变量（无）
6. 完成部署后，你可以查看部署 URL

## 四、处理重复项目的情况

如果 Vercel 提示项目已存在：

1. 确认是否确实需要创建新项目，还是应该使用已存在的项目
2. 如果需要继续使用已存在的项目：
   - 在 Vercel dashboard 中找到该项目
   - 点击 **Settings** > **Git** > **Connected Git Repository**
   - 确认连接的 GitHub 仓库是否正确
   - 如果需要重新连接，可以点击 **Disconnect** 后再次连接
3. 如果需要创建新项目：
   - 在 GitHub 中创建一个新的仓库
   - 将本地代码推送到新仓库：
     ```bash
git remote add new-origin https://github.com/你的用户名/新仓库名.git
git push -u new-origin main
```
   - 在 Vercel 中导入新的 GitHub 仓库

## 五、完整的标准部署流程

以下是适用于大多数情况的标准 Vercel 部署流程：

### 步骤 1：准备工作

- 确保代码已经推送到 GitHub 仓库
- 确保仓库中包含 `vercel.json`（如果需要自定义配置）
- 确保 GitHub 与 Vercel 已正确授权

### 步骤 2：导入项目到 Vercel

1. 登录 Vercel dashboard
2. 点击 **New Project**
3. 在 **Import Git Repository** 部分找到你的仓库：
   - 如果能找到，直接点击 **Import**
   - 如果找不到，使用上面提到的 URL 直接导入方法
4. 配置项目设置：
   - **Framework Preset**: 选择 **Other**（因为这是静态 HTML 项目）
   - **Root Directory**: 保持为 `/`
   - **Build Command**: 留空
   - **Output Directory**: 留空
5. 点击 **Deploy** 开始部署

### 步骤 3：验证部署

- 部署完成后，点击提供的预览 URL 测试应用
- 检查所有功能是否正常（编辑器、渲染、下载等）
- 检查 SEO 配置是否生效

### 步骤 4：后续配置（可选）

- **自定义域名**: 在项目 **Settings** > **Domains** 中配置
- **环境变量**: 在项目 **Settings** > **Environment Variables** 中设置
- **部署钩子**: 在项目 **Settings** > **Git** > **Deploy Hooks** 中配置

## 六、常见问题解决

### 问题 1：Vercel 找不到 GitHub 仓库

**解决方案：**
- 检查 GitHub 与 Vercel 的授权是否过期，重新授权
- 确认仓库是否在 GitHub 中设为私有，私有仓库需要额外授权
- 检查仓库是否属于 GitHub 组织，需要为组织单独授权

### 问题 2：Vercel 提示项目已存在

**解决方案：**
- 在 Vercel dashboard 中搜索项目名称
- 检查是否使用了不同的 Vercel 账户创建过该项目
- 联系团队成员确认是否有人已经部署过该项目

### 问题 3：部署失败

**解决方案：**
- 检查 `vercel.json` 配置是否正确
- 确认项目结构是否符合 Vercel 静态部署要求
- 查看部署日志，根据错误信息进行修复

### 问题 4：部署后应用无法正常工作

**解决方案：**
- 检查浏览器控制台的错误信息
- 确认所有资源路径是否正确（特别是相对路径）
- 检查 CORS 策略配置是否正确

## 七、使用 Vercel CLI 进行部署（推荐）

如果通过网页界面遇到问题，使用 Vercel CLI 是一个更可靠的选择：

1. 安装 Vercel CLI：
   ```bash
npm install -g vercel
```

2. 登录 Vercel：
   ```bash
vercel login
```

3. 进入项目目录：
   ```bash
cd d:\workspace\mermaid
```

4. 初始化项目（如果之前没有配置过）：
   ```bash
vercel init
```

5. 部署项目：
   ```bash
vercel deploy
```

6. 部署到生产环境（可选）：
   ```bash
vercel deploy --prod
```

## 八、总结

在处理 Vercel 部署问题时，关键是：
1. 确保 GitHub 与 Vercel 的授权连接正常
2. 仔细检查项目是否已经存在于 Vercel 中
3. 使用适当的方法重新导入或连接项目
4. 必要时使用 Vercel CLI 进行部署

按照以上流程操作，你应该能够成功解决 "找不到项目但提示已存在" 的问题。