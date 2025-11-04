"""Simple test of just the Gemini model functionality."""

import google.generativeai as genai

def test_gemini_only():
    """Test just the Gemini API functionality."""
    try:
        print("Testing Gemini 2.5 Flash model...")
        
        api_key = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Test basic functionality
        response = model.generate_content("Hello, can you help me analyze census data?")
        print(f"✓ Basic test: {response.text[:100]}...")
        
        # Test with a census-like question
        census_question = """
        You are an expert data analyst. I have census data with the following information:
        - Total population: 1,210,854,977
        - States covered: 35
        - Districts covered: 640
        
        Question: What is the average population per district?
        """
        
        response2 = model.generate_content(census_question)
        print(f"✓ Census analysis test: {response2.text[:150]}...")
        
        print("\n🎉 Gemini model is working correctly!")
        print("The chatbot core functionality is ready.")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    test_gemini_only()