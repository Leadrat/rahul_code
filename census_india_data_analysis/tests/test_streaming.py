"""Test the streaming functionality of the Gemini chatbot."""

import google.generativeai as genai

def test_streaming():
    """Test if streaming works with Gemini 2.5 Flash."""
    try:
        print("Testing Gemini 2.5 Flash streaming...")
        
        api_key = "AIzaSyDYGB9M-YnHaSYbLH-E_2FKViIx2rNmelc"
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Test streaming response
        prompt = "Explain what population means in the context of census data. Keep it detailed."
        
        print("Streaming response:")
        print("-" * 50)
        
        response = model.generate_content(prompt, stream=True)
        
        full_text = ""
        chunk_count = 0
        
        for chunk in response:
            if chunk.text:
                print(chunk.text, end='', flush=True)
                full_text += chunk.text
                chunk_count += 1
        
        print("\n" + "-" * 50)
        print(f"✓ Streaming test completed!")
        print(f"  - Total chunks: {chunk_count}")
        print(f"  - Total length: {len(full_text)} characters")
        print(f"  - Preview: {full_text[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"✗ Streaming test failed: {e}")
        return False

if __name__ == "__main__":
    test_streaming()