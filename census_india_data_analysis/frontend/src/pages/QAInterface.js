import React, { useState } from 'react';
import { MessageSquare, Send, Lightbulb } from 'lucide-react';
import { askQuestion } from '../services/api';
import './QAInterface.css';

const QAInterface = () => {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const exampleQuestions = [
    "What is the total population?",
    "Which states have the highest literacy rate?",
    "How many districts are in the dataset?",
    "What is the average worker participation rate?",
    "Show me internet connectivity statistics",
    "Which states are most urbanized?",
    "What is the gender distribution of workers?",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = {
      type: 'user',
      text: question,
      timestamp: new Date().toISOString(),
    };

    setConversation(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await askQuestion(question);
      
      const botMessage = {
        type: 'bot',
        text: response.answer,
        responseType: response.type,
        data: response.data,
        timestamp: new Date().toISOString(),
      };

      setConversation(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'bot',
        text: `Error: ${error.message}. Please try again.`,
        responseType: 'text',
        timestamp: new Date().toISOString(),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleQuestion) => {
    setQuestion(exampleQuestion);
  };

  const renderResponse = (message) => {
    if (message.responseType === 'table' && message.data) {
      return (
        <div className="response-content">
          <p className="response-text">{message.text}</p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {message.data.headers.map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.data.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return <p className="response-text">{message.text}</p>;
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Ask Questions About the Data</h1>
      <p className="page-subtitle">
        Use natural language to query the India Census dataset
      </p>

      <div className="qa-container">
        <div className="qa-sidebar">
          <div className="card">
            <h3 className="card-title">
              <Lightbulb size={20} />
              Example Questions
            </h3>
            <div className="example-questions">
              {exampleQuestions.map((q, index) => (
                <button
                  key={index}
                  className="example-question-btn"
                  onClick={() => handleExampleClick(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <h3 className="card-title">
              <MessageSquare size={20} />
              Tips
            </h3>
            <ul className="tips-list">
              <li>Ask about population, literacy, or workforce statistics</li>
              <li>Request comparisons between states</li>
              <li>Inquire about specific metrics or averages</li>
              <li>Ask for top-performing states or districts</li>
            </ul>
          </div>
        </div>

        <div className="qa-main">
          <div className="card chat-card">
            <div className="chat-messages">
              {conversation.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={64} color="#667eea" />
                  <h3>Start a Conversation</h3>
                  <p>Ask me anything about the India Census dataset!</p>
                </div>
              ) : (
                conversation.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
                  >
                    <div className="message-content">
                      {message.type === 'user' ? (
                        <p className="message-text">{message.text}</p>
                      ) : (
                        renderResponse(message)
                      )}
                    </div>
                    <div className="message-timestamp">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="message bot-message">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="chat-input"
                placeholder="Ask a question about the dataset..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="send-button"
                disabled={loading || !question.trim()}
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QAInterface;
