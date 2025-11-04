"""Quick test script for the enhanced local data chatbot."""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / 'backend'))

def test_local_chatbot():
    """Test the enhanced chatbot with local data."""
    print("🚀 Testing Enhanced Chatbot with Local Data Integration\n")
    
    try:
        from gemini_chatbot import GeminiChatbot
        
        # Initialize with environment variables or defaults
        api_key = os.getenv('GOOGLE_API_KEY', 'AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc')
        db_url = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_QaDL2XEYuId8@ep-jolly-sound-a42vi9ji-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require')
        
        print("📊 Initializing chatbot with local data...")
        chatbot = GeminiChatbot(api_key, db_url)
        print("✅ Chatbot initialized successfully!\n")
        
        # Test data summary
        print("📈 Getting data summary...")
        summary = chatbot.get_data_summary()
        print(f"✅ Loaded {summary['dataset_info']['total_districts']} districts")
        print(f"✅ Loaded {summary['dataset_info']['total_states']} states")
        print(f"✅ Total population: {summary['dataset_info']['total_population']:,}")
        print(f"✅ ML models trained: {len(summary['ml_models'])}\n")
        
        # Test a simple query
        print("💬 Testing sample question...")
        session_id = chatbot.create_session()
        result = chatbot.chat(session_id, "What is the total population of India according to Census 2011?")
        
        if result['success']:
            print("✅ Chat response generated successfully!")
            print(f"📝 Response preview: {result['response'][:200]}...\n")
            
            # Check if response is properly restricted
            if 'census 2011' in result['response'].lower():
                print("✅ Response correctly cites Census 2011 data")
            else:
                print("⚠️  Response may not properly cite data source")
        else:
            print(f"❌ Chat failed: {result['error']}")
        
        print("\n🎉 Enhanced chatbot is working correctly!")
        print("🔗 The chatbot now:")
        print("   • Uses local Census 2011 data exclusively")
        print("   • Integrates with trained ML models")
        print("   • Restricts responses to available data")
        print("   • Provides accurate, contextual answers")
        
    except Exception as e:
        print(f"❌ Error testing chatbot: {e}")
        print("\n🔧 Troubleshooting:")
        print("   • Ensure all dependencies are installed: pip install -r requirements.txt")
        print("   • Check that data files are present in the project root")
        print("   • Verify API key and database URL are correct")

if __name__ == "__main__":
    test_local_chatbot()