"""Flask backend for ML Data Analysis application.

Provides REST API endpoints for:
- Data analysis reports
- Interactive Q&A using spaCy NLP
- Chart data generation
"""
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
from pathlib import Path
import sys
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime

# Add parent directory to path to import data_analysis module
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.data_analysis import load_datasets, compute_district_metrics
from src.ml_models import MLModelManager, train_all_models
from backend.gemini_chatbot import GeminiChatbot

app = Flask(__name__)
CORS(app)

# Configuration
GEMINI_API_KEY = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
NEON_DB_URL = "postgresql://neondb_owner:npg_QaDL2XEYuId8@ep-jolly-sound-a42vi9ji-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Global data storage
data_bundle = None
district_metrics = None
ml_manager = None
ml_results = None
gemini_chatbot = None

def initialize_data():
    """Load datasets on startup."""
    global data_bundle, district_metrics, ml_manager, ml_results, gemini_chatbot
    try:
        data_dir = Path(__file__).parent.parent
        data_bundle = load_datasets(data_dir)
        district_metrics = compute_district_metrics(data_bundle.district)
        print("✓ Data loaded successfully")
        
        # Train ML models
        print("⏳ Training ML models...")
        ml_results, ml_manager = train_all_models(district_metrics)
        print("✓ ML models trained successfully")
        
        # Initialize Gemini Chatbot
        print("⏳ Initializing Gemini Chatbot...")
        gemini_chatbot = GeminiChatbot(GEMINI_API_KEY, NEON_DB_URL, data_bundle)
        print("✓ Gemini Chatbot initialized successfully")
    except Exception as e:
        print(f"✗ Error loading data: {e}")
        raise

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/overview', methods=['GET'])
def get_overview():
    """Get overview statistics of the datasets."""
    try:
        district_df = data_bundle.district
        housing_df = data_bundle.housing
        
        overview = {
            'district_data': {
                'total_rows': int(district_df.shape[0]),
                'total_columns': int(district_df.shape[1]),
                'total_population': int(district_df['Population'].sum()),
                'total_states': int(district_df['State name'].nunique()),
                'total_districts': int(district_df['District name'].nunique())
            },
            'housing_data': {
                'total_rows': int(housing_df.shape[0]),
                'total_columns': int(housing_df.shape[1])
            },
            'key_metrics': {
                'avg_literacy_rate': float(district_metrics['Literacy_Rate'].mean()),
                'avg_sex_ratio': float(district_metrics['Sex_Ratio'].mean()),
                'avg_urbanisation': float(district_metrics['Urbanisation_Rate'].mean())
            }
        }
        
        return jsonify(overview)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/demographics', methods=['GET'])
