# 📚 练习册生成器

把任意 PDF 教材变成一本可答题、可判分、带解析的交互式练习册。

上传 PDF → 浏览器端解析章节 → 调用 DeepSeek 逐节生成练习题 → 一键导出精美单文件 HTML。

## ✨ 特性

- **纯前端 PDF 解析**：基于 [pdfjs-dist](https://github.com/mozilla/pdf.js)，PDF 不上传服务器，无文件大小限制，无隐私泄露。
- **智能章节识别**：优先读取 PDF 内置目录（outline），无目录时按正则识别「第X章」「X.Y」等标题。
- **多种题型**：单选、多选、判断、填空，每题含难度等级和详细解析。
- **即时判题 + 进度统计**：答题后立即判分，章节目录显示完成进度，localStorage 持久化答题记录。
- **精美单文件 HTML 导出**：生成的练习册是一个独立 HTML 文件，含暗色模式、移动端适配、章节侧边栏，可离线使用。
- **双 Key 配置**：支持服务端环境变量（生产推荐）或浏览器端临时填写（演示方便），灵活适配不同部署场景。

## 🎯 在线 Demo

> ⚠️ Demo 实例未配置服务端 API Key，请在页面右上角「设置」中填入你自己的 DeepSeek API Key 后使用。Key 仅保存在你的浏览器本地。

**Demo 地址**：[https://exercise-agent-6lxusneq8w-h9shwa9qun.preview.iga-pages.com?iga_token=0996e77975652d36ab0495984a818817&iga_time=1786265921](https://exercise-agent-6lxusneq8w-h9shwa9qun.preview.iga-pages.com?iga_token=0996e77975652d36ab0495984a818817&iga_time=1786265921)

（Demo 部署于火山引擎 IGA Pages 的预览环境。预览链接含访问 token，每次重新部署会更新且可能过期；如链接失效，建议自行部署。）

## 🛠 技术栈

- **框架**：[Next.js](https://nextjs.org/) 16 (App Router)
- **PDF 解析**：[pdfjs-dist](https://github.com/mozilla/pdf.js)
- **LLM**：[DeepSeek API](https://platform.deepseek.com/)（OpenAI 兼容协议，via `openai` SDK）
- **前端**：React 19，纯 CSS（无 UI 框架，零额外依赖）
- **语言**：JavaScript（无 TypeScript）

## 📦 本地运行

### 1. 克隆并安装依赖

```bash
git clone <your-repo-url>
cd 练习册/web
npm install
```

### 2. 配置 DeepSeek API Key（二选一）

**方式 A：服务端环境变量（推荐，安全）**

```bash
cp .env.example .env.local
# 编辑 .env.local，填入你的 API Key
# DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

申请地址：https://platform.deepseek.com/api_keys

**方式 B：浏览器端临时填写（方便体验）**

跳过环境变量配置，启动后在页面右上角点击 ⚙️「设置」填入 Key。Key 仅保存在当前浏览器 localStorage，调用时经请求头透传到服务端再转发给 DeepSeek。

> ⚠️ **安全提示**：方式 B 中你的 Key 会经过部署的服务端。请仅在你信任的部署实例上使用此方式；公开 Demo 上请勿填写真实 Key。

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### 4. 生产构建

```bash
npm run build
npm run start
```

## 🚀 部署

本项目是标准 Next.js 应用，可部署到任何支持 Node.js 的平台：

- **Vercel**：导入 GitHub 仓库，在项目设置中添加环境变量 `DEEPSEEK_API_KEY` 即可。
- **火山引擎 IGA Pages**：参考[官方文档](https://www.volcengine.com/product/iga-pages)，部署后配置环境变量。
- **自托管**：`npm run build && npm run start`，用 nginx 反代 3000 端口。

> 不论部署到哪里，**务必通过环境变量配置 `DEEPSEEK_API_KEY`**，不要把 Key 写进代码或提交到仓库。

## 📖 使用流程

1. 打开页面，点击「点击选择 PDF 文件」上传一本 PDF 教材。
2. 点击「开始解析」，浏览器本地解析章节结构（大文件可能需要几秒）。
3. 解析完成后，点击「开始生成」，逐节调用 DeepSeek 生成练习题。
4. 生成过程中可随时点击「停止生成」，已生成的题目会保留。
5. 全部生成后，点击「查看练习册」预览，可「下载 HTML」导出为单文件。

## 📂 项目结构

```
练习册/
├── web/
│   ├── app/
│   │   ├── api/generate/route.js   # 生成练习题的 API 接口
│   │   ├── PdfParserClient.js       # 浏览器端 PDF 解析模块
│   │   ├── page.js                  # 主页面（上传、解析、生成、预览）
│   │   └── layout.js
│   ├── lib/
│   │   ├── deepseek.js              # DeepSeek API 调用 + Prompt
│   │   └── exercise-template.js     # 练习册 HTML 模板
│   ├── public/
│   ├── .env.example                 # 环境变量示例
│   ├── next.config.js
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

## 🔒 隐私说明

- **PDF 文件**：完全在你的浏览器本地解析，不会上传到任何服务器。
- **章节文本**：生成练习题时，章节文本会发送到你部署的服务端，再转发给 DeepSeek API。
- **API Key**：服务端环境变量方式下 Key 不离开服务端；浏览器端填写方式下 Key 会经请求头发送到服务端。
- **答题记录**：仅保存在你的浏览器 localStorage，不上传任何服务器。

## 📄 License

[MIT](./LICENSE)
