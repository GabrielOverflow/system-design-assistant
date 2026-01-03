import { desktopCapturer } from 'electron';
import { selectAndCaptureArea } from './screenshotAreaSelector';

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

  // 选择区域截图
  ipcMain.handle('select-screenshot-area', async () => {
    try {
      // 使用区域选择器
      return await selectAndCaptureArea();
    } catch (error: any) {
      // 如果用户取消选择，返回一个特殊错误
      if (error.message === 'Selection cancelled') {
        throw new Error('Screenshot cancelled by user');
      }
      console.error('Screenshot area selection error:', error);
      throw error;
    }
  });
}

