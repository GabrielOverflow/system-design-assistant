import { desktopCapturer } from 'electron';

/**
 * 使用Electron的desktopCapturer API进行截图
 */
async function captureScreen(): Promise<string> {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    if (sources.length === 0) {
      throw new Error('No screen sources available');
    }

    // 尝试找到主屏幕（Entire Screen或Screen 1）
    let primarySource = sources.find(source => 
      source.name === 'Entire Screen' || 
      source.name === 'Screen 1' ||
      source.name.includes('Entire')
    );
    
    // 如果找不到，使用第一个
    if (!primarySource) {
      primarySource = sources[0];
    }
    
    // 获取屏幕截图
    const image = primarySource.thumbnail;
    
    if (!image) {
      throw new Error('Failed to capture screen thumbnail');
    }
    
    // 转换为base64
    const base64 = image.toPNG().toString('base64');
    
    if (!base64) {
      throw new Error('Failed to convert image to base64');
    }
    
    return base64;
  } catch (error: any) {
    console.error('Screen capture error:', error);
    throw new Error(`Screenshot failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * 设置截图相关的IPC处理器
 */
export function setupScreenshot(ipcMain: Electron.IpcMain) {
  // 全屏截图
  ipcMain.handle('take-screenshot', async () => {
    try {
      return await captureScreen();
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  });

  // 选择区域截图（当前实现为全屏截图，后续可以添加区域选择UI）
  ipcMain.handle('select-screenshot-area', async () => {
    try {
      // 当前返回全屏截图
      // 后续可以实现一个区域选择窗口让用户选择截图区域
      return await captureScreen();
    } catch (error) {
      console.error('Screenshot area selection error:', error);
      throw error;
    }
  });
}

