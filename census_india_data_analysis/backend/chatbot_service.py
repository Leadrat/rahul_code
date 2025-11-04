"""Chatbot service using Gemini LLM for census data Q&A.

Provides:
- Dataset context generation
- System prompt creation
- Gemini API integration
- Conversation storage in Neon database
"""
import google.generativeai as genai
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime
import uuid
import json
import os
from typing import Dict, List, Optional

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
genai.configure(api_key=GEMINI_API_KEY)

# Neon Database Configuration
DATABASE_URL = "postgresql://neondb_owner:npg_QaDL2XEYuId8@ep-jolly-sound-a42vi9ji-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

class ChatbotService:
    """Service for handling chatbot interactions with Gemini LLM."""
    
    def __init__(self, data_bundle):
        """Initialize chatbot service with dataset."""
        self.data_bundle = data_bundle
        self.model = genai.GenerativeModel('gemini-pro')
        self.dataset_context = self._generate_dataset_context()
        self._init_database()
    
    def _init_database(self):
        """Initialize database tables for conversation storage."""
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            # Create conversations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create messages table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(255) NOT NULL,
                    user_prompt TEXT NOT NULL,
                    system_prompt TEXT NOT NULL,
                    ai_response TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES conversations(session_id) ON DELETE CASCADE
                )
            """)
            
            conn.commit()
            cursor.close()
            conn.close()
            print("✓ Database tables initialized successfully")
        except Exception as e:
            print(f"✗ Error initializing database: {e}")
    
    def _generate_dataset_context(self) -> str:
        """Generate comprehensive context about the census datasets."""
        district_df = self.data_bundle.district
        housing_df = self.data_bundle.housing
        colnames_df = self.data_bundle.colnames
        
        context = f"""
# India Census 2011 Dataset Context

## Dataset Overview
You have access to three comprehensive datasets about India Census 2011:

### 1. District-Level Data
- Total Records: {len(district_df):,}
- Total States/UTs: {district_df['State name'].nunique()}
- Total Districts: {district_df['District name'].nunique()}
- Total Population: {district_df['Population'].sum():,}

Key Columns:
{', '.join(district_df.columns.tolist()[:20])}

### 2. Housing & Infrastructure Data (HLPCA)
- Total Records: {len(housing_df):,}
- Covers household-level amenities, assets, and living conditions
- Includes data on: electricity, water supply, sanitation, internet, vehicles, etc.

### 3. Column Names Reference
- Contains {len(colnames_df)} column definitions
- Provides descriptions and metadata for all census variables

## Key Statistics Summary

### Demographics:
- Average Literacy Rate: {district_df['Literate'].sum() / district_df['Population'].sum() * 100:.2f}%
- Average Sex Ratio: {(district_df['Female'].sum() / district_df['Male'].sum() * 1000):.2f} females per 1000 males
- Urban Population: {district_df['Urban_Households'].sum():,}
- Rural Population: {district_df['Rural_Households'].sum():,}

### Workforce:
- Total Workers: {district_df['Total_Workers'].sum():,}
- Male Workers: {district_df['Male_Workers'].sum():,}
- Female Workers: {district_df['Female_Workers'].sum():,}

### Top 5 States by Population:
{self._get_top_states_summary()}

## Data Capabilities
You can answer questions about:
- Population demographics and distribution
- Literacy rates and education
- Gender ratios and workforce participation
- Housing conditions and infrastructure
- Internet and technology penetration
- Sanitation and water supply
- Urban vs rural comparisons
- State and district-level statistics
- Socio-economic indicators
"""
        return context
    
    def _get_top_states_summary(self) -> str:
        """Get summary of top 5 states by population."""
        top_states = self.data_bundle.district.groupby('State name')['Population'].sum().nlargest(5)
        summary = ""
        for i, (state, pop) in enumerate(top_states.items(), 1):
            summary += f"{i}. {state}: {pop:,}\n"
        return summary
    
    def create_system_prompt(self, user_question: str) -> str:
        """Create a dynamic system prompt based on user question."""
        system_prompt = f"""You are an expert data analyst specializing in India Census 2011 data. 
You have access to comprehensive census datasets covering demographics, housing, and infrastructure.

{self.dataset_context}

## Your Role:
- Provide accurate, data-driven answers based on the census datasets
- Use specific numbers and statistics when available
- Explain trends and patterns in the data
- Compare different regions, states, or demographics when relevant
- Provide context and insights beyond just raw numbers
- If you don't have exact data for a question, provide the closest relevant information
- Be concise but informative

## User Question:
{user_question}

## Instructions:
1. Analyze the question carefully
2. Identify relevant data points from the census datasets
3. Provide a clear, well-structured answer
4. Include specific statistics and numbers
5. Add context or insights that would be valuable
6. If the question is unclear, ask for clarification

