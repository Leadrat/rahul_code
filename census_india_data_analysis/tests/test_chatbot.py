"""Test script for Gemini Chatbot functionality.

Run this script to verify the chatbot setup before starting the full application.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test if all required packages are installed."""
    print("Testing imports...")
    try:
        import google.generativeai as genai
        print("✓ google-generativeai installed")
    except ImportError:
        print("✗ google-generativeai not installed. Run: pip install google-generativeai")
        return False
    
    try:
        import psycopg2
        print("✓ psycopg2-binary installed")
    except ImportError:
        print("✗ psycopg2-binary not installed. Run: pip install psycopg2-binary")
        return False
    
    try:
        import pandas
        print("✓ pandas installed")
    except ImportError:
        print("✗ pandas not installed. Run: pip install pandas")
        return False
    
    return True

def test_gemini_api():
    """Test Gemini API connection."""
    print("\nTesting Gemini API connection...")
    try:
        import google.generativeai as genai
        
        api_key = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Test simple query
        response = model.generate_content("Say 'Hello, I am working!' in one sentence.")
        print(f"✓ Gemini API working. Response: {response.text[:50]}...")
        return True
    except Exception as e:
        print(f"✗ Gemini API error: {e}")
        return False

def test_database_connection():
    """Test Neon database connection."""
    print("\nTesting Neon database connection...")
    try:
        import psycopg2
        
        db_url = "postgresql://neondb_owner:npg_QaDL2XEYuId8@ep-jolly-sound-a42vi9ji-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
        
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✓ Database connected. PostgreSQL version: {version[0][:50]}...")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"✗ Database connection error: {e}")
        return False

def test_data_loading():
    """Test if census data can be loaded."""
    print("\nTesting census data loading...")
    try:
        from src.data_analysis import load_datasets
        
        data_dir = Path(__file__).parent
        data_bundle = load_datasets(data_dir)
        
        print(f"✓ District data loaded: {data_bundle.district.shape[0]} rows")
        print(f"✓ Housing data loaded: {data_bundle.housing.shape[0]} rows")
        print(f"✓ Column mapping loaded: {len(data_bundle.colmap)} mappings")
        return True
    except Exception as e:
        print(f"✗ Data loading error: {e}")
        return False

def test_chatbot_initialization():
    """Test chatbot initialization."""
    print("\nTesting chatbot initialization...")
    try:
        from src.data_analysis import load_datasets
        from backend.gemini_chatbot import GeminiChatbot
        
        api_key = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
        db_url = "postgresql://neondb_owner:npg_QaDL2XEYuId8@ep-jolly-sound-a42vi9ji-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
        
        data_dir = Path(__file__).parent
        data_bundle = load_datasets(data_dir)
        
        chatbot = GeminiChatbot(api_key, db_url, data_bundle)
        print("✓ Chatbot initialized successfully")
        
        # Test session creation
        session_id = chatbot.create_session()
        print(f"✓ Session created: {session_id}")
        
        # Test chat
        result = chatbot.chat(session_id, "What is the total population?")
        if result['success']:
            print(f"✓ Chat working. Response preview: {result['response'][:100]}...")
        else:
            print(f"✗ Chat error: {result.get('error')}")
            return False
        
        return True
    except Exception as e:
        print(f"✗ Chatbot initialization error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("GEMINI CHATBOT TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Package Imports", test_imports),
        ("Gemini API", test_gemini_api),
        ("Database Connection", test_database_connection),
        ("Data Loading", test_data_loading),
        ("Chatbot Initialization", test_chatbot_initialization),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, result in results:
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED! Chatbot is ready to use.")
        print("\nTo start the application:")
        print("1. Backend: cd backend && python app.py")
        print("2. Frontend: cd frontend && npm start")
        print("3. Navigate to: http://localhost:3000/chatbot")
    else:
        print("⚠️  SOME TESTS FAILED. Please fix the issues above.")
    print("=" * 60)

if __name__ == "__main__":
    main()
