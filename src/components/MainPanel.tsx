import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { analyzeScreenshot, chatWithGemini } from '../services/gemini';
import PromptSelector from './PromptSelector';
import ChatArea from './ChatArea';
import TextInputModal from './TextInputModal';
import './MainPanel.css';

function MainPanel() {
  const { apiConfig, prompts, addHistory } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  
  // 使用ref存储最新的值，避免useEffect依赖问题
  const apiConfigRef = useRef(apiConfig);
  const currentPromptRef = useRef(currentPrompt);
  const addHistoryRef = useRef(addHistory);
  
  useEffect(() => {
    apiConfigRef.current = apiConfig;
    currentPromptRef.current = currentPrompt;
    addHistoryRef.current = addHistory;
  }, [apiConfig, currentPrompt, addHistory]);

  const handleScreenshot = async () => {
    const config = apiConfigRef.current;
    if (!config?.apiKey) {
      alert('请先在设置中配置Gemini API密钥');
      return;
    }

    // 检查 electronAPI 是否可用
    if (typeof window === 'undefined' || !window.electronAPI) {
      alert('截图功能不可用。请确保在 Electron 环境中运行应用。\n\n如果在浏览器中测试，请使用 Electron 应用。');
      console.error('window.electronAPI is not available. Running in:', typeof window !== 'undefined' ? 'browser' : 'unknown');
      return;
    }

    if (!window.electronAPI.selectScreenshotArea) {
      alert('截图功能不可用。selectScreenshotArea 方法不存在。\n\n请检查 preload 脚本是否正确加载。');
      console.error('selectScreenshotArea method not found. Available methods:', Object.keys(window.electronAPI || {}));
      return;
    }

    setIsLoading(true);
    try {
      console.log('Calling selectScreenshotArea...');
      const imageBase64 = await window.electronAPI.selectScreenshotArea();
      console.log('Screenshot captured, length:', imageBase64?.length);
      
      // 预设Prompt作为system instruction，用户问题作为默认提示
      const systemPrompt = currentPromptRef.current || 
        'You are an expert System Design interviewer and advisor. Help analyze system design questions and provide detailed, structured answers.';
      const userPrompt = '请分析这个System Design问题，并提供详细的架构设计建议。';
      
      const answer = await analyzeScreenshot(
        imageBase64,
        userPrompt,
        config.apiKey,
        config.visionModel || 'gemini-2.0-flash',
        config.temperature || 0.7,
        systemPrompt // 传递预设Prompt作为system instruction
      );

      addHistoryRef.current({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        question: userPrompt,
        answer: answer,
        type: 'screenshot',
        imageBase64: imageBase64,
      });
    } catch (error: any) {
      alert('错误: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 监听来自主进程的快捷键事件
    if (window.electronAPI) {
      window.electronAPI.onTriggerScreenshot(() => {
        handleScreenshot();
      });

      window.electronAPI.onTriggerTextInput(() => {
        setIsTextModalOpen(true);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('trigger-screenshot');
        window.electronAPI.removeAllListeners('trigger-text-input');
      }
    };
  }, []); // 空依赖数组，使用ref来访问最新值

  const handleTextInput = async (text: string) => {
    if (!apiConfig?.apiKey) {
      alert('请先在设置中配置Gemini API密钥');
      return;
    }

    setIsLoading(true);
    try {
      const systemPrompt = currentPrompt || 
        'You are an expert System Design interviewer and advisor. Help answer system design questions with detailed, structured responses.';
      
      // 调试：打印使用的 systemPrompt
      console.log('Using systemPrompt:', systemPrompt);
      console.log('Current prompt state:', currentPrompt);
      
      const answer = await chatWithGemini(
        text,
        systemPrompt,
        apiConfig.apiKey,
        apiConfig.model || 'gemini-2.0-flash',
        apiConfig.temperature || 0.7
      );

      addHistory({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        question: text,
        answer: answer,
        type: 'text',
      });
    } catch (error: any) {
      alert('错误: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-panel">
      <div className="main-panel-header">
        <PromptSelector
          prompts={prompts}
          selectedPrompt={currentPrompt}
          onSelectPrompt={setCurrentPrompt}
        />
      </div>
      
      <div className="main-panel-actions">
        <button
          className="action-button screenshot-button"
          onClick={handleScreenshot}
          disabled={isLoading}
        >
          {isLoading ? '处理中...' : '📷 截图提问'}
        </button>
        <button
          className="action-button text-button"
          onClick={() => setIsTextModalOpen(true)}
          disabled={isLoading}
        >
          {isLoading ? '处理中...' : '✏️ 文字输入'}
        </button>
      </div>

      <div className="main-panel-content">
        <ChatArea />
      </div>

      <TextInputModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onSubmit={handleTextInput}
      />
    </div>
  );
}

export default MainPanel;

