import { useState, useEffect } from 'react';
import MainPanel from './components/MainPanel';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import { AppProvider } from './context/AppContext';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'main' | 'settings' | 'history'>('main');

  useEffect(() => {
    // 监听来自主进程的事件，切换到主界面
    if (window.electronAPI) {
      window.electronAPI.onTriggerScreenshot(() => {
        setCurrentView('main');
      });

      window.electronAPI.onTriggerTextInput(() => {
        setCurrentView('main');
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('trigger-screenshot');
        window.electronAPI.removeAllListeners('trigger-text-input');
      }
    };
  }, []);

  return (
    <AppProvider>
      <div className="app">
        <div className="app-header">
          <div className="app-title">
            <h1>System Design Assistant</h1>
          </div>
          <div className="app-nav">
            <button
              className={currentView === 'main' ? 'active' : ''}
              onClick={() => setCurrentView('main')}
            >
              主界面
            </button>
            <button
              className={currentView === 'history' ? 'active' : ''}
              onClick={() => setCurrentView('history')}
            >
              历史
            </button>
            <button
              className={currentView === 'settings' ? 'active' : ''}
              onClick={() => setCurrentView('settings')}
            >
              设置
            </button>
          </div>
        </div>
        <div className="app-content">
          {currentView === 'main' && <MainPanel />}
          {currentView === 'history' && <HistoryPanel />}
          {currentView === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </AppProvider>
  );
}

export default App;

