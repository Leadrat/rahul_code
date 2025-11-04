import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader, Sparkles, FileText } from 'lucide-react';
import './Chatbot.css';

const API_BASE_URL = 'http://localhost:5000/api';

const Chatbot = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize chat session on component mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chatbot/session`);
      if (response.data.success) {
        setSessionId(response.data.session_id);
        setMessages([
          {
            type: 'bot',
            content: 'Hello! I\'m your Census 2011 India data assistant powered by Gemini AI. I can help you explore demographic data, housing statistics, literacy rates, and much more. What would you like to know?',
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      setMessages([
        {
          type: 'error',
          content: 'Failed to initialize chat session. Please refresh the page.',
          timestamp: new Date()
        }
      ]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chatbot/chat`, {
        session_id: sessionId,
        message: inputMessage
      });

      if (response.data.success) {
        const botMessage = {
          type: 'bot',
          content: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          type: 'error',
          content: `Error: ${response.data.error}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'error',
        content: 'Failed to get response. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!sessionId || isSummarizing || messages.length <= 1) return;

    setIsSummarizing(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/chatbot/summary/${sessionId}`);
      
      if (response.data.success) {
        setSummary(response.data.summary);
      } else {
        alert(`Error generating summary: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <Bot className="header-icon" size={28} />
          <div>
            <h2>Census 2011 AI Assistant</h2>
            <p>Powered by Gemini AI</p>
          </div>
        </div>
        <button 
          className="summary-button"
          onClick={generateSummary}
          disabled={isSummarizing || messages.length <= 1}
          title="Generate conversation summary"
        >
          {isSummarizing ? (
            <Loader className="spinning" size={20} />
          ) : (
            <FileText size={20} />
          )}
          Summary
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}-message`}>
            <div className="message-icon">
              {message.type === 'user' ? (
                <User size={20} />
              ) : message.type === 'bot' ? (
                <Bot size={20} />
              ) : (
                <span>⚠️</span>
              )}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-timestamp">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message bot-message">
            <div className="message-icon">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {summary && (
        <div className="summary-modal">
          <div className="summary-content">
            <div className="summary-header">
              <h3>
                <Sparkles size={20} />
                Conversation Summary
              </h3>
              <button onClick={() => setSummary(null)}>✕</button>
            </div>
            <div className="summary-text">{summary}</div>
          </div>
        </div>
      )}

      <form className="chatbot-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask me anything about Census 2011 India data..."
          disabled={isLoading || !sessionId}
          className="chatbot-input"
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputMessage.trim() || !sessionId}
          className="send-button"
        >
          {isLoading ? (
            <Loader className="spinning" size={20} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>

      <div className="chatbot-suggestions">
        <p>Try asking:</p>
        <div className="suggestions-list">
          <button onClick={() => setInputMessage("What is the total population of India according to Census 2011?")}>
            Total population
          </button>
          <button onClick={() => setInputMessage("Which states have the highest literacy rates?")}>
            Literacy rates
          </button>
          <button onClick={() => setInputMessage("Tell me about internet penetration in rural vs urban areas")}>
            Internet access
          </button>
          <button onClick={() => setInputMessage("What is the sex ratio across different states?")}>
            Sex ratio
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
