import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load your API key
load_dotenv(".env")
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: GOOGLE_API_KEY not found in .env")
else:
    print(f"✅ Key found: {api_key[:5]}...")
    
    # Configure the library
    genai.configure(api_key=api_key)

    print("\nAttempting to list models...")
    try:
        # Ask Google for the list
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                # Print the exact name we need
                print(f"FOUND MODEL: {m.name}")
    except Exception as e:
        print(f"❌ Error connecting to Google: {e}")