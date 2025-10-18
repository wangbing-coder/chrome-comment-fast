# Comment Fast - 完整开发指南

## 📋 目录
1. [项目概述](#项目概述)
2. [文件结构](#文件结构)
3. [核心功能](#核心功能)
4. [交互流程](#交互流程)
5. [开发环境配置](#开发环境配置)
6. [Chrome 浏览器测试](#chrome-浏览器测试)
7. [发布到 Chrome 应用商店](#发布到-chrome-应用商店)
8. [常见问题排查](#常见问题排查)

---

## 🎯 项目概述

**Comment Fast** 是一个利用 AI 自动为博客文章生成高质量、有针对性评论的 Chrome 扩展。它专为 SEO 外链建设设计：
- 生成自然、相关且引用具体文章内容的评论
- 自动检测并匹配文章语言
- 管理你的域名以便追踪外链
- 让评论更容易被博主批准和展示

**技术栈：**
- 框架：[Plasmo](https://www.plasmo.com/)（Chrome 扩展开发框架）
- 语言：TypeScript + React
- AI：OpenRouter API（支持多种 AI 模型）
- 存储：Chrome Storage Sync API

---

## 📁 文件结构

```
comment-fast/
├── assets/
│   └── icon.png                 # 扩展图标（512x512）
├── build/
│   └── chrome-mv3-dev/         # 开发构建输出目录
├── node_modules/                # 依赖包
├── .plasmo/                     # Plasmo 框架文件（自动生成）
├── background.ts                # 后台服务进程（API 调用）
├── content.ts                   # 内容脚本（页面数据提取）
├── sidepanel.tsx                # 主界面（Home + Settings 标签页）
├── package.json                 # 项目配置文件
├── tsconfig.json                # TypeScript 配置
├── pnpm-lock.yaml              # 依赖锁定文件
└── README.md                    # 基础文档
```

### 核心文件详解

#### 1. `background.ts`（后台服务进程）
- **用途：** 处理与 OpenRouter 的 API 通信
- **主要功能：**
  - 接收来自 UI 的评论生成请求
  - 构建包含文章上下文的智能提示词
  - 使用用户设置的模型调用 OpenRouter API
  - 返回生成的评论
  - 管理侧边栏行为

#### 2. `content.ts`（内容脚本）
- **用途：** 从网页中提取博客文章信息
- **主要功能：**
  - 在所有网页上运行（`<all_urls>`）
  - 提取：标题、URL、内容（2000 字符）、文章结构
  - 检测：主要标题、关键话题、引言段落、代码块
  - 响应来自 UI 的 `GET_PAGE_CONTEXT` 消息

#### 3. `sidepanel.tsx`（用户界面）
- **用途：** 扩展主界面，包含两个标签页
- **组件：**
  - **Home 标签：** 生成评论、管理域名
  - **Settings 标签：** 配置 API 密钥、模型、评论长度
- **状态管理：** React hooks + Chrome Storage

---

## ✨ 核心功能

### 1. AI 评论生成
- 基于当前博客页面一键生成评论
- 自动检测文章语言（英文、中文、日文等）
- 引用文章具体内容（非泛泛而谈）
- 可配置长度：短（30-50 词）、中（50-100）、长（100-150）

### 2. 智能内容分析
- 提取文章结构：标题、引言、是否含代码
- 分析讨论的关键话题
- 为 AI 提供上下文以生成相关评论

### 3. 语言自动检测
- 无需手动选择语言
- AI 分析文章内容并用相同语言回复
- 支持任何语言（法语、西班牙语、德语、阿拉伯语等）

### 4. 域名管理（SEO）
- 添加你的网站以便追踪外链
- 自动提取：描述、Markdown 格式、链接文本
- 存储和管理多个域名
- 方便复制粘贴以插入链接

### 5. 灵活的 AI 配置
- 选择任何兼容 OpenRouter 的模型
- 热门选择：Claude 3 Haiku、GPT-4o Mini 等
- 调整评论长度偏好
- 安全的 API 密钥存储

---

## 🔄 交互流程

### 评论生成流程：
```
1. 用户打开博客文章
2. 用户点击扩展图标 → 侧边栏打开
3. 用户在 Home 标签点击"Generate Comment"
   ↓
4. sidepanel.tsx 发送 "GET_PAGE_CONTEXT" 消息
   ↓
5. content.ts（在页面上运行）：
   - 提取文章标题、URL、内容
   - 分析结构（标题、引言、代码）
   - 返回数据给 sidepanel
   ↓
6. sidepanel.tsx 发送 "GENERATE_COMMENT" 给 background
   ↓
7. background.ts：
   - 从存储中获取 API 密钥和模型
   - 构建包含文章上下文的智能提示词
   - 调用 OpenRouter API
   - 返回生成的评论
   ↓
8. sidepanel.tsx 显示评论
9. 用户点击"Copy to Clipboard"
10. 用户将评论粘贴到博客评论框
```

### 域名管理流程：
```
1. 用户点击"My Domains"部分的 + 按钮
2. 用户输入域名（如 "example.com"）
3. sidepanel.tsx：
   - 抓取域名的 HTML
   - 解析 <title> 和 <meta description>
   - 生成 Markdown：[标题](URL)
   - 保存到 chrome.storage.sync
4. 显示域名卡片，包含：
   - 域名
   - 描述
   - Markdown 格式
   - 链接文本
   - 删除按钮
```

---

## 🛠️ 开发环境配置

### 前置条件
- 安装 Node.js 18+
- 安装 pnpm：`npm install -g pnpm`
- Chrome 浏览器
- OpenRouter API 密钥：https://openrouter.ai/keys

### 安装步骤
```bash
# 进入项目目录
cd comment-fast

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

开发服务器会：
- 监听文件变化
- 自动重新构建扩展
- 输出到 `build/chrome-mv3-dev/`
- 在后台持续运行

---

## 🧪 Chrome 浏览器测试

### 步骤 1：在 Chrome 中加载扩展

1. 打开 Chrome，访问：`chrome://extensions/`
2. **启用"开发者模式"**（右上角开关）
3. 点击**"加载已解压的扩展程序"**按钮
4. 选择文件夹：`/Users/bing/vercel/comment-fast/build/chrome-mv3-dev`
5. 扩展出现在列表中，带紫色图标

### 步骤 2：将扩展固定到工具栏

1. 点击 Chrome 工具栏的拼图图标（🧩）
2. 找到"DEV | Comment fast"
3. 点击图钉图标将其固定显示

### 步骤 3：配置设置

1. 点击扩展图标 → 右侧打开侧边栏
2. 前往 **"Settings"** 标签
3. 输入你的 **API Key**（从 OpenRouter 获取）
4. 设置 **Model**（例如 `anthropic/claude-3-haiku-20240307`）
5. 选择 **Comment Length**（Short/Medium/Long）
6. 点击 **"Save Settings"**
7. 等待"Settings saved successfully"消息

### 步骤 4：测试评论生成

1. 在新标签页打开任何博客文章（如 https://dev.to）
2. 点击扩展图标
3. 前往 **"Home"** 标签
4. 点击 **"Generate Comment"** 按钮
5. 等待 2-5 秒
6. 生成的评论显示在下方
7. 点击 **"Copy to Clipboard"**
8. 粘贴到博客评论框

### 步骤 5：测试域名管理

1. 在 **"Home"** 标签，滚动到"My Domains"
2. 点击绿色 **+** 按钮
3. 输入域名：`yourdomain.com`
4. 点击 **"Add Domain"**
5. 等待域名信息加载
6. 验证：描述、Markdown、链接文本显示
7. 点击红色 **×** 按钮测试删除

### 步骤 6：热重载测试

当你编辑代码时：
1. 保存你的更改
2. 扩展自动重新构建（开发服务器运行中）
3. 前往 `chrome://extensions/`
4. 点击"DEV | Comment fast"旁边的刷新图标（🔄）
5. 测试你的更改

### 常见测试场景

#### 测试不同语言：
- 英文博客：https://dev.to
- 中文博客：https://www.zhihu.com
- 日文博客：https://qiita.com
- 验证评论匹配文章语言

#### 测试不同文章类型：
- 带代码的技术博客
- 个人博客文章
- 新闻文章
- 分步教程

#### 测试边界情况：
- 非常短的文章
- 没有清晰结构的文章
- 没有 `<article>` 标签的页面
- 非博客页面（应该仍能工作）

---

## 📦 发布到 Chrome 应用商店

### 前置条件
- Google 开发者账号（$5 一次性费用）
- 扩展已充分测试
- 准备好隐私政策（如果收集数据）
- 准备好营销图片

### 步骤 1：创建生产构建

```bash
# 停止开发服务器（Ctrl+C）

# 创建生产构建
pnpm build

# 输出：build/chrome-mv3-prod/
```

### 步骤 2：创建 ZIP 包

```bash
# 创建打包文件
pnpm package

# 输出：build/comment-fast-0.0.1.zip
```

或手动打包：
```bash
cd build/chrome-mv3-prod
zip -r ../comment-fast.zip *
```

### 步骤 3：准备商店素材

#### 必需的图片：
1. **小图标（128x128）** - 已在 `assets/icon.png` 生成
2. **截图（1280x800 或 640x400）** - 拍摄 3-5 张截图：
   - Home 标签带生成的评论
   - Settings 标签
   - My Domains 部分
   - 扩展在博客上的实际使用

#### 必需的文本：
1. **简短描述**（最多 132 字符）：
   ```
   AI 驱动的博客评论生成器。自动检测语言、引用文章内容、帮助 SEO 外链建设。
   ```

2. **详细描述**（完整描述）：
   ```
   Comment Fast 使用 AI 为博客文章生成高质量、有针对性的评论。

   功能特点：
   • 自动检测文章语言并用相同语言回复
   • 引用文章具体内容（非泛泛而谈）
   • 可配置评论长度
   • 域名管理以便 SEO 外链追踪
   • 支持任何 OpenRouter AI 模型

   使用方法：
   1. 浏览任何博客文章
   2. 点击扩展图标
   3. 点击"Generate Comment"
   4. 复制粘贴 AI 生成的评论

   适用于：
   • 建立高质量外链
   • 参与博客社区互动
   • 节省撰写深思熟虑回复的时间

   需要 OpenRouter API 密钥（有免费套餐）。
   ```

3. **隐私政策**（如果收集数据）：
   - 托管在你的网站或使用 Google Docs
   - 声明："除了向 OpenRouter 的 API 调用外，不收集或传输用户数据"

4. **类别：** 工作效率
5. **语言：** 中文简体

### 步骤 4：提交到 Chrome 应用商店

1. 访问：https://chrome.google.com/webstore/devconsole
2. 支付 $5 开发者注册费（一次性）
3. 点击 **"新商品"**
4. 上传 ZIP 文件：`build/comment-fast-0.0.1.zip`
5. 填写商店信息：
   - 产品名称："Comment Fast"
   - 摘要
   - 详细描述
   - 类别：工作效率
   - 语言：中文简体
6. 上传截图和图标
7. 设置 **可见性**：公开 / 不公开 / 私有
8. 点击 **"提交审核"**

### 步骤 5：等待审核

- **审核时间：** 通常 1-3 天
- 检查邮件获取批准/拒绝通知
- 如果被拒绝，修复问题后重新提交

### 步骤 6：发布更新

当你做出更改时：
```bash
# 更新 package.json 中的版本号
"version": "0.0.2"

# 构建和打包
pnpm build
pnpm package

# 前往 Chrome 应用商店开发者控制台
# 上传新的 ZIP
# 提交审核
```

### 版本号规范：
- **0.0.x** → 错误修复
- **0.x.0** → 新功能
- **x.0.0** → 重大更改

---

## 🐛 常见问题排查

### 问题：扩展无法加载

**症状：** 加载已解压扩展时出错

**解决方案：**
1. 确认你选择的是 `build/chrome-mv3-dev` 文件夹（不是根目录）
2. 运行 `pnpm dev` 确保构建存在
3. 检查控制台是否有构建错误
4. 尝试：`rm -rf build && pnpm dev`

### 问题："Missing API Key in settings"

**症状：** 点击"Generate Comment"时出错

**解决方案：**
1. 前往 Settings 标签
2. 输入 OpenRouter API 密钥
3. 点击"Save Settings"
4. 验证成功消息出现

### 问题："Failed to get page context"

**症状：** 无法提取文章信息

**解决方案：**
1. 刷新博客页面
2. 检查内容脚本是否加载：打开 DevTools → Console
3. 尝试不同的博客网站
4. 某些网站阻止内容脚本（如 chrome:// 页面）

### 问题：生成的评论语言不对

**症状：** 中文博客生成了英文评论

**解决方案：**
1. 确保文章有足够的文字（不只是图片）
2. 尝试重新生成
3. 检查博客是否真的有该语言的文字
4. AI 有时会对很短的内容默认使用英文

### 问题：域名抓取失败

**症状：** "Failed to fetch domain info"

**解决方案：**
1. 检查域名是否可访问（在浏览器中打开试试）
2. 某些网站阻止跨域请求
3. 尝试加上 `https://` 前缀
4. 检查 CORS 限制

### 问题：侧边栏不打开

**症状：** 点击图标没有反应

**解决方案：**
1. 右键点击图标 → "打开侧边栏"
2. 检查后台脚本是否运行：`chrome://extensions/` → 点击"service worker"
3. 重新加载扩展
4. 重启 Chrome

### 问题：更改未生效

**症状：** 代码编辑没有出现

**解决方案：**
1. 确保开发服务器正在运行（`pnpm dev`）
2. 前往 `chrome://extensions/`
3. 点击扩展旁边的刷新图标（🔄）
4. 硬刷新：移除并重新加载扩展

### 调试技巧：

**查看后台脚本日志：**
```
1. 前往 chrome://extensions/
2. 找到"DEV | Comment fast"
3. 点击"service worker"链接
4. 控制台打开，显示 background.ts 日志
```

**查看内容脚本日志：**
```
1. 打开博客页面
2. 按 F12（DevTools）
3. Console 标签显示 content.ts 日志
```

**查看侧边栏日志：**
```
1. 打开侧边栏
2. 在侧边栏任意位置右键点击
3. 点击"检查"
4. Console 标签显示 sidepanel.tsx 日志
```

**检查存储数据：**
```javascript
// 在 DevTools 控制台中：
chrome.storage.sync.get(null, (data) => console.log(data))
```

**清除存储数据：**
```javascript
// 在 DevTools 控制台中：
chrome.storage.sync.clear(() => console.log('已清除'))
```

---

## 📚 补充资源

- **Plasmo 文档：** https://docs.plasmo.com/
- **Chrome 扩展文档：** https://developer.chrome.com/docs/extensions/
- **OpenRouter API：** https://openrouter.ai/docs
- **TypeScript 手册：** https://www.typescriptlang.org/docs/

---

## 🎓 Chrome 扩展开发学习路径

### 初级：
1. 理解 Chrome 扩展架构（background、content、popup/sidepanel）
2. 学习组件间的消息传递
3. 研究 Chrome Storage API
4. 练习 Plasmo 示例

### 中级：
1. 精通 TypeScript + React
2. 理解 Manifest V3 要求
3. 学习 Chrome APIs（tabs、storage、runtime）
4. 使用 DevTools 调试

### 高级：
1. 优化性能
2. 处理边界情况
3. 实现分析（尊重隐私）
4. A/B 测试

---

## 📧 支持

如果遇到这里未涵盖的问题：
1. 查看 Plasmo Discord：https://discord.gg/plasmo
2. Chrome 扩展 GitHub Discussions
3. Stack Overflow 带标签 `chrome-extension`

---

**祝编码愉快！ 🚀**

