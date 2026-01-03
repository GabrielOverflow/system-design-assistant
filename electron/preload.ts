import { contextBridge, ipcRenderer } from 'electron';

// 暴露受保护的方法给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // Store操作
  getStoreValue: (key: string) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key: string, value: any) => ipcRenderer.invoke('set-store-value', key, value),
  getAllStore: () => ipcRenderer.invoke('get-all-store'),

  // 截图
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  selectScreenshotArea: () => ipcRenderer.invoke('select-screenshot-area'),

  // 事件监听
  onTriggerScreenshot: (callback: () => void) => {
    ipcRenderer.on('trigger-screenshot', callback);
  },
  onTriggerTextInput: (callback: () => void) => {
    ipcRenderer.on('trigger-text-input', callback);
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // 区域选择器专用方法
  sendScreenshotAreaSelected: (area: { x: number; y: number; width: number; height: number }) => {
    ipcRenderer.send('screenshot-area-selected', area);
  },
  sendScreenshotAreaCancelled: () => {
    ipcRenderer.send('screenshot-area-cancelled');
  },
});

// TypeScript类型定义
declare global {
  interface Window {
    electronAPI: {
      getStoreValue: (key: string) => Promise<any>;
      setStoreValue: (key: string, value: any) => Promise<void>;
      getAllStore: () => Promise<any>;
      takeScreenshot: () => Promise<string>;
      selectScreenshotArea: () => Promise<string>;
      onTriggerScreenshot: (callback: () => void) => void;
      onTriggerTextInput: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
      sendScreenshotAreaSelected: (area: { x: number; y: number; width: number; height: number }) => void;
      sendScreenshotAreaCancelled: () => void;
    };
  }
}


