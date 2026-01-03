import { useApp } from '../context/AppContext';
import './ChatArea.css';

function ChatArea() {
  const { history } = useApp();

  return (
    <div className="chat-area">
      <div className="chat-area-header">
        <h3>对话历史</h3>
        <span className="chat-count">{history.length} 条记录</span>
      </div>
      <div className="chat-messages">
        {history.length === 0 ? (
          <div className="chat-empty">
            <p>还没有对话记录</p>
            <p className="chat-empty-hint">使用截图或文字输入开始提问</p>
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} className="chat-message">
              <div className="message-header">
                <span className="message-type">
                  {item.type === 'screenshot' ? '📷 截图' : '✏️ 文字'}
                </span>
                <span className="message-time">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="message-question">
                <strong>Q:</strong> {item.question}
              </div>
              {item.imageBase64 && (
                <div className="message-image">
                  <img
                    src={`data:image/png;base64,${item.imageBase64}`}
                    alt="Screenshot"
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                  />
                </div>
              )}
              <div className="message-answer">
                <strong>A:</strong>
                <div className="answer-content">{item.answer}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChatArea;



