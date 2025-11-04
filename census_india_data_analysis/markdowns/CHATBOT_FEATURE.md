# Gemini AI Chatbot Feature

## Overview
This feature adds an intelligent chatbot powered by Google's Gemini AI to analyze and answer questions about the Census 2011 India dataset. The chatbot stores all conversations in a Neon PostgreSQL database and can generate summaries of entire conversation sessions.

## Features

### 1. **Intelligent Q&A with Gemini AI**
- Uses Google's Gemini Pro model for natural language understanding
- Provides context-aware responses based on the census dataset
- Dynamically creates system prompts for each user query
- Understands complex questions about demographics, housing, literacy, and more

### 2. **Database Storage (Neon PostgreSQL)**
- Stores all chat sessions with unique session IDs
- Saves user prompts, system prompts, and AI responses
- Tracks conversation timestamps
- Enables conversation history retrieval

### 3. **Conversation Summaries**
- Generates AI-powered summaries of entire conversations
- Identifies main topics, key statistics, and insights discussed
- Stores summaries in the database for future reference

### 4. **Modern React UI**
- Clean, responsive chat interface
- Real-time message updates
- Typing indicators
- Quick suggestion buttons
- Beautiful gradient design
- Mobile-friendly layout

## Architecture

### Backend Components

#### `backend/gemini_chatbot.py`
Main chatbot class with the following methods:
- `__init__()`: Initialize Gemini API and database connection
- `_init_database()`: Create necessary database tables
- `create_session()`: Create new chat session
- `chat()`: Process user messages and generate responses
- `get_conversation_history()`: Retrieve chat history
- `generate_conversation_summary()`: Create AI summary of conversation
- `_create_system_prompt()`: Generate dynamic system prompts with dataset context

#### Database Schema

**chat_sessions table:**
```sql
- session_id (VARCHAR, PRIMARY KEY)
- created_at (TIMESTAMP)
- last_activity (TIMESTAMP)
```

**conversations table:**
```sql
- id (SERIAL, PRIMARY KEY)
- session_id (VARCHAR, FOREIGN KEY)
- user_prompt (TEXT)
- system_prompt (TEXT)
- ai_response (TEXT)
- created_at (TIMESTAMP)
```

**conversation_summaries table:**
```sql
- id (SERIAL, PRIMARY KEY)
- session_id (VARCHAR, FOREIGN KEY)
- summary (TEXT)
- created_at (TIMESTAMP)
```

### API Endpoints

#### `POST /api/chatbot/session`
Create a new chat session
- **Response:** `{ success: true, session_id: "uuid" }`

#### `POST /api/chatbot/chat`
Send a message to the chatbot
- **Request:** `{ session_id: "uuid", message: "user question" }`
- **Response:** `{ success: true, response: "AI answer", session_id: "uuid" }`

#### `GET /api/chatbot/history/<session_id>`
Get conversation history
- **Response:** `{ success: true, history: [...], session_id: "uuid" }`

#### `POST /api/chatbot/summary/<session_id>`
Generate conversation summary
- **Response:** `{ success: true, summary: "...", session_id: "uuid", total_messages: 10 }`

#### `GET /api/chatbot/summary/<session_id>`
Get existing summary
- **Response:** `{ success: true, summary: {...}, session_id: "uuid" }`

### Frontend Components

#### `frontend/src/components/Chatbot.js`
Main React component featuring:
- Session initialization
- Message sending/receiving
- Real-time chat interface
- Summary generation
- Quick suggestion buttons
- Auto-scrolling messages

#### `frontend/src/components/Chatbot.css`
Comprehensive styling with:
- Gradient color schemes
- Smooth animations
- Responsive design
- Custom scrollbars
- Modal dialogs

## Configuration

### Environment Variables
The following are hardcoded in `backend/app.py` but can be moved to environment variables:

```python
GEMINI_API_KEY = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
NEON_DB_URL = "postgresql://neondb_owner:npg_QaDL2XEYuId8@ep-jolly-sound-a42vi9ji-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Dependencies Added

**Backend (requirements.txt):**
- `google-generativeai` - Gemini AI SDK
- `psycopg2-binary` - PostgreSQL adapter
- `python-dotenv` - Environment variable management
- `uuid` - Session ID generation

**Frontend (package.json):**
- `lucide-react` - Icon library (already present)
- `axios` - HTTP client (already present)

## Usage

### Starting the Application

1. **Install Backend Dependencies:**
```bash
pip install -r requirements.txt
```

2. **Start Backend Server:**
```bash
cd backend
python app.py
```

3. **Install Frontend Dependencies:**
```bash
cd frontend
npm install
```

4. **Start Frontend:**
```bash
npm start
```

5. **Access Chatbot:**
Navigate to `http://localhost:3000/chatbot`

### Using the Chatbot

1. **Start Conversation:** The chatbot automatically creates a session when you open the page
2. **Ask Questions:** Type your question about Census 2011 data
3. **Use Suggestions:** Click quick suggestion buttons for common queries
4. **Generate Summary:** Click the "Summary" button to get an AI-generated overview of your conversation

### Example Questions

- "What is the total population of India according to Census 2011?"
- "Which states have the highest literacy rates?"
- "Tell me about internet penetration in rural vs urban areas"
- "What is the sex ratio across different states?"
- "Compare worker participation rates between male and female"
- "Which districts have the best sanitation facilities?"

## How It Works

### System Prompt Generation

For each user question, the chatbot:
1. Extracts dataset context (statistics, available columns, key metrics)
2. Creates a comprehensive system prompt including:
   - Dataset overview
   - Available data categories
   - Key statistics
   - Instructions for the AI
   - The user's question

3. Sends the system prompt to Gemini AI
4. Receives and formats the response
5. Stores everything in the database

### Example System Prompt Structure:
```
You are an expert data analyst specializing in Indian Census 2011 data...

CENSUS 2011 INDIA DATASET CONTEXT:
- Total Districts: 640
- Total States/UTs: 35
- Total Population: 1,210,854,977
...

INSTRUCTIONS:
1. Answer questions accurately based on the dataset context
2. Provide insights and context
...

USER QUESTION: What is the literacy rate in Kerala?
```

## Database Queries

The chatbot performs efficient database operations:
- Uses parameterized queries to prevent SQL injection
- Implements connection pooling
- Handles errors gracefully
- Maintains referential integrity with foreign keys

## Security Considerations

⚠️ **Important:** The current implementation has hardcoded credentials. For production:

1. Move API keys and database URLs to environment variables
2. Use `.env` file with `python-dotenv`
3. Add `.env` to `.gitignore`
4. Implement rate limiting
5. Add authentication for API endpoints
6. Validate and sanitize all user inputs

## Future Enhancements

Potential improvements:
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Export conversation history
- [ ] Share conversations
- [ ] Advanced analytics on chat patterns
- [ ] Integration with visualization tools
- [ ] Suggested follow-up questions
- [ ] Context-aware responses based on previous messages
- [ ] User authentication and personalized sessions

## Troubleshooting

### Common Issues

**1. Database Connection Error:**
- Verify Neon database URL is correct
- Check network connectivity
- Ensure database allows connections from your IP

**2. Gemini API Error:**
- Verify API key is valid
- Check API quota limits
- Ensure internet connectivity

**3. Frontend Can't Connect to Backend:**
- Verify backend is running on port 5000
- Check CORS settings
- Ensure API_BASE_URL in Chatbot.js is correct

**4. Tables Not Created:**
- Check database permissions
- Manually run table creation SQL
- Verify PostgreSQL version compatibility

## License

This feature is part of the ML Data Analysis project and follows the same license terms.
