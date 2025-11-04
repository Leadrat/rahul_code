import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader, Sparkles, FileText, Plus, History, Trash2, MessageSquare } from 'lucide-react';
import './Chatbot.css';

const API_BASE_URL = 'http://localhost:5000/api';

const Chatbot = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    sessions: false,
    history: false,
    deletion: false,
    initializing: true
  });
  const messagesEndRef = useRef(null);

  // Initialize chat session on component mount
  useEffect(() => {
    const initialize = async () => {
      setLoadingStates(prev => ({ ...prev, initializing: true }));
      try {
        // First load all sessions
        await loadSessions();
        
        // Then try to load the most recent session
        const sessionsResponse = await axios.get(`${API_BASE_URL}/chatbot/sessions`);
        if (sessionsResponse.data.success && sessionsResponse.data.sessions.length > 0) {
          // Load the most recent session (first in the list since they're ordered by last_activity DESC)
          const mostRecentSession = sessionsResponse.data.sessions[0];
          await loadSession(mostRecentSession.session_id);
        } else {
          // No previous sessions, create a new one
          await createNewSession();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Fallback: create a new session
        await createNewSession();
      } finally {
        setLoadingStates(prev => ({ ...prev, initializing: false }));
      }
    };
    
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array is intentional - we only want this to run once on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showHistory) {
        setShowHistory(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };





  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !sessionId || isStreaming || isThinking) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsThinking(true);

    // Add thinking indicator
    const thinkingMessageId = Date.now();
    const thinkingMessage = {
      id: thinkingMessageId,
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isThinking: true
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: currentMessage
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.success && data.chunk) {
                // On first chunk, replace thinking with streaming
                if (firstChunk) {
                  setIsThinking(false);
                  setIsStreaming(true);
                  setMessages(prev => prev.map(msg => 
                    msg.id === thinkingMessageId 
                      ? { 
                          ...msg, 
                          content: data.chunk,
                          isThinking: false,
                          isStreaming: true
                        }
                      : msg
                  ));
                  firstChunk = false;
                } else {
                  setMessages(prev => prev.map(msg => 
                    msg.id === thinkingMessageId 
                      ? { ...msg, content: msg.content + data.chunk }
                      : msg
                  ));
                }
              }
              
              if (data.done) {
                setMessages(prev => prev.map(msg => 
                  msg.id === thinkingMessageId 
                    ? { ...msg, isStreaming: false }
                    : msg
                ));
                setIsStreaming(false);
                loadSessions(); // Refresh sessions after new message
                return;
              }
              
              if (!data.success) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessageId 
          ? { 
              ...msg, 
              content: 'Failed to get response. Please try again.',
              type: 'error',
              isStreaming: false,
              isThinking: false
            }
          : msg
      ));
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
    }
  };

  const loadSessions = async () => {
    setLoadingStates(prev => ({ ...prev, sessions: true }));
    try {
      const response = await axios.get(`${API_BASE_URL}/chatbot/sessions`);
      if (response.data.success) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, sessions: false }));
    }
  };

  const createNewSession = async () => {
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
        setSummary(null);
        loadSessions();
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const loadSession = async (selectedSessionId) => {
    setLoadingStates(prev => ({ ...prev, history: true }));
    try {
      setSessionId(selectedSessionId);
      
      // Load conversation history
      const historyResponse = await axios.get(`${API_BASE_URL}/chatbot/history/${selectedSessionId}`);
      if (historyResponse.data.success && historyResponse.data.history.length > 0) {
        const history = historyResponse.data.history.map(item => [
          {
            type: 'user',
            content: item.user_prompt,
            timestamp: new Date(item.created_at)
          },
          {
            type: 'bot',
            content: item.ai_response,
            timestamp: new Date(item.created_at)
          }
        ]).flat();
        
        setMessages(history);
      } else {
        // No conversation history, show welcome message
        setMessages([
          {
            type: 'bot',
            content: 'Hello! I\'m your Census 2011 India data assistant powered by Gemini AI. I can help you explore demographic data, housing statistics, literacy rates, and much more. What would you like to know?',
            timestamp: new Date()
          }
        ]);
      }
      
      // Try to load existing summary
      try {
        const summaryResponse = await axios.get(`${API_BASE_URL}/chatbot/summary/${selectedSessionId}`);
        if (summaryResponse.data.success) {
          setSummary(summaryResponse.data.summary.summary);
        }
      } catch (summaryError) {
        // No summary exists yet, that's okay
        setSummary(null);
      }
      
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, history: false }));
    }
  };

  const deleteSession = async (sessionIdToDelete) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    
    setLoadingStates(prev => ({ ...prev, deletion: true }));
    try {
      await axios.delete(`${API_BASE_URL}/chatbot/sessions/${sessionIdToDelete}`);
      
      // If we're deleting the current session, create a new one
      if (sessionIdToDelete === sessionId) {
        await createNewSession();
      }
      
      loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, deletion: false }));
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

  // Show loading screen while initializing
  if (loadingStates.initializing) {
    return (
      <div className="chatbot-container">
        <div className="chatbot-loading">
          <div className="loading-content">
            <Bot size={48} className="loading-icon" />
            <h2>Loading Census AI Assistant...</h2>
            <div className="loading-spinner">
              <Loader className="spinning" size={32} />
            </div>
            <p>Preparing your previous session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <Bot className="header-icon" size={28} />
          <div>
            <h2>Census 2011 AI Assistant</h2>
            <p>Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="action-button"
            onClick={() => setShowHistory(!showHistory)}
            title="Session history"
            disabled={loadingStates.sessions}
          >
            {loadingStates.sessions ? (
              <Loader className="spinning" size={20} />
            ) : (
              <History size={20} />
            )}
            History
          </button>
          <button 
            className="action-button"
            onClick={createNewSession}
            title={messages.length <= 1 ? "Session is already empty" : "Start new session"}
            disabled={messages.length <= 1}
          >
            <Plus size={20} />
            New
          </button>
          <button 
            className="action-button"
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
      </div>

      {showHistory && (
        <div className="history-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <div className="history-modal-title">
                <History size={24} />
                <h3>Previous Sessions</h3>
              </div>
              <button 
                className="history-modal-close"
                onClick={() => setShowHistory(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="history-modal-content">
              {loadingStates.history && (
                <div className="loading-sessions">
                  <Loader className="spinning" size={24} />
                  <span>Loading session...</span>
                </div>
              )}
              {sessions.map((session) => (
                <div key={session.session_id} className="history-item">
                  <div 
                    className="history-content"
                    onClick={() => !loadingStates.history && loadSession(session.session_id)}
                  >
                    <div className="history-title">
                      <MessageSquare size={16} />
                      {session.first_message ? 
                        session.first_message.substring(0, 60) + '...' : 
                        'New Session'
                      }
                    </div>
                    <div className="history-meta">
                      <span>{session.message_count} messages</span>
                      <span>{new Date(session.last_activity).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                    className="delete-session"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.session_id);
                    }}
                    title="Delete session"
                    disabled={loadingStates.deletion}
                  >
                    {loadingStates.deletion ? (
                      <Loader className="spinning" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              ))}
              {sessions.length === 0 && !loadingStates.sessions && (
                <div className="no-sessions">
                  <MessageSquare size={48} className="no-sessions-icon" />
                  <h4>No Previous Sessions</h4>
                  <p>Start a conversation to create your first session!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={message.id || index} className={`message ${message.type}-message ${message.isStreaming ? 'streaming' : ''} ${message.isThinking ? 'thinking' : ''}`}>
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
              <div className="message-text">
                {message.isThinking ? (
                  <div className="thinking-indicator">
                    <span className="thinking-text">Thinking</span>
                    <div className="thinking-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                ) : (
                  <>
                    {message.content}
                    {message.isStreaming && <span className="streaming-cursor">|</span>}
                  </>
                )}
              </div>
              <div className="message-timestamp">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        

        
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
          disabled={isStreaming || isThinking || !sessionId}
          className="chatbot-input"
        />
        <button 
          type="submit" 
          disabled={isStreaming || isThinking || !inputMessage.trim() || !sessionId}
          className="send-button"
          title="Send message"
        >
          <div className="send-button-content">
            {isStreaming || isThinking ? (
              <Loader className="spinning" size={20} />
            ) : (
              <Send size={20} />
            )}
            <span className="send-button-text">Send</span>
          </div>
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
