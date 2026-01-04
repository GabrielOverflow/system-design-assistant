import { useApp } from '../context/AppContext';
import './HistoryPanel.css';

function HistoryPanel() {
  const { history, clearHistory } = useApp();

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>对话历史</h2>
        {history.length > 0 && (
          <button className="clear-button" onClick={() => {
            if (confirm('确定要清除所有历史记录吗？')) {
              clearHistory();
            }
          }}>
            清除历史
          </button>
        )}
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="history-empty">
            <p>还没有对话历史</p>
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} className="history-item">
              <div className="history-item-header">
                <span className="history-type">
                  {item.type === 'screenshot' ? '📷 截图' : '✏️ 文字'}
                </span>
                <span className="history-time">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="history-question">
                <strong>Q:</strong> {item.question}
              </div>
              {item.imageBase64 && (
                <div className="history-image">
                  <img
                    src={`data:image/png;base64,${item.imageBase64}`}
                    alt="Screenshot"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px' }}
                  />
                </div>
              )}
              <div className="history-answer">
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

export default HistoryPanel;




