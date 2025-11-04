# Gemini AI Chatbot Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React Frontend - Port 3000)                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Chatbot Component                      │  │
│  │  • Message Display                                        │  │
│  │  • Input Form                                             │  │
│  │  • Summary Modal                                          │  │
│  │  • Quick Suggestions                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FLASK BACKEND (Port 5000)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Endpoints                          │  │
│  │  • POST /api/chatbot/session                             │  │
│  │  • POST /api/chatbot/chat                                │  │
│  │  • GET  /api/chatbot/history/<session_id>               │  │
│  │  • POST /api/chatbot/summary/<session_id>               │  │
│  │  • GET  /api/chatbot/summary/<session_id>               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              GeminiChatbot Class                          │  │
│  │  • create_session()                                       │  │
│  │  • chat()                                                 │  │
│  │  • _create_system_prompt()                               │  │
│  │  • get_conversation_history()                            │  │
│  │  • generate_conversation_summary()                       │  │
│  │  • _save_conversation()                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                                    │
           │                                    │
           ▼                                    ▼
┌──────────────────────────┐      ┌──────────────────────────────┐
│   GOOGLE GEMINI API      │      │   NEON POSTGRESQL DATABASE   │
│   (gemini-pro model)     │      │                              │
│                          │      │  ┌────────────────────────┐  │
│  • Natural Language      │      │  │   chat_sessions        │  │
│    Understanding         │      │  │  - session_id (PK)     │  │
│  • Context-aware         │      │  │  - created_at          │  │
│    Responses             │      │  │  - last_activity       │  │
│  • Summary Generation    │      │  └────────────────────────┘  │
│                          │      │                              │
└──────────────────────────┘      │  ┌────────────────────────┐  │
                                  │  │   conversations        │  │
                                  │  │  - id (PK)             │  │
                                  │  │  - session_id (FK)     │  │
                                  │  │  - user_prompt         │  │
                                  │  │  - system_prompt       │  │
                                  │  │  - ai_response         │  │
                                  │  │  - created_at          │  │
                                  │  └────────────────────────┘  │
                                  │                              │
                                  │  ┌────────────────────────┐  │
                                  │  │ conversation_summaries │  │
                                  │  │  - id (PK)             │  │
                                  │  │  - session_id (FK)     │  │
                                  │  │  - summary             │  │
                                  │  │  - created_at          │  │
                                  │  └────────────────────────┘  │
                                  └──────────────────────────────┘
                                               ▲
                                               │
                                               │
                                  ┌────────────────────────────┐
                                  │   CENSUS 2011 DATA         │
                                  │   (CSV Files)              │
                                  │                            │
                                  │  • district.csv            │
                                  │  • housing.csv             │
                                  │  • primary-census.csv      │
                                  └────────────────────────────┘
```

## Data Flow

### 1. User Sends Message

```
User Input → Frontend (Chatbot.js)
           → POST /api/chatbot/chat
           → GeminiChatbot.chat()
```

### 2. System Prompt Creation

```
GeminiChatbot._create_system_prompt()
    │
    ├─→ Load Census Dataset Context
    │   • Total population
    │   • Available columns
    │   • Key statistics
    │
    ├─→ Create Instructions for AI
    │   • Answer accurately
    │   • Provide insights
    │   • Format responses
    │
    └─→ Combine with User Question
        → Complete System Prompt
```

### 3. AI Processing

```
System Prompt → Google Gemini API
              → gemini-pro model processes
              → Generates contextual response
              → Returns AI answer
```

### 4. Database Storage

```
User Prompt + System Prompt + AI Response
    │
    ├─→ INSERT INTO conversations
    │   • session_id
    │   • user_prompt
    │   • system_prompt
    │   • ai_response
    │   • timestamp
    │
    └─→ UPDATE chat_sessions
        • last_activity = NOW()
```

### 5. Response to User

```
AI Response → Backend JSON
           → Frontend receives
           → Display in chat interface
           → Auto-scroll to bottom
```

## Component Interactions

### Frontend Components

```
App.js
  │
  ├─→ Layout.js (Navigation)
  │     │
  │     └─→ Sidebar with "AI Chatbot" link
  │
  └─→ Routes
        │
        └─→ /chatbot → Chatbot.js
                         │
                         ├─→ useEffect: Initialize session
                         ├─→ sendMessage(): Send user input
                         ├─→ generateSummary(): Create summary
                         └─→ Render: Messages, input, suggestions
