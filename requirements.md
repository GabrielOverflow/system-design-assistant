# System Design Interview AI Assistant - 需求文档

## 1. 项目概述

开发一个运行在Windows平台上的System Design面试AI助手，帮助用户在面试过程中实时获取AI建议和答案。该应用需要在屏幕共享时对面试官隐藏，但用户自己可以正常使用。

## 2. 核心功能需求

### 2.1 输入功能
- **截图输入**：支持截取屏幕任意区域，将截图发送给AI分析
- **文字输入**：支持手动输入文字问题或描述
- **快捷键支持**：快速触发截图或打开输入框

### 2.2 AI交互功能
- **实时问答**：将截图或文字发送给ChatGPT API，获取System Design相关的建议和答案
- **上下文理解**：ChatGPT能够理解System Design问题的上下文
- **格式化输出**：ChatGPT回答以清晰、结构化的方式展示
- **Vision支持**：使用GPT-4 Vision模型分析截图内容

### 2.3 屏幕共享隐藏功能（核心需求）
- **窗口隐藏**：在屏幕共享时，应用窗口对共享屏幕不可见
- **任务栏隐藏**：应用不在任务栏显示图标或窗口预览
- **用户可见**：用户自己的屏幕上可以正常看到和使用应用
- **快速切换**：支持快捷键快速显示/隐藏应用

### 2.4 预设Prompt管理
- **自定义Prompt**：用户可以创建、编辑、删除预设的prompt模板
- **快速调用**：支持快捷键或按钮快速应用预设prompt
- **分类管理**：支持对prompt进行分类（如：架构设计、性能优化、扩展性等）
- **导入导出**：支持prompt配置的导入和导出

### 2.5 其他功能
- **历史记录**：保存对话历史，方便回顾
- **设置界面**：API密钥配置、主题设置、快捷键自定义等
- **最小化到系统托盘**：应用可以最小化到系统托盘运行

## 3. 技术栈选择

### 3.1 前端框架
**推荐：Electron + React/Vue**
- **Electron**：跨平台桌面应用框架，基于Chromium和Node.js
- **React/Vue**：现代化UI框架，提供良好的用户体验
- **优势**：
  - 可以使用Web技术快速开发
  - 丰富的UI组件库
  - 良好的跨平台兼容性（虽然主要针对Windows）

**备选：Tauri + React/Vue**
- 更轻量级，性能更好
- 但生态相对较新

### 3.2 截图功能
- **推荐：electron-screenshot-desktop** 或 **node-screenshots**
- 或者使用Windows原生API：**@nutjs/nut-js** 或 **robotjs**

### 3.3 AI API集成
- **Google Gemini API**：使用Google官方Gemini API
  - 支持模型：Gemini Pro、Gemini 1.5 Pro、Gemini 1.5 Flash
  - 支持Vision API（Gemini Pro Vision）用于截图分析
  - 使用官方 `@google/generative-ai` npm包

### 3.4 窗口隐藏技术
**关键挑战：实现屏幕共享时隐藏，但用户可见**

**方案1：使用Windows API**
- 使用 `SetWindowDisplayAffinity` API
- 设置 `WDA_EXCLUDEFROMCAPTURE` 标志（Windows 10 2004+）
- 这会使窗口在屏幕录制/共享时不可见，但用户仍能看到

**方案2：使用Electron的nativeWindowOpen**
- 结合Windows原生模块实现

**方案3：使用ffi-napi或node-ffi**
- 调用Windows API实现窗口隐藏

### 3.5 任务栏隐藏
- 使用 `WS_EX_TOOLWINDOW` 窗口样式
- 或使用 `SetWindowLong` API设置窗口扩展样式

### 3.6 数据存储
- **本地存储**：使用 `electron-store` 或 `lowdb`
- 存储内容：
  - API密钥（加密存储）
  - 预设prompt
  - 对话历史
  - 用户设置

### 3.7 UI组件库
- **Ant Design** / **Material-UI** / **Chakra UI**
- 或使用 **Tailwind CSS** 自定义样式

### 3.8 系统托盘
- Electron的 `Tray` API

## 4. 系统架构设计

