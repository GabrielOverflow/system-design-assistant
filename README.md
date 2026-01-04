# System Design Interview AI Assistant

一个运行在Windows上的System Design面试AI助手，帮助你在面试过程中实时获取Gemini AI的建议和答案。

## 功能特性

- 📷 **截图提问**：截取屏幕任意区域，使用Gemini Vision分析
- ✏️ **文字输入**：手动输入问题获取Gemini回答
- 🔒 **屏幕共享隐藏**：在屏幕共享时对面试官隐藏，但你自己可见
- 📝 **预设Prompt管理**：创建和管理自定义prompt模板
- 📚 **历史记录**：保存所有对话历史
- ⚙️ **灵活配置**：支持配置API密钥、模型选择等

## 技术栈

- **Electron** - 桌面应用框架
- **React + TypeScript** - 前端框架
- **Vite** - 构建工具
- **Google Gemini API** - Gemini AI集成
- **Windows API** - 窗口隐藏功能

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run electron:dev
```

### 构建

```bash
npm run electron:build
```

## 使用说明

1. 首次使用需要在设置中配置Google Gemini API密钥
2. 使用快捷键 `Ctrl+Shift+S` 进行截图提问
3. 使用快捷键 `Ctrl+Shift+A` 进行文字输入
4. 使用快捷键 `Ctrl+Shift+H` 显示/隐藏窗口
5. 在设置中可以管理预设Prompt

## 窗口隐藏功能（屏幕共享时隐藏）

### 安装依赖（必需）

窗口隐藏功能需要安装以下可选依赖：

```bash
npm install ffi-napi ref-napi
```

**注意**：
- 这些依赖需要在 **Windows 系统** 上安装
- 如果是在 WSL 中开发，需要在 Windows 上运行 `npm install` 来安装这些依赖
- 安装后重新构建 Electron 主进程：`npm run build:electron`
- 安装成功后，运行应用时终端会显示：`✓ Window display affinity set successfully`

### 功能说明

### 功能说明
- ✅ **屏幕共享隐藏**：在 Zoom、Teams、OBS 等软件进行屏幕共享时，应用窗口会自动隐藏
- ✅ **任务栏隐藏**：应用不会在任务栏显示图标
- ✅ **用户可见**：你自己的屏幕上可以正常看到和使用应用
- ✅ **快捷键切换**：使用 `Ctrl+Shift+H` 快速显示/隐藏窗口

### 启用方法

窗口隐藏功能需要安装 `ffi-napi` 和 `ref-napi` 依赖包。这些包是原生模块，需要为 Electron 重新编译：

```bash
# 1. 在 Windows 上安装依赖
npm install ffi-napi ref-napi

# 2. 安装 electron-rebuild（如果还没有）
npm install --save-dev electron-rebuild

# 3. 重新编译原生模块（为 Electron 的 Node.js 版本）
npm run rebuild

# 4. 重新编译 Electron 代码
npm run build:electron

# 5. 重新运行应用
npm run electron:dev
```

**重要提示**：
- `ffi-napi` 和 `ref-napi` 是原生模块，必须使用 `electron-rebuild` 为 Electron 的 Node.js 版本重新编译
- 如果看到 "Cannot find module 'ffi-napi'" 错误，说明需要执行 `npm run rebuild`
- 重新编译可能需要几分钟时间，请耐心等待

安装成功后，启动应用时会在控制台看到：
```
✓ Window display affinity set successfully - window will be hidden during screen sharing
✓ Window style updated to hide from taskbar
```

### 系统要求
- Windows 10 2004 或更高版本（支持 `SetWindowDisplayAffinity` API）
- 如果依赖包不可用，应用仍可正常运行，只是窗口隐藏功能会被禁用

## 注意事项

- 需要Windows 10 2004或更高版本以支持窗口隐藏功能
- 需要有效的Google Gemini API密钥（可在 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取）
- API密钥会加密存储在本地