Answer in a professional yet conversational tone. Format your response clearly with bullet points or sections when appropriate.
"""
        return system_prompt
    
    def get_or_create_session(self, session_id: Optional[str] = None) -> str:
        """Get existing session or create new one."""
        if not session_id:
            session_id = str(uuid.uuid4())
        
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            # Check if session exists
            cursor.execute("SELECT session_id FROM conversations WHERE session_id = %s", (session_id,))
            result = cursor.fetchone()
            
            if not result:
                # Create new session
                cursor.execute(
                    "INSERT INTO conversations (session_id) VALUES (%s)",
                    (session_id,)
                )
                conn.commit()
            
            cursor.close()
            conn.close()
            return session_id
        except Exception as e:
            print(f"Error managing session: {e}")
            return str(uuid.uuid4())
    
    def save_message(self, session_id: str, user_prompt: str, system_prompt: str, ai_response: str):
        """Save conversation message to database."""
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO messages (session_id, user_prompt, system_prompt, ai_response)
                VALUES (%s, %s, %s, %s)
            """, (session_id, user_prompt, system_prompt, ai_response))
            
            # Update conversation timestamp
            cursor.execute("""
                UPDATE conversations 
                SET updated_at = CURRENT_TIMESTAMP 
                WHERE session_id = %s
            """, (session_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error saving message: {e}")
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Retrieve conversation history for a session."""
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT user_prompt, ai_response, created_at
                FROM messages
                WHERE session_id = %s
                ORDER BY created_at ASC
            """, (session_id,))
            
            messages = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [dict(msg) for msg in messages]
        except Exception as e:
            print(f"Error retrieving conversation history: {e}")
            return []
    
    def generate_conversation_summary(self, session_id: str) -> str:
        """Generate summary of entire conversation using Gemini."""
        try:
            # Get all messages from the session
            history = self.get_conversation_history(session_id)
            
            if not history:
                return "No conversation history found for this session."
            
            # Build conversation text
            conversation_text = "Conversation History:\n\n"
            for i, msg in enumerate(history, 1):
                conversation_text += f"Q{i}: {msg['user_prompt']}\n"
                conversation_text += f"A{i}: {msg['ai_response']}\n\n"
            
            # Create summary prompt
            summary_prompt = f"""Please provide a comprehensive summary of the following conversation about India Census 2011 data.

{conversation_text}

Create a summary that includes:
1. Main topics discussed
2. Key statistics and insights mentioned
3. Important findings or patterns identified
4. Overall theme of the conversation

Keep the summary concise but informative (3-5 paragraphs).
"""
            
            # Generate summary using Gemini
            response = self.model.generate_content(summary_prompt)
            summary = response.text
            
            # Save summary to database
            self._save_summary(session_id, summary)
            
            return summary
        except Exception as e:
            print(f"Error generating summary: {e}")
            return f"Error generating summary: {str(e)}"
    
    def _save_summary(self, session_id: str, summary: str):
        """Save conversation summary to database."""
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            # Add summary column if it doesn't exist
            cursor.execute("""
                ALTER TABLE conversations 
                ADD COLUMN IF NOT EXISTS summary TEXT
            """)
            
            cursor.execute("""
                UPDATE conversations 
                SET summary = %s 
                WHERE session_id = %s
            """, (summary, session_id))
            
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error saving summary: {e}")
    
    def chat(self, user_prompt: str, session_id: Optional[str] = None) -> Dict:
        """Process user question and generate response using Gemini."""
        try:
            # Get or create session
            session_id = self.get_or_create_session(session_id)
            
            # Create system prompt
            system_prompt = self.create_system_prompt(user_prompt)
            
            # Generate response using Gemini
            full_prompt = f"{system_prompt}\n\nUser Question: {user_prompt}"
            response = self.model.generate_content(full_prompt)
            ai_response = response.text
            
            # Save to database
            self.save_message(session_id, user_prompt, system_prompt, ai_response)
            
            return {
                'session_id': session_id,
                'user_prompt': user_prompt,
                'ai_response': ai_response,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            error_msg = f"Error processing chat: {str(e)}"
            print(error_msg)
            return {
                'session_id': session_id or 'error',
                'user_prompt': user_prompt,
                'ai_response': f"I apologize, but I encountered an error: {str(e)}",
                'error': error_msg
            }
    
    def get_all_sessions(self) -> List[Dict]:
        """Get all conversation sessions."""
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT c.session_id, c.created_at, c.updated_at, c.summary,
                       COUNT(m.id) as message_count
                FROM conversations c
                LEFT JOIN messages m ON c.session_id = m.session_id
                GROUP BY c.session_id, c.created_at, c.updated_at, c.summary
                ORDER BY c.updated_at DESC
            """)
            
            sessions = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [dict(session) for session in sessions]
        except Exception as e:
            print(f"Error retrieving sessions: {e}")
            return []
