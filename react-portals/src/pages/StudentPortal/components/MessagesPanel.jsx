import './MessagesPanel.css';

const MessagesPanel = ({ isOpen, onClose, messages, onDeleteMessage, onClearMessages }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageTypeClass = (type) => {
    switch (type) {
      case 'payment':
        return 'payment';
      case 'reminder':
        return 'reminder';
      default:
        return 'info';
    }
  };

  return (
    <div className={`messages-panel ${isOpen ? 'active' : ''}`}>
      <div className="messages-header">
        <h3>
          <i className="fas fa-paper-plane"></i>
          Messages
        </h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {messages.length > 0 && (
            <button className="clear-messages-btn" onClick={onClearMessages}>
              <i className="fas fa-trash"></i>
              Clear All
            </button>
          )}
          <button className="close-messages" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="messages-content">
        {messages.length === 0 ? (
          <div className="no-messages">
            <i className="fas fa-inbox"></i>
            <h3>No Messages</h3>
            <p>You don't have any messages yet.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`message-item ${message.read ? '' : 'unread'}`}
            >
              <div className="message-header-info">
                <span className={`message-type ${getMessageTypeClass(message.type)}`}>
                  {message.type}
                </span>
                <span className="message-date">{formatDate(message.createdAt)}</span>
              </div>
              <div className="message-text">{message.message}</div>
              <button
                className="delete-message-btn"
                onClick={() => onDeleteMessage(message._id)}
                title="Delete message"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessagesPanel;
