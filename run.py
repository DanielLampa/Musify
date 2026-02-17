#!/usr/bin/env python3
"""
Quick start script for Flask Music Player
"""
import os
import sys

def main():
    # Check if required directories exist
    if not os.path.exists('songs'):
        os.makedirs('songs/mp3_files', exist_ok=True)
        os.makedirs('songs/pkl_files', exist_ok=True)
        print("✅ Created song directories")
    
    # Check if Flask is installed
    try:
        import flask
        print("✅ Flask is installed")
    except ImportError:
        print("❌ Flask not found. Installing dependencies...")
        os.system(f"{sys.executable} -m pip install -r requirements.txt")
    
    # Start the application
    print("\n" + "="*50)
    print("🎵 Starting Music Player...")
    print("="*50)
    print("\n📍 Open your browser and go to:")
    print("   http://localhost:5000")
    print("\n⚡ Press Ctrl+C to stop the server\n")
    
    # Import and run Flask app
    from app import app
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    main()
