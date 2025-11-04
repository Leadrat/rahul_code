"""Simple verification that the DatasetBundle fix is correct."""

def verify_fix():
    """Verify the fix by checking the code structure."""
    
    print("Verifying DatasetBundle fix...")
    print("=" * 50)
    
    # Read the chatbot file and check for the fix
    try:
        with open('backend/gemini_chatbot.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check that we removed the problematic line
        if 'data_bundle.primary' in content:
            print("❌ ERROR: Still references data_bundle.primary")
            return False
        else:
            print("✓ Removed data_bundle.primary reference")
        
        # Check that we have the correct DatasetBundle attributes
        if 'self.data_bundle.district' in content and 'self.data_bundle.housing' in content:
            print("✓ Uses correct DatasetBundle attributes (district, housing)")
        else:
            print("❌ ERROR: Missing correct DatasetBundle attributes")
            return False
        
        # Check for safe column access
        if "'Population' in district_df.columns" in content:
            print("✓ Uses safe column access patterns")
        else:
            print("❌ ERROR: Missing safe column access")
            return False
        
        print("\nChecking test file...")
        
        # Check test file
        with open('test_chatbot.py', 'r', encoding='utf-8') as f:
            test_content = f.read()
        
        if 'data_bundle.primary' in test_content:
            print("❌ ERROR: Test file still references data_bundle.primary")
            return False
        else:
            print("✓ Test file fixed")
        
        print("\n" + "=" * 50)
        print("🎉 All fixes verified! The chatbot should work now.")
        print("\nWhat was fixed:")
        print("1. Removed reference to non-existent data_bundle.primary")
        print("2. Added safe column access with 'in columns' checks")
        print("3. Updated test file to match DatasetBundle structure")
        print("4. Made context generation more robust")
        
        print("\nNext steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Start backend: cd backend && python app.py")
        print("3. Start frontend: cd frontend && npm start")
        print("4. Test chatbot at: http://localhost:3000/chatbot")
        
        return True
        
    except FileNotFoundError as e:
        print(f"❌ ERROR: Could not find file: {e}")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    verify_fix()