### 4.1 应用架构
```
┌─────────────────────────────────────┐
│         Main Process (Node.js)      │
│  - 窗口管理                          │
│  - 系统托盘                          │
│  - 截图功能                          │
│  - Windows API调用                   │
│  - 数据存储                          │
└─────────────────────────────────────┘
              ↕ IPC
┌─────────────────────────────────────┐
│      Renderer Process (React)       │
│  - UI界面                            │
│  - 用户交互                          │
│  - AI API调用                        │
│  - Prompt管理                        │
└─────────────────────────────────────┘
```

### 4.2 核心模块

#### 4.2.1 窗口管理模块
- 负责窗口的创建、显示、隐藏
- 实现屏幕共享隐藏功能
- 任务栏隐藏功能

#### 4.2.2 截图模块
- 屏幕截图功能
- 截图区域选择
- 图片处理和压缩

#### 4.2.3 AI交互模块
- ChatGPT API调用封装（OpenAI SDK）
- 请求/响应处理
- 错误处理和重试机制
- 流式响应支持（可选）
- Vision API集成（用于截图分析）

#### 4.2.4 Prompt管理模块
- Prompt的CRUD操作
- Prompt分类管理
- 导入导出功能

#### 4.2.5 数据存储模块
- 配置管理
- 历史记录存储
- 加密存储敏感信息

## 5. 工作流程

### 5.1 应用启动流程
1. 检查配置文件（API密钥等）
2. 创建主窗口（默认隐藏）
3. 注册系统托盘图标
4. 应用Windows API设置窗口隐藏属性
5. 加载预设prompt
6. 准备就绪，等待用户操作

### 5.2 截图提问流程
1. 用户按下截图快捷键（如 Ctrl+Shift+S）
2. 显示截图选择区域工具
3. 用户选择截图区域
4. 截图并转换为base64格式
5. 可选：添加文字描述
6. 调用ChatGPT Vision API（GPT-4 Vision模型，包含预设prompt或用户输入）
7. 显示ChatGPT回答
8. 保存到历史记录

### 5.3 文字提问流程
1. 用户按下快捷键打开输入框（如 Ctrl+Shift+A）
2. 显示输入窗口
3. 用户输入问题
4. 可选：选择预设prompt
5. 调用ChatGPT API（GPT-4或GPT-3.5）
6. 显示ChatGPT回答
7. 保存到历史记录

### 5.4 屏幕共享隐藏流程
1. 应用启动时自动设置窗口隐藏属性
2. 使用Windows API：`SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)`
3. 设置窗口样式：`WS_EX_TOOLWINDOW` 隐藏任务栏
4. 用户正常使用，窗口对用户可见
5. 屏幕共享时，窗口自动对共享屏幕不可见

## 6. UI/UX设计

### 6.1 主界面布局
```
┌─────────────────────────────────────┐
│  [Logo] System Design Assistant     │
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐          │
│  │ 截图提问 │  │ 文字输入 │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  预设Prompt:                        │
│  ┌─────────────────────────────┐   │
│  │ [架构设计] [性能优化] [扩展] │   │
│  └─────────────────────────────┘   │
│                                     │
│  对话历史:                          │
│  ┌─────────────────────────────┐   │
│  │ Q: [问题]                    │   │
│  │ A: [回答]                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [设置] [历史] [最小化]             │
└─────────────────────────────────────┘
```

### 6.2 设置界面
- API配置（OpenAI API密钥、ChatGPT模型选择、温度等）
- 快捷键设置
- 主题设置
- Prompt管理界面

### 6.3 交互设计
- **快捷键**：
  - `Ctrl+Shift+S`：截图
  - `Ctrl+Shift+A`：文字输入
  - `Ctrl+Shift+H`：显示/隐藏窗口
  - `Ctrl+Shift+P`：打开Prompt选择
- **右键菜单**：系统托盘右键菜单
- **拖拽**：支持窗口拖拽移动

## 7. 技术实现细节

