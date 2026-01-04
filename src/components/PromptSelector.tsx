import { useState } from 'react';
import './PromptSelector.css';

interface Prompt {
  id: string;
  name: string;
  category: string;
  content: string;
}

interface PromptSelectorProps {
  prompts: Prompt[];
  selectedPrompt: string;
  onSelectPrompt: (prompt: string) => void;
}

function PromptSelector({ prompts, selectedPrompt, onSelectPrompt }: PromptSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = Array.from(new Set(prompts.map(p => p.category)));

  const handleSelectPrompt = (prompt: Prompt) => {
    onSelectPrompt(prompt.content);
    setIsOpen(false);
  };

  return (
    <div className="prompt-selector">
      <div className="prompt-selector-header">
        <label>预设Prompt:</label>
        <button
          className="prompt-toggle-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '收起' : '展开'} ({prompts.length})
        </button>
      </div>
      
      {isOpen && (
        <div className="prompt-list">
          {categories.map(category => (
            <div key={category} className="prompt-category">
              <div className="prompt-category-title">{category}</div>
              <div className="prompt-items">
                {prompts
                  .filter(p => p.category === category)
                  .map(prompt => (
                    <button
                      key={prompt.id}
                      className={`prompt-item ${selectedPrompt === prompt.content ? 'active' : ''}`}
                      onClick={() => handleSelectPrompt(prompt)}
                      title={prompt.content}
                    >
                      {prompt.name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {prompts.length === 0 && (
            <div className="prompt-empty">暂无预设Prompt，请在设置中添加</div>
          )}
        </div>
      )}
      
      {selectedPrompt && (
        <div className="selected-prompt-preview">
          <strong>当前Prompt:</strong>
          <div className="prompt-preview-text">{selectedPrompt.substring(0, 100)}...</div>
        </div>
      )}
    </div>
  );
}

export default PromptSelector;




