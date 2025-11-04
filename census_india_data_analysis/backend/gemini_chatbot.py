"""Gemini LLM Chatbot for Census 2011 India Dataset Analysis.

Provides intelligent Q&A using Google's Gemini API with context from census datasets.
Integrates with local data analysis and ML models for comprehensive insights.
Stores conversations in Neon PostgreSQL database.
"""
import google.generativeai as genai
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import numpy as np
from datetime import datetime
import uuid
import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional, Any

# Add src directory to path for imports
sys.path.append(str(Path(__file__).parent.parent / 'src'))
from data_analysis import DatasetBundle, load_datasets, compute_district_metrics, compute_state_level_insights
from ml_models import MLModelManager, train_all_models
from system_prompts import create_complete_system_prompt, classify_question_type, get_question_analysis_prompt

class GeminiChatbot:
    """Chatbot using Gemini LLM for census data analysis with local data integration."""
    
    def __init__(self, api_key: str, db_url: str, data_dir: Path = None):
        """Initialize Gemini chatbot with API key, database connection, and local data."""
        self.api_key = api_key
        self.db_url = db_url
        
        # Load local datasets
        if data_dir is None:
            data_dir = Path(__file__).parent.parent
        
        try:
            self.data_bundle = load_datasets(data_dir)
            self.district_enriched = compute_district_metrics(self.data_bundle.district)
            self.state_insights = compute_state_level_insights(self.district_enriched)
            
            # Initialize ML models
            self.ml_manager = MLModelManager()
            self._train_ml_models()
            
            print("✓ Local datasets and ML models loaded successfully")
        except Exception as e:
            print(f"✗ Error loading local data: {e}")
            # Create empty fallback data
            self.data_bundle = None
            self.district_enriched = pd.DataFrame()
            self.state_insights = {}
            self.ml_manager = None
        
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
    
    def _train_ml_models(self):
        """Train ML models on the local data."""
        if self.data_bundle is None or self.district_enriched.empty:
            print("⚠ No data available for ML model training")
            return
        
        try:
            print("🤖 Training enhanced ML models with housing data...")
            self.ml_results, self.ml_manager = train_all_models(self.district_enriched, self.data_bundle.housing)
            print("✓ Enhanced ML models trained successfully with housing integration")
        except Exception as e:
            print(f"✗ Error training ML models: {e}")
            self.ml_results = {}
    
    def _get_dataset_context(self) -> str:
        """Generate comprehensive context about the census datasets and ML insights."""
        if self.data_bundle is None:
            return "No local census data available."
        
        district_df = self.data_bundle.district
        housing_df = self.data_bundle.housing
        
        # Calculate key statistics safely
        total_population = district_df['Population'].sum() if 'Population' in district_df.columns else 0
        total_literate = district_df['Literate'].sum() if 'Literate' in district_df.columns else 0
        literacy_rate = (total_literate / total_population * 100) if total_population > 0 else 0
        
        # Get total households safely
        total_households = housing_df['Total Number of households'].sum() if 'Total Number of households' in housing_df.columns else district_df['Households'].sum() if 'Households' in district_df.columns else 0
        
        # Get total workers safely
        total_workers = district_df['Workers'].sum() if 'Workers' in district_df.columns else 0
        
        # Get state-level insights
        top_states_pop = list(self.state_insights.get('population', pd.Series()).head(5).index) if self.state_insights else []
        top_states_literacy = list(self.state_insights.get('literacy_rate', pd.Series()).head(5).index) if self.state_insights else []
        
        # Get ML model performance
        ml_summary = ""
        if hasattr(self, 'ml_results') and self.ml_results:
            ml_summary = f"""
MACHINE LEARNING MODELS AVAILABLE:
- Literacy Rate Predictor: R² = {self.ml_results.get('literacy_prediction', {}).get('r2_score', 0):.3f}
- Internet Penetration Predictor: R² = {self.ml_results.get('internet_prediction', {}).get('r2_score', 0):.3f}
- Sanitation Risk Classifier: Accuracy = {self.ml_results.get('sanitation_classification', {}).get('accuracy', 0):.3f}
- District Clustering: {self.ml_results.get('district_clustering', {}).get('n_clusters', 0)} clusters identified
- Anomaly Detection: {self.ml_results.get('anomaly_detection', {}).get('anomalies_detected', 0)} anomalous districts found
"""
        
        context = f"""
CENSUS 2011 INDIA DATASET CONTEXT (LOCAL DATA):

Dataset Overview:
- Total Districts: {district_df['District code'].nunique() if 'District code' in district_df.columns else len(district_df)}
- Total States/UTs: {district_df['State name'].nunique() if 'State name' in district_df.columns else 'N/A'}
- Total Population: {total_population:,}
- Average Literacy Rate: {literacy_rate:.2f}%
- Total Households: {total_households:,}
- Total Workers: {total_workers:,}

TOP PERFORMING STATES:
- Population Leaders: {', '.join(top_states_pop)}
- Literacy Leaders: {', '.join(top_states_literacy)}

AVAILABLE DATA CATEGORIES:
1. DISTRICT DATA ({district_df.shape[0]} records, {district_df.shape[1]} columns):
   - Population statistics (Total, Male, Female)
   - Literacy rates and education data (Literate, Male_Literate, Female_Literate)
   - Demographics (SC, ST populations, Age groups)
   - Employment (Workers, Main_Workers, Marginal_Workers, Cultivator_Workers)
   - Household amenities (LPG, Electricity, Internet, Computer, TV, Telephone)
   - Infrastructure (Rural/Urban households, Sanitation, Water access)
   - Key columns: Population, Male, Female, Literate, Workers, Households, Internet, Computer, TV

2. HOUSING DATA ({housing_df.shape[0]} records, {housing_df.shape[1]} columns):
   - Household structure (Total, Good, Livable, Dilapidated conditions)
   - Construction materials (Roof, Wall, Floor materials)
   - Amenities (Kitchen, Bathroom, Latrine facilities)
   - Utilities (Electricity, Water source, Cooking fuel)
   - Assets (Television, Telephone, Computer, Internet, Vehicles)
   - Key columns: Total Number of households, Material_Roof_*, Material_Wall_*, Cooking_*, assets_*

DERIVED METRICS AVAILABLE:
- Sex Ratio (Female per 1000 Male)
- Literacy Rate (%)
- Worker Participation Rate (%)
- Urbanisation Rate (%)
- Internet Penetration (%)
- Mobile Phone Access (%)
- Sanitation Gap (% without latrine facilities)

{ml_summary}

DATA QUALITY & COVERAGE:
- Complete demographic coverage for all Indian districts
- Housing data includes rural/urban breakdown
- All data sourced from Census 2011 India official records
- No missing critical demographic indicators
- Comprehensive infrastructure and amenity data available

IMPORTANT: All responses must be based ONLY on this Census 2011 India dataset. Do not provide information from external sources or general knowledge about India that is not contained in this specific dataset.
"""
        return context
    
    def _analyze_user_question(self, user_question: str) -> Dict[str, Any]:
        """Analyze user question and extract relevant data insights."""
        question_lower = user_question.lower()
        
        # Initialize analysis results
        analysis = {
            'relevant_data': {},
            'ml_predictions': {},
            'specific_insights': []
        }
        
        if self.data_bundle is None:
            return analysis
        
        try:
            # Check for specific data requests
            if any(word in question_lower for word in ['population', 'total people', 'inhabitants']):
                analysis['relevant_data']['total_population'] = int(self.data_bundle.district['Population'].sum())
                analysis['relevant_data']['top_states_population'] = self.state_insights.get('population', pd.Series()).head(5).to_dict()
            
            if any(word in question_lower for word in ['literacy', 'education', 'literate']):
                total_pop = self.data_bundle.district['Population'].sum()
                total_literate = self.data_bundle.district['Literate'].sum()
                analysis['relevant_data']['literacy_rate'] = float(total_literate / total_pop * 100)
                analysis['relevant_data']['top_states_literacy'] = self.state_insights.get('literacy_rate', pd.Series()).head(5).to_dict()
            
            if any(word in question_lower for word in ['internet', 'connectivity', 'digital']):
                analysis['relevant_data']['internet_stats'] = self.state_insights.get('internet_penetration', pd.Series()).head(5).to_dict()
            
            if any(word in question_lower for word in ['sanitation', 'toilet', 'latrine']):
                analysis['relevant_data']['sanitation_stats'] = self.state_insights.get('sanitation_gap', pd.Series()).head(5).to_dict()
            
            # Check for specific states or districts
            for state in self.data_bundle.district['State name'].unique():
                if state.lower() in question_lower:
                    state_data = self.data_bundle.district[self.data_bundle.district['State name'] == state]
                    analysis['relevant_data'][f'{state}_stats'] = {
                        'population': int(state_data['Population'].sum()),
                        'literacy_rate': float(state_data['Literate'].sum() / state_data['Population'].sum() * 100),
                        'districts': int(len(state_data))
                    }
                    break
            
            # ML predictions if available
            if self.ml_manager and hasattr(self, 'ml_results'):
                if 'predict' in question_lower or 'forecast' in question_lower:
                    analysis['ml_predictions']['available_models'] = list(self.ml_results.keys())
                
                if 'cluster' in question_lower or 'group' in question_lower:
                    if 'district_clustering' in self.ml_results:
                        analysis['ml_predictions']['clustering'] = self.ml_results['district_clustering']
                
                if 'anomal' in question_lower or 'unusual' in question_lower:
                    if 'anomaly_detection' in self.ml_results:
                        analysis['ml_predictions']['anomalies'] = self.ml_results['anomaly_detection']
        
        except Exception as e:
            print(f"Error in question analysis: {e}")
        
        return analysis
    
    def _create_system_prompt(self, user_question: str) -> str:
        """Create a comprehensive system prompt based on user question and dataset context."""
        dataset_context = self._get_dataset_context()
        question_analysis = self._analyze_user_question(user_question)
        
        # Classify question type for targeted analysis
        question_type = classify_question_type(user_question)
        question_specific_prompt = get_question_analysis_prompt(question_type)
        
        # Add specific data insights to context
        specific_insights = ""
        if question_analysis['relevant_data']:
            specific_insights += "\nSPECIFIC DATA INSIGHTS FOR THIS QUESTION:\n"
            for key, value in question_analysis['relevant_data'].items():
                if isinstance(value, dict):
                    specific_insights += f"- {key}: {json.dumps(value, indent=2)}\n"
                else:
                    specific_insights += f"- {key}: {value}\n"
        
        if question_analysis['ml_predictions']:
            specific_insights += "\nML MODEL INSIGHTS AVAILABLE:\n"
            for key, value in question_analysis['ml_predictions'].items():
                specific_insights += f"- {key}: Available for analysis\n"
        
        # Check if ML models are available
        ml_available = hasattr(self, 'ml_results') and self.ml_results is not None
        
        # Create comprehensive system prompt
        system_prompt = create_complete_system_prompt(
            dataset_context=dataset_context,
            question_analysis=question_specific_prompt,
            specific_insights=specific_insights,
            ml_available=ml_available
        )
        
        # Add user question context
        system_prompt += f"\n\nUSER QUESTION: {user_question}\n\nProvide a comprehensive, accurate answer based exclusively on the Census 2011 India dataset context provided above."
        
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
    
    def get_data_summary(self) -> Dict[str, Any]:
        """Get comprehensive summary of loaded data and ML models."""
        if self.data_bundle is None:
            return {'error': 'No data loaded'}
        
        summary = {
            'dataset_info': {
                'total_districts': len(self.data_bundle.district),
                'total_states': self.data_bundle.district['State name'].nunique(),
                'total_population': int(self.data_bundle.district['Population'].sum()),
                'total_households': int(self.data_bundle.district['Households'].sum()),
                'data_columns': {
                    'district_data': list(self.data_bundle.district.columns),
                    'housing_data': list(self.data_bundle.housing.columns)
                }
            },
            'key_statistics': {
                'literacy_rate': float(self.data_bundle.district['Literate'].sum() / self.data_bundle.district['Population'].sum() * 100),
                'worker_participation': float(self.data_bundle.district['Workers'].sum() / self.data_bundle.district['Population'].sum() * 100),
                'internet_households': int(self.data_bundle.district['Households_with_Internet'].sum()),
                'computer_households': int(self.data_bundle.district['Households_with_Computer'].sum())
            },
            'ml_models': {}
        }
        
        if hasattr(self, 'ml_results') and self.ml_results:
            summary['ml_models'] = {
                model_name: {
                    'type': result.get('model_name', 'Unknown'),
                    'performance': {
                        k: v for k, v in result.items() 
                        if k in ['r2_score', 'accuracy', 'silhouette_score', 'rmse']
                    }
                }
                for model_name, result in self.ml_results.items()
            }
        
        return summary
    
    def query_specific_data(self, query_type: str, **kwargs) -> Dict[str, Any]:
        """Query specific data based on type and parameters."""
        if self.data_bundle is None:
            return {'error': 'No data loaded'}
        
        try:
            if query_type == 'state_stats':
                state_name = kwargs.get('state_name')
                if not state_name:
                    return {'error': 'State name required'}
                
                state_data = self.data_bundle.district[
                    self.data_bundle.district['State name'].str.contains(state_name, case=False, na=False)
                ]
                
                if state_data.empty:
                    return {'error': f'State "{state_name}" not found'}
                
                return {
                    'state_name': state_data['State name'].iloc[0],
                    'total_districts': len(state_data),
                    'total_population': int(state_data['Population'].sum()),
                    'literacy_rate': float(state_data['Literate'].sum() / state_data['Population'].sum() * 100),
                    'worker_participation': float(state_data['Workers'].sum() / state_data['Population'].sum() * 100),
                    'internet_penetration': float(state_data['Households_with_Internet'].sum() / state_data['Households'].sum() * 100),
                    'districts': state_data['District name'].tolist()
                }
            
            elif query_type == 'district_stats':
                district_name = kwargs.get('district_name')
                if not district_name:
                    return {'error': 'District name required'}
                
                district_data = self.data_bundle.district[
                    self.data_bundle.district['District name'].str.contains(district_name, case=False, na=False)
                ]
                
                if district_data.empty:
                    return {'error': f'District "{district_name}" not found'}
                
                district = district_data.iloc[0]
                return {
                    'district_name': district['District name'],
                    'state_name': district['State name'],
                    'population': int(district['Population']),
                    'male_population': int(district['Male']),
                    'female_population': int(district['Female']),
                    'literacy_rate': float(district['Literate'] / district['Population'] * 100),
                    'worker_participation': float(district['Workers'] / district['Population'] * 100),
                    'households': int(district['Households']),
                    'internet_households': int(district['Households_with_Internet']),
                    'computer_households': int(district['Households_with_Computer'])
                }
            
            elif query_type == 'top_states':
                metric = kwargs.get('metric', 'population')
                limit = kwargs.get('limit', 10)
                
                if metric == 'population':
                    top_states = self.state_insights.get('population', pd.Series()).head(limit)
                elif metric == 'literacy':
                    top_states = self.state_insights.get('literacy_rate', pd.Series()).head(limit)
                elif metric == 'internet':
                    top_states = self.state_insights.get('internet_penetration', pd.Series()).head(limit)
                else:
                    return {'error': f'Metric "{metric}" not supported'}
                
                return {
                    'metric': metric,
                    'top_states': top_states.to_dict()
                }
            
            elif query_type == 'ml_prediction':
                if not self.ml_manager:
                    return {'error': 'ML models not available'}
                
                model_type = kwargs.get('model_type')
                features = kwargs.get('features', {})
                
                if model_type == 'literacy':
                    try:
                        prediction = self.ml_manager.predict_literacy(features)
                        return {'prediction': float(prediction), 'model': 'Literacy Rate Predictor'}
                    except Exception as e:
                        return {'error': f'Prediction failed: {str(e)}'}
                
                elif model_type == 'cluster':
                    try:
                        cluster = self.ml_manager.get_district_cluster(features)
                        cluster_info = None
                        if hasattr(self, 'ml_results') and 'district_clustering' in self.ml_results:
                            profiles = self.ml_results['district_clustering'].get('cluster_profiles', [])
                            cluster_info = next((p for p in profiles if p['cluster_id'] == cluster), None)
                        
                        return {
                            'cluster_id': int(cluster),
                            'cluster_info': cluster_info,
                            'model': 'District Clustering'
                        }
                    except Exception as e:
                        return {'error': f'Clustering failed: {str(e)}'}
                
                else:
                    return {'error': f'Model type "{model_type}" not supported'}
            
            else:
                return {'error': f'Query type "{query_type}" not supported'}
        
        except Exception as e:
            return {'error': f'Query failed: {str(e)}'}
    
    def get_ml_model_info(self) -> Dict[str, Any]:
        """Get information about available ML models."""
        if not hasattr(self, 'ml_results') or not self.ml_results:
            return {'error': 'No ML models available'}
        
        model_info = {}
        for model_name, results in self.ml_results.items():
            model_info[model_name] = {
                'name': results.get('model_name', model_name),
                'performance': {},
                'description': ''
            }
            
            # Add performance metrics
            if 'r2_score' in results:
                model_info[model_name]['performance']['R² Score'] = results['r2_score']
            if 'accuracy' in results:
                model_info[model_name]['performance']['Accuracy'] = results['accuracy']
            if 'silhouette_score' in results:
                model_info[model_name]['performance']['Silhouette Score'] = results['silhouette_score']
            
            # Add descriptions
            if model_name == 'literacy_prediction':
                model_info[model_name]['description'] = 'Predicts literacy rates based on demographic and infrastructure features'
            elif model_name == 'internet_prediction':
                model_info[model_name]['description'] = 'Predicts internet penetration based on socioeconomic indicators'
            elif model_name == 'sanitation_classification':
                model_info[model_name]['description'] = 'Classifies districts into sanitation risk categories (Low/Medium/High)'
            elif model_name == 'district_clustering':
                model_info[model_name]['description'] = 'Groups districts into clusters based on development indicators'
            elif model_name == 'anomaly_detection':
                model_info[model_name]['description'] = 'Identifies districts with unusual demographic patterns'
        
        return model_info
