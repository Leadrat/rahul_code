# Quick Setup Guide for Gemini AI Chatbot

## Prerequisites
- Python 3.8+
- Node.js 14+
- pip (Python package manager)
- npm (Node package manager)

## Step-by-Step Setup

### 1. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- google-generativeai (Gemini AI SDK)
- psycopg2-binary (PostgreSQL adapter)
- python-dotenv (Environment variables)
- All existing dependencies (pandas, flask, etc.)

### 2. Test the Setup (Optional but Recommended)

```bash
python test_chatbot.py
```

This will verify:
- ✓ All packages are installed correctly
- ✓ Gemini API is accessible
- ✓ Neon database connection works
- ✓ Census data can be loaded
- ✓ Chatbot initializes properly

### 3. Start the Backend Server

```bash
cd backend
python app.py
```

You should see:
```
✓ Data loaded successfully
⏳ Training ML models...
✓ ML models trained successfully
⏳ Initializing Gemini Chatbot...
✓ Database tables initialized successfully
✓ Gemini Chatbot initialized successfully
 * Running on http://127.0.0.1:5000
```

### 4. Install Frontend Dependencies (if not already done)

```bash
cd frontend
npm install
```

### 5. Start the Frontend

```bash
npm start
```

The application will open at `http://localhost:3000`

### 6. Access the Chatbot

Navigate to: `http://localhost:3000/chatbot`

Or click on "AI Chatbot" in the sidebar navigation.

## Quick Test

Once the chatbot is open, try these questions:

1. **"What is the total population of India according to Census 2011?"**
2. **"Which states have the highest literacy rates?"**
3. **"Tell me about internet penetration in rural vs urban areas"**
4. **"What is the sex ratio across different states?"**

## Features to Try

### 1. Ask Questions
Type any question about Census 2011 India data in the input box.

### 2. Use Quick Suggestions
Click on the suggestion buttons below the input for common queries.

### 3. Generate Summary
After having a conversation, click the "Summary" button in the header to get an AI-generated summary of your entire conversation.

### 4. View History
All your messages are automatically saved and displayed in the chat interface.

## Troubleshooting

### Backend won't start
**Error:** `ModuleNotFoundError: No module named 'google.generativeai'`
**Solution:** Run `pip install google-generativeai`

**Error:** `ModuleNotFoundError: No module named 'psycopg2'`
**Solution:** Run `pip install psycopg2-binary`

### Database connection fails
**Error:** `could not connect to server`
**Solution:** 
- Check your internet connection
- Verify the Neon database URL is correct
- Ensure your IP is allowed to connect

### Gemini API errors
**Error:** `API key not valid`
**Solution:** 
- Verify the API key in `backend/app.py`
- Check if the API key has quota remaining
- Ensure you have internet connectivity

### Frontend can't connect to backend
**Error:** `Network Error` or `ERR_CONNECTION_REFUSED`
**Solution:**
- Ensure backend is running on port 5000
- Check if `http://localhost:5000/api/health` returns a response
- Verify CORS is enabled in Flask

### Tables not created in database
**Error:** `relation "chat_sessions" does not exist`
**Solution:**
- The tables are created automatically on first run
- If they don't exist, check database permissions
- Try running the backend again

## Configuration

### Change API Key or Database URL

Edit `backend/app.py`:

```python
# Configuration
GEMINI_API_KEY = "your-api-key-here"
NEON_DB_URL = "your-database-url-here"
```

**Better approach:** Use environment variables

1. Create `.env` file in the project root:
```
GEMINI_API_KEY=your-api-key-here
NEON_DB_URL=your-database-url-here
```

2. Update `backend/app.py`:
```python
from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
NEON_DB_URL = os.getenv('NEON_DB_URL')
```

3. Add `.env` to `.gitignore`

## Database Schema

The chatbot automatically creates these tables:

### chat_sessions
- `session_id` (VARCHAR, PRIMARY KEY)
- `created_at` (TIMESTAMP)
- `last_activity` (TIMESTAMP)

### conversations
- `id` (SERIAL, PRIMARY KEY)
- `session_id` (VARCHAR, FOREIGN KEY)
- `user_prompt` (TEXT)
- `system_prompt` (TEXT)
- `ai_response` (TEXT)
- `created_at` (TIMESTAMP)

### conversation_summaries
- `id` (SERIAL, PRIMARY KEY)
- `session_id` (VARCHAR, FOREIGN KEY)
- `summary` (TEXT)
- `created_at` (TIMESTAMP)

## API Endpoints

### Create Session
```
POST /api/chatbot/session
Response: { success: true, session_id: "uuid" }
```

### Send Message
```
POST /api/chatbot/chat
Body: { session_id: "uuid", message: "your question" }
Response: { success: true, response: "AI answer", session_id: "uuid" }
```

### Get History
```
GET /api/chatbot/history/<session_id>
Response: { success: true, history: [...], session_id: "uuid" }
```

### Generate Summary
```
POST /api/chatbot/summary/<session_id>
Response: { success: true, summary: "...", session_id: "uuid", total_messages: 10 }
```

### Get Summary
```
GET /api/chatbot/summary/<session_id>
Response: { success: true, summary: {...}, session_id: "uuid" }
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `CHATBOT_FEATURE.md` for detailed documentation
3. Run `python test_chatbot.py` to diagnose issues

## Next Steps

After successful setup:
1. Explore different types of questions
2. Test the summary generation feature
3. Check the database to see stored conversations
4. Customize the UI in `frontend/src/components/Chatbot.css`
5. Enhance system prompts in `backend/gemini_chatbot.py`

Happy chatting! 🤖
