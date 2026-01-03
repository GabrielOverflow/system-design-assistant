# 快速启动指南

## 安装步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **开发模式运行**
   ```bash
   npm run electron:dev
   ```

   这会同时启动：
   - Vite开发服务器（React前端）
   - Electron应用

## 首次使用

1. **配置API密钥**
   - 打开应用后，点击"设置"标签
   - 输入你的Google Gemini API密钥（可在 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取）
   - 选择模型（推荐Gemini Pro用于文字，Gemini Pro Vision用于截图）
   - 点击"保存设置"

2. **创建预设Prompt（可选）**
   - 在设置页面的"Prompt管理"部分
   - 点击"添加"创建自定义prompt
   - 例如：创建一个"架构设计分析"的prompt

## 使用快捷键

- `Ctrl+Shift+S` - 截图提问
- `Ctrl+Shift+A` - 文字输入
- `Ctrl+Shift+H` - 显示/隐藏窗口

## 功能说明

### 截图提问
1. 按下 `Ctrl+Shift+S` 或点击"截图提问"按钮
2. 选择要截图的区域（当前版本会截取全屏，后续可添加区域选择）
3. 等待Gemini分析并返回答案

### 文字输入
1. 按下 `Ctrl+Shift+A` 或点击"文字输入"按钮
2. 在弹出的对话框中输入你的问题
3. 点击"提交"等待回答

### 预设Prompt
- 在主界面可以选择预设的prompt
- 这些prompt会作为系统提示词发送给ChatGPT
- 可以在设置中管理这些prompt

## 构建生产版本

```bash
npm run electron:build
```

构建完成后，安装包会在 `release` 目录中。

## 注意事项

1. **Windows版本要求**：需要Windows 10 2004或更高版本以支持窗口隐藏功能
2. **API密钥安全**：API密钥会加密存储在本地，不会上传到任何服务器
3. **网络连接**：需要网络连接以调用OpenAI API
4. **图标文件**：可以在 `assets` 目录中添加应用图标
5. **窗口隐藏功能（可选依赖）**：
   - 窗口隐藏功能需要 `ffi-napi` 和 `ref-napi` 包（已设为可选依赖）
   - 在 Linux/WSL 环境下开发时，这些包可能无法编译，但不影响其他功能
   - 在 Windows 上构建时，可以手动安装：`npm install ffi-napi ref-napi`
   - 如果这些包不可用，应用仍可正常运行，只是窗口隐藏功能会被禁用

## 故障排除

### 应用无法启动
- 确保已安装Node.js 16+
- 运行 `npm install` 重新安装依赖
- 检查是否有端口冲突（默认5173）

### 窗口隐藏功能不工作
- 确保Windows版本 >= 10 2004
- 检查是否以管理员权限运行（某些情况下需要）

### API调用失败
- 检查API密钥是否正确
- 检查网络连接
- 查看控制台错误信息

## 项目结构

```
system-design/
├── electron/          # Electron主进程代码
│   ├── main.ts       # 主进程入口
│   ├── preload.ts    # 预加载脚本
│   ├── windowHide.ts # 窗口隐藏功能
│   └── screenshot.ts # 截图功能
├── src/              # React前端代码
│   ├── components/  # React组件
│   ├── context/      # Context API
│   ├── services/     # 服务层（ChatGPT API）
│   └── App.tsx       # 主应用组件
├── assets/           # 资源文件（图标等）
└── dist-electron/    # 编译后的Electron代码（构建后生成）
```

