import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import PromptManager from './PromptManager';
import { listAvailableModels } from '../services/gemini';
import './SettingsPanel.css';

function SettingsPanel() {
  const { apiConfig, setApiConfig } = useApp();
  const [localConfig, setLocalConfig] = useState({
    apiKey: '',
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    visionModel: 'gemini-2.0-flash',
  });
  const [availableModels, setAvailableModels] = useState<Array<{name: string, displayName: string, supportedMethods: string[]}>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (apiConfig) {
      setLocalConfig({
        apiKey: apiConfig.apiKey || '',
        model: apiConfig.model || 'gemini-2.0-flash',
        temperature: apiConfig.temperature || 0.7,
        visionModel: apiConfig.visionModel || 'gemini-2.0-flash',
      });
    }
  }, [apiConfig]);

  const handleSave = () => {
    setApiConfig(localConfig);
    alert('设置已保存');
  };

  const handleListModels = async () => {
    if (!localConfig.apiKey) {
      alert('请先输入 API 密钥');
      return;
    }

    setIsLoadingModels(true);
    try {
      const models = await listAvailableModels(localConfig.apiKey);
      setAvailableModels(models);
      
      // 显示可用模型信息
      const modelInfo = models.map(m => {
        const shortName = m.name.replace('models/', '');
        const supportsGenerate = m.supportedMethods.includes('generateContent');
        return `${shortName}${supportsGenerate ? ' ✓' : ' ✗'}`;
      }).join('\n');
      
      alert(`找到 ${models.length} 个可用模型：\n\n${modelInfo}\n\n详细信息已显示在下方`);
    } catch (error: any) {
      alert('获取模型列表失败: ' + error.message);
      console.error('Error listing models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-section">
        <h2>API配置</h2>
        <div className="settings-form">
          <div className="form-group">
            <label>Google Gemini API Key</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                placeholder="AIza..."
                style={{ flex: 1 }}
              />
              <button
                onClick={handleListModels}
                disabled={isLoadingModels || !localConfig.apiKey}
                className="list-models-button"
              >
                {isLoadingModels ? '查询中...' : '查看可用模型'}
              </button>
            </div>
            <small>你的API密钥会加密存储在本地。获取API密钥：<a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></small>
          </div>

          <div className="form-group">
            <label>文字模型</label>
            <select
              value={localConfig.model}
              onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash（推荐，快速）</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro（更强大）</option>
            </select>
            <small>根据你的 API 密钥，这些是可用模型</small>
          </div>

          <div className="form-group">
            <label>Vision模型（截图分析）</label>
            <select
              value={localConfig.visionModel}
              onChange={(e) => setLocalConfig({ ...localConfig, visionModel: e.target.value })}
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash（推荐，快速）</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro（更强大）</option>
            </select>
            <small>Gemini 2.0/2.5 系列模型同时支持文本和视觉，无需单独的 vision 模型</small>
          </div>

          <div className="form-group">
            <label>Temperature: {localConfig.temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localConfig.temperature}
              onChange={(e) => setLocalConfig({ ...localConfig, temperature: parseFloat(e.target.value) })}
            />
            <small>控制回答的随机性，0=确定性，1=创造性</small>
          </div>

          <button className="save-button" onClick={handleSave}>
            保存设置
          </button>
        </div>

        {availableModels.length > 0 && (
          <div className="available-models">
            <h3>可用模型列表 ({availableModels.length})</h3>
            <div className="models-list">
              {availableModels.map((model, index) => {
                const shortName = model.name.replace('models/', '');
                const supportsGenerate = model.supportedMethods.includes('generateContent');
                return (
                  <div key={index} className="model-item">
                    <div className="model-name">
                      <strong>{shortName}</strong>
                      {supportsGenerate && <span className="model-badge">支持 generateContent</span>}
                    </div>
                    <div className="model-full-name">{model.name}</div>
                    {model.displayName && model.displayName !== model.name && (
                      <div className="model-display-name">{model.displayName}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h2>Prompt管理</h2>
        <PromptManager />
      </div>
    </div>
  );
}

export default SettingsPanel;

