# 🎵 Music Player - Streamlit Application

A modern, feature-rich music player built with Streamlit that stores MP3 files in pickle format for efficient loading and playback.

## ✨ Features

- 🎵 **Modern UI** - Beautiful gradient design with smooth animations
- 📦 **Pickle Storage** - MP3 files are converted and stored in pickle format
- 📋 **Queue Management** - Add, remove, and reorder songs in your playlist
- ▶️ **Continuous Playback** - Songs play continuously from the queue
- 📤 **File Upload** - Upload new MP3 files directly through the web interface
- 🔍 **Search** - Quickly find songs in your library
- 📊 **Statistics Dashboard** - View your library stats at a glance

## 📁 Folder Structure

```
music_player_app/
│
├── app.py                          # Main application file
├── songs/                          # Songs directory
│   ├── mp3_files/                  # Original MP3 files (place your MP3s here)
│   └── pkl_files/                  # Converted pickle files (auto-generated)
└── README.md                       # This file
```

## 🚀 Getting Started

### Prerequisites

```bash
pip install streamlit
```

### Installation

1. **Clone or download this project**

2. **Add your MP3 files**
   - Place your MP3 files in the `songs/mp3_files/` directory
   - The app will automatically convert them to pickle format on first run

3. **Run the application**
   ```bash
   streamlit run app.py
   ```

4. **Open your browser**
   - The app will open automatically at `http://localhost:8501`

## 📖 How to Use

### 1. **Now Playing Tab** 🎧
- View the currently playing song
- See visual music animation
- Control playback (Previous, Stop, Next)
- Preview upcoming songs in queue

### 2. **Queue Manager Tab** 📋
- View all songs in your current queue
- Reorder songs using up/down arrows
- Remove individual songs or clear entire queue
- See which song is currently playing

### 3. **Library Tab** ⚙️
- Browse all available songs
- Upload new MP3 files
- Search for specific songs
- Add songs to queue or play immediately

## 🎨 UI Features

- **Gradient Background** - Modern purple gradient design
- **Glass Morphism** - Transparent cards with blur effects
- **Animations** - Smooth pulse animation for now playing card
- **Responsive Layout** - Clean, organized interface
- **Statistics Dashboard** - Real-time stats display

## 🔧 Technical Details

### Pickle Storage
- MP3 files are converted to pickle format for faster loading
- Original MP3 files are preserved in `mp3_files` directory
- Pickle files contain:
  - Original filename
  - Audio data (binary)
  - File size

### Auto-Conversion
- On first run, all MP3s in `mp3_files` are automatically converted
- New uploads are instantly converted to pickle format
- Existing pickle files are not reconverted

### Queue System
- Songs are concatenated in memory
- Continuous playback through single audio element
- Queue order can be modified on-the-fly

## 🎯 Tips

1. **Organizing Songs**: Name your MP3 files clearly (e.g., "Artist - Song Title.mp3")
2. **File Upload**: Use the upload feature to add songs without manually placing files
3. **Search**: Use the search bar to quickly find songs in large libraries
4. **Queue Management**: Build your perfect playlist by adding songs in your preferred order

## 🛠️ Customization

### Change Color Scheme
Edit the CSS in `app.py` to modify the gradient colors:
```python
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Modify Animation
Adjust the pulse animation timing in the CSS section:
```css
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}
```

## 📝 Notes

- Pickle files are stored in `songs/pkl_files/`
- Original MP3 files remain in `songs/mp3_files/`
- Session state manages queue and playback
- All directories are created automatically

## 🐛 Troubleshooting

**No songs appearing?**
- Ensure MP3 files are in `songs/mp3_files/` directory
- Check file permissions
- Look for error messages in the app

**Songs not playing?**
- Verify MP3 files are valid
- Check browser console for errors
- Try refreshing the page

**Upload not working?**
- Ensure you have write permissions
- Check available disk space
- Verify file format is .mp3

## 📄 License

Free to use and modify for personal or commercial projects.

## 🤝 Contributing

Feel free to fork, modify, and improve this music player!

---

**Enjoy your music! 🎵**