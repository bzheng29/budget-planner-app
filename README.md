# 智能预算规划助手 (Smart Budget Planner)

一个基于 AI 的中文预算规划应用，通过分析您的消费记录，为您提供个性化的预算建议。

## 🌟 功能特点

- **AI 智能分析**: 使用 Google Gemini 2.5 Pro 分析您的消费模式
- **自动检测**: 智能识别债务、固定支出、订阅服务等
- **个性化建议**: 根据您的生活方式提供定制化预算方案
- **完全中文**: 专为中文用户设计的界面和体验
- **隐私安全**: 所有数据处理都在本地完成，仅发送给 AI 进行分析

## 🚀 在线体验

访问: https://budget-planner-finn-y4qgz32qmq-uc.a.run.app

## 💻 本地开发

### 前置要求

- Node.js 18+
- npm 或 yarn
- Google Gemini API Key

### 安装步骤

1. 克隆仓库
\`\`\`bash
git clone https://github.com/yourusername/budget-planner-app.git
cd budget-planner-app
\`\`\`

2. 安装依赖
\`\`\`bash
npm install
\`\`\`

3. 配置环境变量
创建 \`.env\` 文件并添加：
\`\`\`
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-2.5-pro
\`\`\`

4. 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

## 🌐 部署到 Google Cloud

项目已配置好 Google Cloud Run 部署：

\`\`\`bash
# 使用 Cloud Build 部署
gcloud builds submit --config deployment/gcp/cloudbuild.yaml

# 或使用部署脚本
./deployment/scripts/deploy-now.sh
\`\`\`

## 📁 项目结构

\`\`\`
budget-planner-app/
├── src/
│   ├── components/        # React 组件
│   ├── services/         # API 服务
│   ├── utils/           # 工具函数
│   └── styles/          # 样式文件
├── deployment/          # 部署配置
│   ├── docker/         # Docker 配置
│   ├── gcp/           # Google Cloud 配置
│   └── scripts/       # 部署脚本
└── public/            # 静态资源
\`\`\`

## 🛠️ 技术栈

- **前端**: React + TypeScript + Vite
- **AI**: Google Gemini 2.5 Pro
- **样式**: CSS Modules
- **部署**: Google Cloud Run + Docker
- **构建**: Vite

## 📝 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

使用 AI 技术让理财变得更简单 💰
EOF < /dev/null
