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

## 注意事项

- 需要Windows 10 2004或更高版本以支持窗口隐藏功能
- 需要有效的Google Gemini API密钥（可在 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取）
- API密钥会加密存储在本地
- **窗口隐藏功能（可选）**：`ffi-napi` 和 `ref-napi` 是可选依赖。在 Linux/WSL 开发时可能无法编译，但不影响其他功能。在 Windows 上可手动安装这些包以启用窗口隐藏功能。

