import { BrowserWindow } from 'electron';

// Windows API常量
const WDA_EXCLUDEFROMCAPTURE = 0x00000011;
const GWL_EXSTYLE = -20;
const WS_EX_TOOLWINDOW = 0x00000080;

/**
 * 尝试加载Windows API绑定（仅在Windows上且ffi-napi可用时）
 */
function loadWindowsAPI() {
  if (process.platform !== 'win32') {
    return null;
  }

  try {
    // 动态加载，如果包不存在会抛出错误
    const ffi = require('ffi-napi');
    
    // 定义Windows API
    const user32 = ffi.Library('user32', {
      SetWindowDisplayAffinity: ['bool', ['long', 'uint']],
      GetWindowLongPtrW: ['long', ['long', 'int']],
      SetWindowLongPtrW: ['long', ['long', 'int', 'long']],
    });

    return user32;
  } catch (error) {
    console.warn('ffi-napi not available, window hide feature will be disabled:', error);
    return null;
  }
}

/**
 * 设置窗口在屏幕共享时隐藏，但用户仍可见
 */
export function setupWindowHide(window: BrowserWindow) {
  if (process.platform !== 'win32') {
    console.log('Window hide feature only works on Windows');
    return;
  }

  const user32 = loadWindowsAPI();
  
  if (!user32) {
    console.warn('Windows API binding not available. Window hide feature disabled.');
    console.warn('To enable this feature, install ffi-napi and ref-napi (optional dependencies)');
    return;
  }

  // 在窗口创建后立即应用隐藏功能
  const applyWindowHide = () => {
    try {
      const hwnd = window.getNativeWindowHandle();
      if (!hwnd) {
        console.warn('Window handle not available yet, will retry...');
        setTimeout(applyWindowHide, 100);
        return;
      }

      const hwndBuffer = hwnd as Buffer;
      const hwndLong = hwndBuffer.readInt32LE(0);

      // 设置窗口显示关联性，使其在屏幕录制时不可见
      // WDA_EXCLUDEFROMCAPTURE = 0x00000011 (Windows 10 2004+)
      const result = user32.SetWindowDisplayAffinity(hwndLong, WDA_EXCLUDEFROMCAPTURE);
      if (result) {
        console.log('✓ Window display affinity set successfully - window will be hidden during screen sharing');
      } else {
        console.error('✗ Failed to set window display affinity');
      }

      // 设置窗口样式，隐藏任务栏图标
      const exStyle = user32.GetWindowLongPtrW(hwndLong, GWL_EXSTYLE);
      const newExStyle = exStyle | WS_EX_TOOLWINDOW;
      user32.SetWindowLongPtrW(hwndLong, GWL_EXSTYLE, newExStyle);
      console.log('✓ Window style updated to hide from taskbar');
    } catch (error: any) {
      console.error('Error setting up window hide:', error);
    }
  };

  // 尝试立即应用，如果窗口还没准备好，等待 ready-to-show
  if (window.isVisible()) {
    applyWindowHide();
  } else {
    window.once('ready-to-show', applyWindowHide);
  }
  
  // 也监听 show 事件，确保在窗口显示时应用
  window.on('show', applyWindowHide);
}

