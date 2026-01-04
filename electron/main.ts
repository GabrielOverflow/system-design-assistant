import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage } from 'electron';
import * as path from 'path';
import { setupWindowHide } from './windowHide';
import { setupScreenshot } from './screenshot';
import { initializeScreenshotSelector } from './screenshotAreaSelector';
import Store from 'electron-store';

const store = new Store();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isWindowVisible = false;

// 扩展app类型以支持isQuiting属性
declare global {
  namespace NodeJS {
    interface Global {
      isQuiting: boolean;
    }
  }
}

// @ts-ignore
app.isQuiting = false;

function createWindow() {
  // 如果窗口已存在，直接显示并返回
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    isWindowVisible = true;
    return;
  }

  const isDev = process.env.NODE_ENV === 'development';
  
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);
  console.log('Preload script exists:', require('fs').existsSync(preloadPath));
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,
    resizable: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: isDev, // 开发模式下显示，生产模式隐藏
    skipTaskbar: true, // 始终隐藏任务栏图标（通过Windows API实现）
  });

  // 设置窗口隐藏（屏幕共享时不可见）
  if (mainWindow) {
    setupWindowHide(mainWindow);
  }

  // 开发环境加载Vite dev server，生产环境加载构建文件
  if (isDev) {
    console.log('Loading Vite dev server at http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173').catch((error) => {
      console.error('Failed to load URL:', error);
    });
    
    // 禁用自动打开 DevTools，用户可以通过 F12 手动打开
    // 这样可以避免创建额外的窗口
    // mainWindow.webContents.openDevTools({ mode: 'bottom' });
    
    // 开发模式下，页面加载完成后显示窗口
    let hasShown = false; // 防止重复显示
    mainWindow.webContents.once('did-finish-load', () => {
      if (hasShown) return; // 如果已经显示过，不再重复显示
      hasShown = true;
      
      console.log('Page loaded successfully');
      // 检查 preload 是否成功注入
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
          console.log('Checking electronAPI:', typeof window.electronAPI);
          console.log('electronAPI methods:', window.electronAPI ? Object.keys(window.electronAPI) : 'undefined');
        `).catch(err => console.error('Failed to check electronAPI:', err));
        
        mainWindow.show();
        mainWindow.focus();
        isWindowVisible = true;
        console.log('Window shown and focused');
      }
    });
    
    // 防止Vite HMR重新连接时重复触发显示
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error('Failed to load page:', errorCode, errorDescription);
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    isWindowVisible = false;
  });

  // 窗口关闭时隐藏而不是退出
  mainWindow.on('close', (event) => {
    // @ts-ignore
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow?.hide();
      isWindowVisible = false;
    }
  });

  // 防止DevTools关闭时自动重新打开（仅在开发模式）
  if (isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      console.log('DevTools opened');
    });
    
    mainWindow.webContents.on('devtools-closed', () => {
      console.log('DevTools closed');
      // 不自动重新打开DevTools
    });
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  // 如果图标不存在，创建一个简单的图标
  if (icon.isEmpty()) {
    tray = new Tray(nativeImage.createEmpty());
  } else {
    tray = new Tray(icon);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        showWindow();
      },
    },
    {
      label: '隐藏窗口',
      click: () => {
        hideWindow();
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        // @ts-ignore
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('System Design Assistant');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (isWindowVisible) {
      hideWindow();
    } else {
      showWindow();
    }
  });
}

function showWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    isWindowVisible = true;
  }
}

function hideWindow() {
  if (mainWindow) {
    mainWindow.hide();
    isWindowVisible = false;
  }
}

function registerShortcuts() {
  // Ctrl+Shift+H: 显示/隐藏窗口
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (isWindowVisible) {
      hideWindow();
    } else {
      showWindow();
    }
  });

  // Ctrl+Shift+S: 截图
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    // 即使窗口隐藏，快捷键也应该工作
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('trigger-screenshot');
    } else {
      // 如果窗口不存在或被销毁，创建一个新窗口
      createWindow();
      if (mainWindow) {
        mainWindow.webContents.once('did-finish-load', () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('trigger-screenshot');
          }
        });
      }
    }
  });

  // Ctrl+Shift+A: 文字输入
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow) {
      showWindow();
      mainWindow.webContents.send('trigger-text-input');
    }
  });
}

// IPC handlers
ipcMain.handle('get-store-value', (_event, key: string) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (_event, key: string, value: any) => {
  store.set(key, value);
});

ipcMain.handle('get-all-store', () => {
  return store.store;
});

// 截图相关
setupScreenshot(ipcMain);
initializeScreenshotSelector();

// 使用 whenReady() 而不是 on('ready')，避免重复执行
app.whenReady().then(() => {
  console.log('Electron app is ready');
  createWindow();
  createTray();
  registerShortcuts();
  console.log('Window, tray, and shortcuts initialized');

  // macOS 特有的 activate 事件（Windows 上不会触发）
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // 在Windows上，不退出应用，保持后台运行
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('before-quit', () => {
  // @ts-ignore
  app.isQuiting = true;
});