```

### Backend Components

```
app.py
  │
  ├─→ initialize_data()
  │     │
  │     ├─→ Load census datasets
  │     ├─→ Train ML models
  │     └─→ Initialize GeminiChatbot
  │
  └─→ API Routes
        │
        ├─→ /api/chatbot/session
        ├─→ /api/chatbot/chat
        ├─→ /api/chatbot/history/<id>
        └─→ /api/chatbot/summary/<id>

gemini_chatbot.py
  │
  ├─→ __init__(): Setup Gemini & DB
  ├─→ _init_database(): Create tables
  ├─→ create_session(): New chat session
  ├─→ chat(): Process messages
  ├─→ _create_system_prompt(): Dynamic prompts
  ├─→ _save_conversation(): Store in DB
  └─→ generate_conversation_summary(): AI summary
```

## Technology Stack

### Frontend
- **React 18.2.0**: UI framework
- **React Router 6.20.0**: Navigation
- **Axios 1.6.2**: HTTP client
- **Lucide React**: Icons
- **CSS3**: Styling with animations

### Backend
- **Flask**: Web framework
- **Flask-CORS**: Cross-origin requests
- **Google Generative AI**: Gemini API SDK
- **psycopg2**: PostgreSQL adapter
- **Pandas**: Data manipulation

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL
- **SSL/TLS**: Secure connections
- **Connection pooling**: Efficient queries

### External Services
- **Google Gemini API**: AI model (gemini-pro)
- **Neon Database**: Cloud PostgreSQL hosting

## Security Layers

```
┌─────────────────────────────────────┐
│  1. HTTPS (Production)              │
│     • Encrypted communication       │
└─────────────────────────────────────┘
           │
┌─────────────────────────────────────┐
│  2. CORS Configuration              │
│     • Allowed origins               │
└─────────────────────────────────────┘
           │
┌─────────────────────────────────────┐
│  3. API Key Authentication          │
│     • Gemini API key                │
└─────────────────────────────────────┘
           │
┌─────────────────────────────────────┐
│  4. Database SSL Connection         │
│     • Encrypted DB queries          │
└─────────────────────────────────────┘
           │
┌─────────────────────────────────────┐
│  5. Parameterized Queries           │
│     • SQL injection prevention      │
└─────────────────────────────────────┘
```

## Performance Considerations

### Caching Strategy
- Census data loaded once at startup
- ML models trained once at startup
- Database connection pooling

### Optimization
- Async database operations
- Efficient SQL queries with indexes
- Frontend message virtualization (for large histories)
- Lazy loading of conversation history

### Scalability
- Stateless backend (horizontal scaling)
- Database connection pooling
- CDN for frontend assets (production)
- API rate limiting (recommended)

## Error Handling

```
User Action
    │
    ├─→ Frontend Validation
    │     • Empty message check
    │     • Session ID validation
    │
    ├─→ Backend Validation
    │     • Request data validation
    │     • Session existence check
    │
    ├─→ API Error Handling
    │     • Gemini API errors
    │     • Network timeouts
    │     • Rate limit errors
    │
    ├─→ Database Error Handling
    │     • Connection errors
    │     • Query failures
    │     • Constraint violations
    │
    └─→ User Feedback
          • Error messages in chat
          • Retry mechanisms
          • Graceful degradation
```

## Monitoring & Logging

### Backend Logs
- Session creation events
- Chat interactions
- API call success/failure
- Database operations
- Error stack traces

### Database Metrics
- Total sessions created
- Messages per session
- Average response time
- Summary generation frequency

### API Metrics
- Gemini API calls
- Response times
- Error rates
- Token usage

## Deployment Architecture (Production)

```
┌──────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                  (nginx/AWS ALB)                         │
└──────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐                 ┌────────▼───────┐
│  Frontend      │                 │  Frontend      │
│  (Static CDN)  │                 │  (Static CDN)  │
└────────────────┘                 └────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐                 ┌────────▼───────┐
│  Backend       │                 │  Backend       │
│  Instance 1    │                 │  Instance 2    │
└────────────────┘                 └────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐                 ┌────────▼───────┐
│  Neon DB       │                 │  Gemini API    │
│  (Primary)     │                 │  (Google)      │
└────────────────┘                 └────────────────┘
```

## Future Enhancements

### Phase 1: Core Improvements
- [ ] User authentication
- [ ] Session management
- [ ] Rate limiting
- [ ] Caching layer (Redis)

### Phase 2: Features
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Export conversations
- [ ] Share functionality

### Phase 3: Analytics
- [ ] Usage analytics
- [ ] Popular queries tracking
- [ ] Response quality metrics
- [ ] User satisfaction scoring

### Phase 4: Advanced AI
- [ ] Context-aware follow-ups
- [ ] Multi-turn conversations
- [ ] Suggested questions
- [ ] Visual data generation
