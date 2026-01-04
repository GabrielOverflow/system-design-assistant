import { useState } from 'react';
import './TextInputModal.css';

interface TextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

function TextInputModal({ isOpen, onClose, onSubmit }: TextInputModalProps) {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
      onClose();
    }
  };

  const handleCancel = () => {
    setText('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>输入System Design问题</h3>
          <button className="modal-close" onClick={handleCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请输入你的System Design问题..."
            className="modal-textarea"
            autoFocus
            rows={6}
          />
          <div className="modal-actions">
            <button type="button" className="modal-button cancel" onClick={handleCancel}>
              取消
            </button>
            <button type="submit" className="modal-button submit" disabled={!text.trim()}>
              提交
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TextInputModal;




