"""Test the gemini-2.5-flash model."""

import google.generativeai as genai

def test_model():
    """Test if gemini-2.5-flash works."""
    try:
        api_key = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
        genai.configure(api_key=api_key)
        
        print("Testing gemini-2.5-flash model...")
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        response = model.generate_content("Say 'Hello, I am working!' in one sentence.")
        print(f"✓ Model works! Response: {response.text}")
        
        # Test with a census-related question
        census_test = "What is population in simple terms?"
        response2 = model.generate_content(census_test)
        print(f"✓ Census test works! Response: {response2.text[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    test_model()