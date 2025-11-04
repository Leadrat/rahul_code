"""Check available Gemini models."""

import google.generativeai as genai

def check_available_models():
    """List all available Gemini models."""
    try:
        api_key = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
        genai.configure(api_key=api_key)
        
        print("Available Gemini models:")
        print("=" * 50)
        
        models = genai.list_models()
        for model in models:
            print(f"Name: {model.name}")
            print(f"Display Name: {model.display_name}")
            print(f"Description: {model.description}")
            print(f"Supported Methods: {model.supported_generation_methods}")
            print("-" * 30)
        
        # Test gemini-pro specifically
        print("\nTesting gemini-pro model:")
        try:
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content("Say 'Hello, I am working!'")
            print(f"✓ gemini-pro works: {response.text}")
        except Exception as e:
            print(f"✗ gemini-pro error: {e}")
        
        # Test other common model names
        test_models = [
            'gemini-1.5-flash',
            'gemini-flash',
            'gemini-1.5-pro',
            'models/gemini-pro',
            'models/gemini-1.5-flash'
        ]
        
        print(f"\nTesting other model names:")
        for model_name in test_models:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Test")
                print(f"✓ {model_name} works")
            except Exception as e:
                print(f"✗ {model_name} failed: {str(e)[:100]}...")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_available_models()