def get_demographics():
    """Get demographic analysis data."""
    try:
        # Top 10 states by population
        top_states = district_metrics.groupby('State name')['Population'].sum().nlargest(10)
        
        # Sex ratio by state
        sex_ratio_by_state = district_metrics.groupby('State name')['Sex_Ratio'].mean().sort_values(ascending=False).head(15)
        
        # Literacy rate distribution
        literacy_bins = pd.cut(district_metrics['Literacy_Rate'], bins=[0, 50, 70, 85, 100])
        literacy_dist = literacy_bins.value_counts().sort_index()
        
        demographics = {
            'top_states_population': {
                'labels': top_states.index.tolist(),
                'values': top_states.values.tolist()
            },
            'sex_ratio_by_state': {
                'labels': sex_ratio_by_state.index.tolist(),
                'values': sex_ratio_by_state.values.tolist()
            },
            'literacy_distribution': {
                'labels': [str(x) for x in literacy_dist.index],
                'values': literacy_dist.values.tolist()
            }
        }
        
        return jsonify(demographics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/housing', methods=['GET'])
def get_housing():
    """Get housing and infrastructure analysis data."""
    try:
        # Asset access rates
        asset_columns = [
            'Households_with_Internet',
            'Households_with_Telephone_Mobile_Phone',
            'Households_with_Television',
            'Households_with_Computer_Laptop'
        ]
        
        asset_data = {}
        for col in asset_columns:
            if col in district_metrics.columns:
                rate = (district_metrics[col].sum() / district_metrics['Households'].sum()) * 100
                asset_data[col.replace('Households_with_', '')] = float(rate)
        
        # Sanitation facilities
        sanitation_avg = float(100 - district_metrics['Sanitation_Gap'].mean())
        
        # Urbanisation by state
        urban_by_state = district_metrics.groupby('State name')['Urbanisation_Rate'].mean().sort_values(ascending=False).head(10)
        
        housing = {
            'asset_access': asset_data,
            'sanitation_coverage': sanitation_avg,
            'urbanisation_by_state': {
                'labels': urban_by_state.index.tolist(),
                'values': urban_by_state.values.tolist()
            }
        }
        
        return jsonify(housing)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/workforce', methods=['GET'])
def get_workforce():
    """Get workforce and economic analysis data."""
    try:
        # Worker participation by state
        worker_by_state = district_metrics.groupby('State name')['Worker_Participation_Rate'].mean().sort_values(ascending=False).head(15)
        
        # Literacy vs workforce correlation
        literacy_workforce_corr = float(district_metrics[['Literacy_Rate', 'Worker_Participation_Rate']].corr().iloc[0, 1])
        
        # Male vs Female workers
        total_male_workers = int(district_metrics['Male_Workers'].sum())
        total_female_workers = int(district_metrics['Female_Workers'].sum())
        
        workforce = {
            'worker_participation_by_state': {
                'labels': worker_by_state.index.tolist(),
                'values': worker_by_state.values.tolist()
            },
            'literacy_workforce_correlation': literacy_workforce_corr,
            'gender_distribution': {
                'male_workers': total_male_workers,
                'female_workers': total_female_workers
            }
        }
        
        return jsonify(workforce)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/charts/plotly/<chart_type>', methods=['GET'])
def get_plotly_chart(chart_type):
    """Generate Plotly charts for interactive visualization."""
    try:
        if chart_type == 'population_map':
            # Top states population
            top_states = district_metrics.groupby('State name')['Population'].sum().nlargest(15).reset_index()
            fig = px.bar(top_states, x='State name', y='Population', 
                        title='Top 15 States by Population',
                        labels={'Population': 'Total Population', 'State name': 'State'})
            fig.update_layout(xaxis_tickangle=-45)
            
        elif chart_type == 'literacy_scatter':
            # Literacy vs Worker Participation
            sample_data = district_metrics.sample(min(200, len(district_metrics)))
            fig = px.scatter(sample_data, x='Literacy_Rate', y='Worker_Participation_Rate',
                           color='Urbanisation_Rate', size='Population',
                           hover_data=['District name', 'State name'],
                           title='Literacy Rate vs Worker Participation',
                           labels={'Literacy_Rate': 'Literacy Rate (%)', 
                                  'Worker_Participation_Rate': 'Worker Participation Rate (%)',
                                  'Urbanisation_Rate': 'Urbanisation Rate (%)'})
            
        elif chart_type == 'sex_ratio_box':
            # Sex ratio distribution by region
            top_states = district_metrics.groupby('State name')['Population'].sum().nlargest(10).index
            filtered_data = district_metrics[district_metrics['State name'].isin(top_states)]
            fig = px.box(filtered_data, x='State name', y='Sex_Ratio',
                        title='Sex Ratio Distribution by Top 10 States',
                        labels={'Sex_Ratio': 'Sex Ratio (Females per 1000 Males)', 'State name': 'State'})
            fig.update_layout(xaxis_tickangle=-45)
            
        elif chart_type == 'urbanisation_pie':
            # Urban vs Rural households
            urban = district_metrics['Urban_Households'].sum()
            rural = district_metrics['Rural_Households'].sum()
            fig = go.Figure(data=[go.Pie(labels=['Urban', 'Rural'], 
                                        values=[urban, rural],
                                        hole=0.3)])
            fig.update_layout(title='Urban vs Rural Households Distribution')
            
        else:
            return jsonify({'error': 'Invalid chart type'}), 400
        
        return jsonify(json.loads(fig.to_json()))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/qa', methods=['POST'])
def question_answer():
    """Answer questions about the dataset using NLP."""
    try:
        data = request.get_json()
        question = data.get('question', '').lower().strip()
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Simple keyword-based Q&A system (can be enhanced with spaCy NER and dependency parsing)
        response = process_question(question)
        
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_question(question):
    """Process natural language questions about the dataset."""
    
    # Keywords for different types of queries
    population_keywords = ['population', 'people', 'inhabitants', 'residents']
    literacy_keywords = ['literacy', 'literate', 'education', 'educated']
    state_keywords = ['state', 'states', 'top states', 'which state']
    worker_keywords = ['worker', 'workers', 'employment', 'workforce', 'working']
    housing_keywords = ['housing', 'house', 'homes', 'households']
    internet_keywords = ['internet', 'connectivity', 'online']
    urban_keywords = ['urban', 'city', 'cities', 'urbanisation', 'urbanization']
    
    response = {
        'answer': '',
        'type': 'text',  # 'text', 'table', or 'chart'
        'data': None
    }
    
    # Total population queries
    if any(kw in question for kw in population_keywords) and 'total' in question:
        total_pop = district_metrics['Population'].sum()
        response['answer'] = f"The total population across all districts is {total_pop:,}."
        response['type'] = 'text'
    
    # Top states by population
    elif any(kw in question for kw in population_keywords) and any(kw in question for kw in state_keywords):
        top_states = district_metrics.groupby('State name')['Population'].sum().nlargest(10)
        response['answer'] = "Here are the top 10 states by population:"
        response['type'] = 'table'
        response['data'] = {
            'headers': ['State', 'Population'],
            'rows': [[state, f"{pop:,}"] for state, pop in top_states.items()]
        }
    
    # Literacy rate queries
    elif any(kw in question for kw in literacy_keywords):
        if 'highest' in question or 'top' in question:
            top_literacy = district_metrics.nlargest(10, 'Literacy_Rate')[['District name', 'State name', 'Literacy_Rate']]
            response['answer'] = "Districts with highest literacy rates:"
            response['type'] = 'table'
            response['data'] = {
                'headers': ['District', 'State', 'Literacy Rate (%)'],
                'rows': [[row['District name'], row['State name'], f"{row['Literacy_Rate']:.2f}"] 
                        for _, row in top_literacy.iterrows()]
            }
        elif 'average' in question or 'mean' in question:
            avg_literacy = district_metrics['Literacy_Rate'].mean()
            response['answer'] = f"The average literacy rate across all districts is {avg_literacy:.2f}%."
            response['type'] = 'text'
        else:
            avg_literacy = district_metrics['Literacy_Rate'].mean()
            response['answer'] = f"The average literacy rate is {avg_literacy:.2f}%. The literacy rate ranges from {district_metrics['Literacy_Rate'].min():.2f}% to {district_metrics['Literacy_Rate'].max():.2f}%."
            response['type'] = 'text'
    
    # Worker/employment queries
    elif any(kw in question for kw in worker_keywords):
        if 'male' in question and 'female' in question:
            male_workers = district_metrics['Male_Workers'].sum()
            female_workers = district_metrics['Female_Workers'].sum()
            response['answer'] = f"Total male workers: {male_workers:,}\nTotal female workers: {female_workers:,}\nGender ratio: {(female_workers/male_workers)*100:.2f}% (female to male)"
            response['type'] = 'text'
        else:
            avg_participation = district_metrics['Worker_Participation_Rate'].mean()
            response['answer'] = f"The average worker participation rate is {avg_participation:.2f}%."
            response['type'] = 'text'
    
    # Internet connectivity queries
    elif any(kw in question for kw in internet_keywords):
        internet_households = district_metrics['Households_with_Internet'].sum()
        total_households = district_metrics['Households'].sum()
        internet_rate = (internet_households / total_households) * 100
        response['answer'] = f"Internet penetration: {internet_rate:.2f}% of households have internet access ({internet_households:,} out of {total_households:,} households)."
        response['type'] = 'text'
    
    # Urbanisation queries
    elif any(kw in question for kw in urban_keywords):
        if 'state' in question:
            urban_by_state = district_metrics.groupby('State name')['Urbanisation_Rate'].mean().sort_values(ascending=False).head(10)
            response['answer'] = "Top 10 states by urbanisation rate:"
            response['type'] = 'table'
            response['data'] = {
                'headers': ['State', 'Urbanisation Rate (%)'],
                'rows': [[state, f"{rate:.2f}"] for state, rate in urban_by_state.items()]
            }
        else:
            avg_urban = district_metrics['Urbanisation_Rate'].mean()
            response['answer'] = f"The average urbanisation rate is {avg_urban:.2f}%."
            response['type'] = 'text'
    
    # Housing queries
    elif any(kw in question for kw in housing_keywords):
        total_households = district_metrics['Households'].sum()
        response['answer'] = f"Total households in the dataset: {total_households:,}"
        response['type'] = 'text'
    
    # Number of states/districts
    elif 'how many' in question:
        if 'state' in question:
            num_states = district_metrics['State name'].nunique()
            response['answer'] = f"The dataset covers {num_states} states/union territories."
            response['type'] = 'text'
        elif 'district' in question:
            num_districts = district_metrics['District name'].nunique()
            response['answer'] = f"The dataset covers {num_districts} districts."
            response['type'] = 'text'
    
    # Default response
    else:
        response['answer'] = "I can help you with questions about:\n• Population statistics\n• Literacy rates\n• Worker participation\n• Internet connectivity\n• Urbanisation rates\n• Housing data\n\nTry asking: 'What is the total population?' or 'Which states have the highest literacy rate?'"
        response['type'] = 'text'
    
    return response

@app.route('/api/states', methods=['GET'])
def get_states():
    """Get list of all states."""
    try:
        states = sorted(district_metrics['State name'].unique().tolist())
        return jsonify({'states': states})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/state/<state_name>', methods=['GET'])
def get_state_details(state_name):
    """Get detailed information about a specific state."""
    try:
        state_data = district_metrics[district_metrics['State name'] == state_name]
        
        if state_data.empty:
            return jsonify({'error': 'State not found'}), 404
        
        details = {
            'state_name': state_name,
            'total_districts': int(state_data['District name'].nunique()),
            'total_population': int(state_data['Population'].sum()),
            'avg_literacy_rate': float(state_data['Literacy_Rate'].mean()),
            'avg_sex_ratio': float(state_data['Sex_Ratio'].mean()),
            'avg_urbanisation': float(state_data['Urbanisation_Rate'].mean()),
            'districts': state_data[['District name', 'Population', 'Literacy_Rate']].to_dict('records')
        }
        
        return jsonify(details)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ML ENDPOINTS ====================

@app.route('/api/ml/overview', methods=['GET'])
def get_ml_overview():
    """Get overview of all ML models and their performance."""
    try:
        if ml_results is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        overview = {
            'models_trained': len(ml_results),
            'models': {
                'literacy_prediction': {
                    'name': ml_results['literacy_prediction']['model_name'],
                    'type': 'Regression',
                    'r2_score': ml_results['literacy_prediction']['r2_score'],
                    'rmse': ml_results['literacy_prediction']['rmse']
                },
                'internet_prediction': {
                    'name': ml_results['internet_prediction']['model_name'],
                    'type': 'Regression',
                    'r2_score': ml_results['internet_prediction']['r2_score'],
                    'rmse': ml_results['internet_prediction']['rmse']
                },
                'sanitation_classification': {
                    'name': ml_results['sanitation_classification']['model_name'],
                    'type': 'Classification',
                    'accuracy': ml_results['sanitation_classification']['accuracy']
                },
                'district_clustering': {
                    'name': ml_results['district_clustering']['model_name'],
                    'type': 'Clustering',
                    'n_clusters': ml_results['district_clustering']['n_clusters'],
                    'silhouette_score': ml_results['district_clustering']['silhouette_score']
                },
                'anomaly_detection': {
                    'name': ml_results['anomaly_detection']['model_name'],
                    'type': 'Anomaly Detection',
                    'anomalies_detected': ml_results['anomaly_detection']['anomalies_detected'],
                    'anomaly_percentage': ml_results['anomaly_detection']['anomaly_percentage']
                }
            }
        }
        
        return jsonify(overview)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/literacy-prediction', methods=['GET'])
def get_literacy_prediction_details():
    """Get detailed results of literacy prediction model."""
    try:
        if ml_results is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        return jsonify(ml_results['literacy_prediction'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/internet-prediction', methods=['GET'])
def get_internet_prediction_details():
    """Get detailed results of internet penetration prediction model."""
    try:
        if ml_results is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        return jsonify(ml_results['internet_prediction'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/sanitation-classification', methods=['GET'])
def get_sanitation_classification_details():
    """Get detailed results of sanitation risk classification model."""
    try:
        if ml_results is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        return jsonify(ml_results['sanitation_classification'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/clustering', methods=['GET'])
def get_clustering_details():
    """Get detailed results of district clustering."""
    try:
        if ml_results is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        return jsonify(ml_results['district_clustering'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/anomalies', methods=['GET'])
def get_anomalies():
    """Get list of detected anomalous districts."""
    try:
        if ml_results is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        return jsonify(ml_results['anomaly_detection'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/pca', methods=['GET'])
def get_pca_analysis():
    """Get PCA analysis results for visualization."""
    try:
        if ml_results is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        return jsonify(ml_results['pca_analysis'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/recommendations/<district_name>', methods=['GET'])
def get_district_recommendations(district_name):
    """Get policy recommendations for a specific district."""
    try:
        if ml_manager is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        recommendations = ml_manager.generate_policy_recommendations(district_metrics, district_name)
        return jsonify(recommendations)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/predict-literacy', methods=['POST'])
def predict_literacy():
    """Predict literacy rate for given features."""
    try:
        if ml_manager is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        data = request.get_json()
        features = data.get('features', {})
        
        prediction = ml_manager.predict_literacy(features)
        
        return jsonify({
            'predicted_literacy_rate': prediction,
            'features_used': features
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/top-recommendations', methods=['GET'])
def get_top_recommendations():
    """Get top districts needing interventions based on priority scores."""
    try:
        if ml_manager is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        # Get recommendations for all districts
        all_recommendations = []
        for district_name in district_metrics['District name'].unique()[:50]:  # Limit to 50 for performance
            rec = ml_manager.generate_policy_recommendations(district_metrics, district_name)
            if 'error' not in rec:
                all_recommendations.append(rec)
        
        # Sort by priority score
        all_recommendations.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return jsonify({
            'top_priority_districts': all_recommendations[:20],
            'total_analyzed': len(all_recommendations)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ml/cluster-comparison', methods=['GET'])
def get_cluster_comparison():
    """Get comparison of different clusters."""
    try:
        if ml_results is None:
            return jsonify({'error': 'ML models not trained yet'}), 503
        
        cluster_data = ml_results['district_clustering']['cluster_profiles']
        
        # Prepare data for comparison charts
        comparison = {
            'clusters': cluster_data,
            'metrics': ['avg_literacy', 'avg_urbanisation', 'avg_internet', 'avg_sanitation_gap']
        }
        
        return jsonify(comparison)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== GEMINI CHATBOT ENDPOINTS ====================

@app.route('/api/chatbot/session', methods=['POST'])
def create_chat_session():
    """Create a new chat session."""
    try:
        if gemini_chatbot is None:
            return jsonify({'error': 'Chatbot not initialized'}), 503
        
        session_id = gemini_chatbot.create_session()
        return jsonify({
            'success': True,
            'session_id': session_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/chat', methods=['POST'])
def chat_with_bot():
    """Send a message to the chatbot."""
    try:
        if gemini_chatbot is None:
            return jsonify({'error': 'Chatbot not initialized'}), 503
        
        data = request.get_json()
        session_id = data.get('session_id')
        user_prompt = data.get('message', '').strip()
        
        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400
        
        if not user_prompt:
            return jsonify({'error': 'message is required'}), 400
        
        result = gemini_chatbot.chat(session_id, user_prompt)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/history/<session_id>', methods=['GET'])
def get_chat_history(session_id):
    """Get conversation history for a session."""
    try:
        if gemini_chatbot is None:
            return jsonify({'error': 'Chatbot not initialized'}), 503
        
        history = gemini_chatbot.get_conversation_history(session_id)
        return jsonify({
            'success': True,
            'history': history,
            'session_id': session_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/summary/<session_id>', methods=['POST'])
def generate_summary(session_id):
    """Generate a summary of the conversation."""
    try:
        if gemini_chatbot is None:
            return jsonify({'error': 'Chatbot not initialized'}), 503
        
        result = gemini_chatbot.generate_conversation_summary(session_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/summary/<session_id>', methods=['GET'])
def get_summary(session_id):
    """Get the most recent summary for a session."""
    try:
        if gemini_chatbot is None:
            return jsonify({'error': 'Chatbot not initialized'}), 503
        
        summary = gemini_chatbot.get_session_summary(session_id)
        if summary:
            return jsonify({
                'success': True,
                'summary': summary,
                'session_id': session_id
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No summary found for this session'
            }), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/stream', methods=['POST'])
def chat_stream():
    """Send a message to the chatbot with streaming response."""
    try:
        if gemini_chatbot is None:
            return jsonify({'error': 'Chatbot not initialized'}), 503
        
        data = request.get_json()
        session_id = data.get('session_id')
        user_prompt = data.get('message', '').strip()
        
        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400
        
        if not user_prompt:
            return jsonify({'error': 'message is required'}), 400
        
        def generate():
            for chunk in gemini_chatbot.chat_stream(session_id, user_prompt):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return Response(generate(), mimetype='text/plain')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/sessions', methods=['GET'])
def get_all_sessions():
    """Get all chat sessions."""
    try:
        if gemini_chatbot is None:
            return jsonify({'error': 'Chatbot not initialized'}), 503
        
        sessions = gemini_chatbot.get_all_sessions()
        return jsonify({
            'success': True,
            'sessions': sessions
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a chat session."""
    try:
        if gemini_chatbot is None:
            return jsonify({'error': 'Chatbot not initialized'}), 503
        
        success = gemini_chatbot.delete_session(session_id)
        if success:
            return jsonify({
                'success': True,
                'message': 'Session deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete session'
            }), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    initialize_data()
    app.run(debug=True, port=5000)
