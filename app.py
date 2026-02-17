from flask import Flask, render_template, jsonify, request, send_file
import os
import pickle
import base64
import random
from pathlib import Path
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Configuration
SONGS_DIR = "songs"
PICKLE_DIR = os.path.join(SONGS_DIR, "pkl_files")
MP3_DIR = os.path.join(SONGS_DIR, "mp3_files")

# Ensure directories exist
os.makedirs(PICKLE_DIR, exist_ok=True)
os.makedirs(MP3_DIR, exist_ok=True)

def save_song_to_pickle(mp3_filename):
    """Convert MP3 file to pickle format"""
    mp3_path = os.path.join(MP3_DIR, mp3_filename)
    pickle_filename = mp3_filename.replace('.mp3', '.pkl')
    pickle_path = os.path.join(PICKLE_DIR, pickle_filename)
    
    try:
        with open(mp3_path, 'rb') as mp3_file:
            audio_data = mp3_file.read()
        
        song_data = {
            'filename': mp3_filename,
            'audio_data': audio_data,
            'size': len(audio_data)
        }
        
        with open(pickle_path, 'wb') as pkl_file:
            pickle.dump(song_data, pkl_file)
        
        return True, pickle_filename
    except Exception as e:
        return False, str(e)

def load_song_from_pickle(pickle_filename):
    """Load MP3 data from pickle file"""
    pickle_path = os.path.join(PICKLE_DIR, pickle_filename)
    
    try:
        with open(pickle_path, 'rb') as pkl_file:
            song_data = pickle.load(pkl_file)
        return song_data
    except Exception as e:
        return None

def get_available_songs():
    """Get list of available pickle files"""
    try:
        pkl_files = [f for f in os.listdir(PICKLE_DIR) if f.endswith('.pkl')]
        return sorted(pkl_files)
    except Exception as e:
        return []

def scan_and_convert_mp3s():
    """Scan mp3_files directory and convert to pickle"""
    try:
        mp3_files = [f for f in os.listdir(MP3_DIR) if f.endswith('.mp3')]
        converted = []
        errors = []
        
        for mp3_file in mp3_files:
            pickle_filename = mp3_file.replace('.mp3', '.pkl')
            pickle_path = os.path.join(PICKLE_DIR, pickle_filename)
            
            if not os.path.exists(pickle_path):
                success, result = save_song_to_pickle(mp3_file)
                if success:
                    converted.append(mp3_file)
                else:
                    errors.append((mp3_file, result))
        
        return converted, errors
    except Exception as e:
        return [], []

# Auto-convert MP3s on startup
scan_and_convert_mp3s()

@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')

@app.route('/api/songs')
def api_songs():
    """Get list of all available songs"""
    songs = get_available_songs()
    return jsonify({
        'success': True,
        'songs': songs,
        'count': len(songs)
    })

@app.route('/api/song/<filename>')
def api_song(filename):
    """Get specific song data as base64"""
    song_data = load_song_from_pickle(filename)
    if song_data:
        audio_base64 = base64.b64encode(song_data['audio_data']).decode()
        return jsonify({
            'success': True,
            'filename': filename,
            'audio_base64': audio_base64,
            'size': song_data['size']
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Song not found'
        }), 404

@app.route('/api/upload', methods=['POST'])
def api_upload():
    """Upload new MP3 files"""
    if 'files' not in request.files:
        return jsonify({'success': False, 'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    uploaded = []
    errors = []
    
    for file in files:
        if file and file.filename.endswith('.mp3'):
            filename = secure_filename(file.filename)
            mp3_path = os.path.join(MP3_DIR, filename)
            
            try:
                file.save(mp3_path)
                success, result = save_song_to_pickle(filename)
                if success:
                    uploaded.append(filename)
                else:
                    errors.append({'filename': filename, 'error': result})
            except Exception as e:
                errors.append({'filename': filename, 'error': str(e)})
    
    return jsonify({
        'success': True,
        'uploaded': uploaded,
        'errors': errors,
        'count': len(uploaded)
    })

@app.route('/api/scan')
def api_scan():
    """Scan and convert any new MP3 files"""
    converted, errors = scan_and_convert_mp3s()
    return jsonify({
        'success': True,
        'converted': converted,
        'errors': errors,
        'count': len(converted)
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
