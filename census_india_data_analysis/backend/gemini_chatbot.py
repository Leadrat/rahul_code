"""Gemini LLM Chatbot for Census 2011 India Dataset Analysis.

Provides intelligent Q&A using Google's Gemini API with context from census datasets.
Stores conversations in Neon PostgreSQL database.
"""
import google.generativeai as genai
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from datetime import datetime
import uuid
import json
from typing import Dict, List, Optional

class GeminiChatbot:
    """Chatbot using Gemini LLM for census data analysis."""
    
    def __init__(self, api_key: str, db_url: str, data_bundle):
        """Initialize Gemini chatbot with API key and database connection."""
        self.api_key = api_key
        self.db_url = db_url
        self.data_bundle = data_bundle
        
        # Configure Gemini (using available model)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Initialize database
        self._init_database()
    
    def _init_database(self):
        """Create necessary database tables if they don't exist."""
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor()
            
            # Create sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    session_id VARCHAR(255) PRIMARY KEY,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create conversations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(255) REFERENCES chat_sessions(session_id),
                    user_prompt TEXT NOT NULL,
                    system_prompt TEXT NOT NULL,
                    ai_response TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create summaries table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS conversation_summaries (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR(255) REFERENCES chat_sessions(session_id),
                    summary TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            cursor.close()
            conn.close()
            print("✓ Database tables initialized successfully")
        except Exception as e:
            print(f"✗ Error initializing database: {e}")
            raise
    
    def create_session(self) -> str:
        """Create a new chat session and return session ID."""
        session_id = str(uuid.uuid4())
        
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor()
            
            cursor.execute(
                "INSERT INTO chat_sessions (session_id) VALUES (%s)",
                (session_id,)
            )
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return session_id
        except Exception as e:
            print(f"Error creating session: {e}")
            raise
    
    def _get_dataset_context(self) -> str:
        """Generate context about the census datasets."""
        district_df = self.data_bundle.district
        housing_df = self.data_bundle.housing
        
        # Calculate key statistics safely
        total_population = district_df['Population'].sum() if 'Population' in district_df.columns else 0
        total_literate = district_df['Literate'].sum() if 'Literate' in district_df.columns else 0
        literacy_rate = (total_literate / total_population * 100) if total_population > 0 else 0
        
        # Get total households safely
        total_households = housing_df['Households'].sum() if 'Households' in housing_df.columns else district_df['Households'].sum() if 'Households' in district_df.columns else 0
        
        # Get total workers safely
        total_workers = district_df['Workers'].sum() if 'Workers' in district_df.columns else 0
        
        context = f"""
CENSUS 2011 INDIA DATASET CONTEXT:

Dataset Overview:
- Total Districts: {district_df['District code'].nunique() if 'District code' in district_df.columns else len(district_df)}
- Total States/UTs: {district_df['State name'].nunique() if 'State name' in district_df.columns else 'N/A'}
- Total Population: {total_population:,}

Available Data Categories:
1. DISTRICT DATA ({district_df.shape[0]} records, {district_df.shape[1]} columns):
   - Population statistics (Total, Male, Female)
   - Literacy rates and education data
   - Sex ratio and demographics
   - Worker statistics and employment
   - Household information
   - Key columns: {', '.join(district_df.columns.tolist()[:15])}{'...' if len(district_df.columns) > 15 else ''}

2. HOUSING DATA ({housing_df.shape[0]} records, {housing_df.shape[1]} columns):
   - Household counts (Total, Rural, Urban)
   - Asset ownership (Internet, TV, Computer, Telephone)
   - Infrastructure and amenities access
   - Housing materials and conditions
   - Key columns: {', '.join(housing_df.columns.tolist()[:15])}{'...' if len(housing_df.columns) > 15 else ''}

Key Statistics:
- Average Literacy Rate: {literacy_rate:.2f}%
- Total Households: {total_households:,}
- Total Workers: {total_workers:,}

States Covered: {', '.join(sorted(district_df['State name'].unique()[:10])) if 'State name' in district_df.columns else 'Multiple states'}{'... and more' if 'State name' in district_df.columns and district_df['State name'].nunique() > 10 else ''}

Data Quality:
- District data: Complete demographic and socioeconomic indicators
- Housing data: Detailed infrastructure and asset information
- All data from Census 2011 India official sources
"""
        return context
    
    def _create_system_prompt(self, user_question: str) -> str:
        """Create a dynamic system prompt based on user question and dataset context."""
        dataset_context = self._get_dataset_context()
        
        system_prompt = f"""You are an expert data analyst specializing in Indian Census 2011 data. Your role is to provide accurate, insightful, and helpful answers about demographic, housing, and socioeconomic data from the Census 2011 India dataset.

{dataset_context}

INSTRUCTIONS:
1. Answer questions accurately based on the dataset context provided above
2. If specific calculations are needed, explain the methodology
3. Provide insights and context to make the data meaningful
4. If the question is outside the scope of the census data, politely redirect to relevant topics
5. Use clear, professional language
6. Include relevant statistics and comparisons when helpful
7. Format responses in a readable way with bullet points or numbered lists when appropriate

USER QUESTION: {user_question}

Provide a comprehensive, accurate answer based on the census data context."""
        
        return system_prompt
    
    def chat(self, session_id: str, user_prompt: str) -> Dict:
        """Process user prompt and generate response using Gemini."""
        try:
            # Create system prompt
            system_prompt = self._create_system_prompt(user_prompt)
            
            # Generate response using Gemini
            response = self.model.generate_content(system_prompt)
            ai_response = response.text
            
            # Save to database
            self._save_conversation(session_id, user_prompt, system_prompt, ai_response)
            
            # Update session activity
            self._update_session_activity(session_id)
            
            return {
                'success': True,
                'response': ai_response,
                'session_id': session_id
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'session_id': session_id
            }
    
    def chat_stream(self, session_id: str, user_prompt: str):
        """Process user prompt and generate streaming response using Gemini."""
        try:
            # Create system prompt
            system_prompt = self._create_system_prompt(user_prompt)
            
            # Generate streaming response using Gemini
            response = self.model.generate_content(system_prompt, stream=True)
            
            full_response = ""
            for chunk in response:
                if chunk.text:
                    full_response += chunk.text
                    yield {
                        'success': True,
                        'chunk': chunk.text,
                        'session_id': session_id,
                        'done': False
                    }
            
            # Save complete conversation to database
            self._save_conversation(session_id, user_prompt, system_prompt, full_response)
            
            # Update session activity
            self._update_session_activity(session_id)
            
            # Send final chunk to indicate completion
            yield {
                'success': True,
                'chunk': '',
                'session_id': session_id,
                'done': True,
                'full_response': full_response
            }
            
        except Exception as e:
            yield {
                'success': False,
                'error': str(e),
                'session_id': session_id,
                'done': True
            }
    
    def _save_conversation(self, session_id: str, user_prompt: str, 
                          system_prompt: str, ai_response: str):
        """Save conversation to database."""
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO conversations 
                   (session_id, user_prompt, system_prompt, ai_response) 
                   VALUES (%s, %s, %s, %s)""",
                (session_id, user_prompt, system_prompt, ai_response)
            )
            
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error saving conversation: {e}")
            raise
    
    def _update_session_activity(self, session_id: str):
        """Update last activity timestamp for session."""
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor()
            
            cursor.execute(
                "UPDATE chat_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = %s",
                (session_id,)
            )
            
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error updating session: {e}")
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Retrieve conversation history for a session."""
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute(
                """SELECT user_prompt, ai_response, created_at 
                   FROM conversations 
                   WHERE session_id = %s 
                   ORDER BY created_at ASC""",
                (session_id,)
            )
            
            history = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [dict(row) for row in history]
        except Exception as e:
            print(f"Error retrieving history: {e}")
            return []
    
    def generate_conversation_summary(self, session_id: str) -> Dict:
        """Generate a summary of the entire conversation using Gemini."""
        try:
            # Get conversation history
            history = self.get_conversation_history(session_id)
            
            if not history:
                return {
                    'success': False,
                    'error': 'No conversation history found for this session'
                }
            
            # Prepare conversation text
            conversation_text = "CONVERSATION HISTORY:\n\n"
            for i, entry in enumerate(history, 1):
                conversation_text += f"Q{i}: {entry['user_prompt']}\n"
                conversation_text += f"A{i}: {entry['ai_response']}\n\n"
            
            # Create summary prompt
            summary_prompt = f"""Analyze the following conversation about Census 2011 India data and provide a comprehensive summary.

{conversation_text}

Please provide:
1. Main topics discussed
2. Key statistics and insights mentioned
3. Important questions asked by the user
4. Overall theme of the conversation

Format the summary in a clear, structured way."""
            
            # Generate summary using Gemini
            response = self.model.generate_content(summary_prompt)
            summary = response.text
            
            # Save summary to database
            self._save_summary(session_id, summary)
            
            return {
                'success': True,
                'summary': summary,
                'session_id': session_id,
                'total_messages': len(history)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _save_summary(self, session_id: str, summary: str):
        """Save conversation summary to database."""
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor()
            
            cursor.execute(
                """INSERT INTO conversation_summaries (session_id, summary) 
                   VALUES (%s, %s)""",
                (session_id, summary)
            )
            
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error saving summary: {e}")
    
    def get_session_summary(self, session_id: str) -> Optional[Dict]:
        """Retrieve the most recent summary for a session."""
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute(
                """SELECT summary, created_at 
                   FROM conversation_summaries 
                   WHERE session_id = %s 
                   ORDER BY created_at DESC 
                   LIMIT 1""",
                (session_id,)
            )
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            return dict(result) if result else None
        except Exception as e:
            print(f"Error retrieving summary: {e}")
            return None
    
    def get_all_sessions(self) -> List[Dict]:
        """Retrieve all chat sessions with basic info."""
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute(
                """SELECT 
                    cs.session_id,
                    cs.created_at,
                    cs.last_activity,
                    COUNT(c.id) as message_count,
                    MIN(c.user_prompt) as first_message
                   FROM chat_sessions cs
                   LEFT JOIN conversations c ON cs.session_id = c.session_id
                   GROUP BY cs.session_id, cs.created_at, cs.last_activity
                   ORDER BY cs.last_activity DESC
                   LIMIT 50"""
            )
            
            sessions = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return [dict(session) for session in sessions]
        except Exception as e:
            print(f"Error retrieving sessions: {e}")
            return []
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session and all its conversations."""
        try:
            conn = psycopg2.connect(self.db_url)
            cursor = conn.cursor()
            
            # Delete in order due to foreign key constraints
            cursor.execute("DELETE FROM conversation_summaries WHERE session_id = %s", (session_id,))
            cursor.execute("DELETE FROM conversations WHERE session_id = %s", (session_id,))
            cursor.execute("DELETE FROM chat_sessions WHERE session_id = %s", (session_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return True
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False