### 7.1 Windows API调用
```javascript
// 使用 node-ffi-napi 或 ffi-napi
const ffi = require('ffi-napi');
const ref = require('ref-napi');

const user32 = ffi.Library('user32', {
  'SetWindowDisplayAffinity': ['bool', ['long', 'uint']],
  'GetWindowLong': ['long', ['long', 'int']],
  'SetWindowLong': ['long', ['long', 'int', 'long']]
});

const WDA_EXCLUDEFROMCAPTURE = 0x00000011;
```

### 7.2 截图实现
```javascript
// 使用 electron-screenshot-desktop
const screenshot = require('electron-screenshot-desktop');
// 或使用Windows原生API
```

### 7.3 数据存储结构
```json
{
  "api": {
    "provider": "openai",
    "apiKey": "encrypted_key",
    "model": "gpt-4-turbo-preview",
    "temperature": 0.7,
    "visionModel": "gpt-4-vision-preview"
  },
  "prompts": [
    {
      "id": "1",
      "name": "架构设计",
      "category": "architecture",
      "content": "你是一个System Design专家..."
    }
  ],
  "history": [
    {
      "id": "1",
      "timestamp": "2024-01-01T00:00:00Z",
      "question": "...",
      "answer": "...",
      "type": "screenshot|text"
    }
  ],
  "settings": {
    "hotkeys": {
      "screenshot": "Ctrl+Shift+S",
      "textInput": "Ctrl+Shift+A",
      "toggleWindow": "Ctrl+Shift+H"
    },
    "theme": "dark|light"
  }
}
```

## 8. 安全考虑

### 8.1 API密钥安全
- 使用加密存储OpenAI API密钥
- 使用 `electron-store` 的加密功能
- 或使用Windows Credential Manager
- API密钥仅用于调用ChatGPT API，不会上传到第三方

### 8.2 隐私保护
- 截图数据不持久化存储（可选）
- 对话历史本地存储，不上传
- 支持清除历史记录功能

## 9. 开发计划

### Phase 1: 基础框架搭建
- [ ] 初始化Electron项目
- [ ] 配置React/Vue
- [ ] 基础窗口创建
- [ ] 系统托盘集成

### Phase 2: 核心功能实现
- [ ] Windows API集成（窗口隐藏）
- [ ] 截图功能实现
- [ ] ChatGPT API集成（OpenAI SDK）
- [ ] 基础UI界面

### Phase 3: 高级功能
- [ ] Prompt管理功能
- [ ] 历史记录功能
- [ ] 设置界面
- [ ] 快捷键支持

### Phase 4: 优化和测试
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] UI/UX优化
- [ ] 测试和bug修复

## 10. 潜在挑战和解决方案

### 10.1 窗口隐藏技术
**挑战**：确保在屏幕共享时隐藏，但用户可见
**解决方案**：使用Windows 10+的 `SetWindowDisplayAffinity` API

### 10.2 任务栏隐藏
**挑战**：隐藏任务栏图标但保持窗口可用
**解决方案**：使用 `WS_EX_TOOLWINDOW` 窗口样式

### 10.3 跨版本兼容性
**挑战**：不同Windows版本的API支持
**解决方案**：检测Windows版本，提供降级方案

### 10.4 性能优化
**挑战**：截图和ChatGPT API调用的性能
**解决方案**：
- 截图压缩（减少Vision API调用成本）
- API请求去重
- 响应缓存（可选）
- 合理选择模型（文字用GPT-3.5，截图用GPT-4 Vision）

## 11. 依赖包清单（初步）

```json
{
  "dependencies": {
    "electron": "^latest",
    "react": "^18.x",
    "react-dom": "^18.x",
    "electron-store": "^latest",
    "electron-screenshot-desktop": "^latest",
    "ffi-napi": "^latest",
    "ref-napi": "^latest",
    "openai": "^latest"
  },
  "devDependencies": {
    "electron-builder": "^latest",
    "electron-rebuild": "^latest"
  }
}
```

## 12. 后续扩展功能（可选）

- 支持多语言
- 支持语音输入
- 支持团队共享prompt
- 支持导出对话为Markdown/PDF
- 支持自定义主题
- 支持插件系统
- 支持ChatGPT不同模型版本切换（GPT-4、GPT-3.5等）

---

**文档版本**：v1.0  
**创建日期**：2024  
**最后更新**：2024

