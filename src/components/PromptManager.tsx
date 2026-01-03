import { useState } from 'react';
import { useApp } from '../context/AppContext';
import './PromptManager.css';

function PromptManager() {
  const { prompts, addPrompt, updatePrompt, deletePrompt } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'architecture',
    content: '',
  });

  const categories = ['architecture', 'performance', 'scalability', 'security', 'other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updatePrompt(editingId, {
        id: editingId,
        ...formData,
      });
    } else {
      addPrompt({
        id: Date.now().toString(),
        ...formData,
      });
    }

    setFormData({ name: '', category: 'architecture', content: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (prompt: typeof prompts[0]) => {
    setFormData({
      name: prompt.name,
      category: prompt.category,
      content: prompt.content,
    });
    setEditingId(prompt.id);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', category: 'architecture', content: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="prompt-manager">
      <form onSubmit={handleSubmit} className="prompt-form">
        <div className="form-row">
          <div className="form-group">
            <label>名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 架构设计分析"
              required
            />
          </div>
          <div className="form-group">
            <label>分类</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Prompt内容</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="输入你的prompt内容..."
            rows={4}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="submit-button">
            {editingId ? '更新' : '添加'}
          </button>
          {isEditing && (
            <button type="button" className="cancel-button" onClick={handleCancel}>
              取消
            </button>
          )}
        </div>
      </form>

      <div className="prompt-list">
        {prompts.map(prompt => (
          <div key={prompt.id} className="prompt-item">
            <div className="prompt-item-header">
              <div>
                <strong>{prompt.name}</strong>
                <span className="prompt-category-badge">{prompt.category}</span>
              </div>
              <div className="prompt-item-actions">
                <button onClick={() => handleEdit(prompt)} className="edit-button">
                  编辑
                </button>
                <button onClick={() => deletePrompt(prompt.id)} className="delete-button">
                  删除
                </button>
              </div>
            </div>
            <div className="prompt-item-content">{prompt.content}</div>
          </div>
        ))}
        {prompts.length === 0 && (
          <div className="prompt-empty">还没有预设Prompt</div>
        )}
      </div>
    </div>
  );
}

export default PromptManager;


