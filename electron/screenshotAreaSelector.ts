import { BrowserWindow, screen, ipcMain, desktopCapturer } from 'electron';
import * as path from 'path';

let selectorWindow: BrowserWindow | null = null;
let isSelecting = false;
let currentResolve: ((value: SelectionArea) => void) | null = null;
let currentReject: ((reason?: any) => void) | null = null;
let selectionTimeout: NodeJS.Timeout | null = null;

interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 清理选择器状态
 */
function cleanupSelector() {
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
    selectionTimeout = null;
  }
  
  if (selectorWindow && !selectorWindow.isDestroyed()) {
    selectorWindow.close();
  }
  selectorWindow = null;
  isSelecting = false;
  
  if (currentReject) {
    const reject = currentReject;
    currentResolve = null;
    currentReject = null;
    reject(new Error('Selection cancelled'));
  } else if (currentResolve) {
    // 如果没有 reject，说明可能有问题，也要清理
    currentResolve = null;
    currentReject = null;
  }
}

/**
 * 初始化 IPC 监听器（只需要调用一次）
 */
export function initializeScreenshotSelector() {
  // 处理区域选择完成
  ipcMain.on('screenshot-area-selected', (_event, area: SelectionArea) => {
    if (currentResolve) {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
        selectionTimeout = null;
      }
      isSelecting = false;
      if (selectorWindow && !selectorWindow.isDestroyed()) {
        selectorWindow.close();
      }
      selectorWindow = null;
      const resolve = currentResolve;
      currentResolve = null;
      currentReject = null;
      resolve(area);
    }
  });

  // 处理区域选择取消
  ipcMain.on('screenshot-area-cancelled', () => {
    if (currentReject) {
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
        selectionTimeout = null;
      }
      isSelecting = false;
      if (selectorWindow && !selectorWindow.isDestroyed()) {
        selectorWindow.close();
      }
      selectorWindow = null;
      const reject = currentReject;
      currentResolve = null;
      currentReject = null;
      reject(new Error('Selection cancelled'));
    }
  });
}

/**
 * 创建区域选择窗口
 */
function createSelectorWindow(): Promise<SelectionArea> {
  return new Promise((resolve, reject) => {
    // 如果已经有选择在进行，先清理
    if (isSelecting || selectorWindow) {
      console.log('Selection already in progress, cleaning up...');
      cleanupSelector();
      // 等待一小段时间确保清理完成
      setTimeout(() => {
        // 重新尝试
        createSelectorWindow().then(resolve).catch(reject);
      }, 200);
      return;
    }

    isSelecting = true;
    currentResolve = resolve;
    currentReject = reject;
    
    // 找到主显示器
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const { x: screenX, y: screenY } = primaryDisplay.bounds;

    // 创建全屏透明窗口用于选择区域
    selectorWindow = new BrowserWindow({
      width: screenWidth,
      height: screenHeight,
      x: screenX,
      y: screenY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      focusable: true,
      show: false, // 先不显示，等 ready-to-show 再显示
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    // 加载选择器 HTML
    selectorWindow.loadFile(path.join(__dirname, 'screenshot-selector.html'));

    // 设置超时，防止窗口一直卡住（30秒后自动取消）
    selectionTimeout = setTimeout(() => {
      console.log('Selection timeout, cleaning up...');
      cleanupSelector();
    }, 30000);

    selectorWindow.once('ready-to-show', () => {
      if (selectorWindow && !selectorWindow.isDestroyed()) {
        // 确保窗口可以接收鼠标事件
        selectorWindow.setIgnoreMouseEvents(false, { forward: false });
        selectorWindow.show();
        selectorWindow.focus();
        console.log('Selector window shown');
      }
    });

    selectorWindow.on('closed', () => {
      console.log('Selector window closed');
      if (selectionTimeout) {
        clearTimeout(selectionTimeout);
        selectionTimeout = null;
      }
      isSelecting = false;
      selectorWindow = null;
      if (currentReject) {
        const reject = currentReject;
        currentResolve = null;
        currentReject = null;
        reject(new Error('Selection window closed'));
      }
    });

    // 处理窗口加载错误
    selectorWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error('Failed to load selector window:', errorCode, errorDescription);
      cleanupSelector();
    });
  });
}

/**
 * 截取指定区域
 */
async function captureArea(area: SelectionArea): Promise<string> {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x: screenX, y: screenY } = primaryDisplay.bounds;

    // 调整坐标（考虑屏幕偏移）
    const adjustedX = area.x + screenX;
    const adjustedY = area.y + screenY;

    // 使用 desktopCapturer 获取全屏截图
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { 
        width: primaryDisplay.size.width, 
        height: primaryDisplay.size.height 
      }
    });

    if (sources.length === 0) {
      throw new Error('No screen sources available');
    }

    // 找到主屏幕
    let primarySource = sources.find(source => 
      source.name === 'Entire Screen' || 
      source.name === 'Screen 1' ||
      source.name.includes('Entire')
    );
    
    if (!primarySource) {
      primarySource = sources[0];
    }

    const fullScreenImage = primarySource.thumbnail;
    
    if (!fullScreenImage) {
      throw new Error('Failed to capture screen');
    }

    // 裁剪到指定区域
    // 注意：thumbnail 的坐标是相对于屏幕的
    const croppedImage = fullScreenImage.crop({
      x: adjustedX,
      y: adjustedY,
      width: area.width,
      height: area.height,
    });

    if (!croppedImage) {
      throw new Error('Failed to crop image');
    }

    // 转换为 base64
    const base64 = croppedImage.toPNG().toString('base64');
    return base64;
  } catch (error: any) {
    console.error('Area capture error:', error);
    throw new Error(`Failed to capture area: ${error.message}`);
  }
}

/**
 * 选择截图区域并返回截图
 */
export async function selectAndCaptureArea(): Promise<string> {
  try {
    // 创建选择窗口并等待用户选择
    const area = await createSelectorWindow();
    
    // 确保清理超时
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
      selectionTimeout = null;
    }
    
    // 截取选中的区域
    const base64 = await captureArea(area);
    
    return base64;
  } catch (error: any) {
    // 确保清理状态
    if (selectionTimeout) {
      clearTimeout(selectionTimeout);
      selectionTimeout = null;
    }
    
    if (error.message === 'Selection cancelled' || error.message === 'Selection window closed') {
      throw error;
    }
    console.error('Select and capture error:', error);
    throw new Error(`Failed to select and capture area: ${error.message}`);
  }
}

