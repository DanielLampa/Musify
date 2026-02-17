// Global State
const state = {
    allSongs: [],
    queue: [],
    currentIndex: 0,
    selectedSongs: new Set(),
    repeatMode: 'off', // 'off', 'all', 'one'
    isPlaying: false,
    audioPlayer: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    state.audioPlayer = document.getElementById('audioPlayer');
    initializeEventListeners();
    loadSongs();
    setupAudioPlayer();
});

// API Functions
async function loadSongs() {
    try {
        const response = await fetch('/api/songs');
        const data = await response.json();
        
        if (data.success) {
            state.allSongs = data.songs;
            renderLibrary();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading songs:', error);
        showToast('Error loading songs');
    }
}

async function loadSongData(filename) {
    try {
        const response = await fetch(`/api/song/${filename}`);
        const data = await response.json();
        
        if (data.success) {
            return data.audio_base64;
        }
        return null;
    } catch (error) {
        console.error('Error loading song data:', error);
        return null;
    }
}

// Audio Player Setup
function setupAudioPlayer() {
    state.audioPlayer.addEventListener('ended', () => {
        handleSongEnded();
    });

    state.audioPlayer.addEventListener('play', () => {
        state.isPlaying = true;
        updateStats();
    });

    state.audioPlayer.addEventListener('pause', () => {
        state.isPlaying = false;
        updateStats();
    });
}

function handleSongEnded() {
    if (state.repeatMode === 'one') {
        // Repeat current song
        state.audioPlayer.currentTime = 0;
        state.audioPlayer.play();
    } else if (playNext()) {
        // Play next song
        playSongAtIndex(state.currentIndex);
    } else if (state.repeatMode === 'all') {
        // Restart queue
        state.currentIndex = 0;
        playSongAtIndex(0);
    }
}

// Queue Management
function addToQueue(song) {
    if (!state.queue.includes(song)) {
        state.queue.push(song);
        updateQueueDisplay();
        updateStats();
        return true;
    }
    return false;
}

function addMultipleToQueue(songs) {
    let added = 0;
    songs.forEach(song => {
        if (addToQueue(song)) {
            added++;
        }
    });
    return added;
}

function removeFromQueue(index) {
    if (index >= 0 && index < state.queue.length) {
        state.queue.splice(index, 1);
        
        if (state.currentIndex >= state.queue.length && state.currentIndex > 0) {
            state.currentIndex--;
        }
        
        updateQueueDisplay();
        updateNowPlaying();
        updateStats();
    }
}

function clearQueue() {
    state.queue = [];
    state.currentIndex = 0;
    state.isPlaying = false;
    state.audioPlayer.pause();
    state.audioPlayer.src = '';
    updateQueueDisplay();
    updateNowPlaying();
    updateStats();
}

function shuffleQueue() {
    if (state.queue.length > 1) {
        const currentSong = state.queue[state.currentIndex];
        const remaining = [...state.queue];
        remaining.splice(state.currentIndex, 1);
        
        // Fisher-Yates shuffle
        for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
        }
        
        state.queue = [currentSong, ...remaining];
        state.currentIndex = 0;
        updateQueueDisplay();
        updateNowPlaying();
        showToast('Queue shuffled');
    }
}

// Playback Controls
function playNext() {
    if (state.currentIndex < state.queue.length - 1) {
        state.currentIndex++;
        return true;
    } else if (state.repeatMode === 'all') {
        state.currentIndex = 0;
        return true;
    }
    return false;
}

function playPrevious() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
        playSongAtIndex(state.currentIndex);
    }
}

async function playSongAtIndex(index) {
    if (index >= 0 && index < state.queue.length) {
        state.currentIndex = index;
        const song = state.queue[index];
        
        showToast('Loading song...');
        const audioData = await loadSongData(song);
        
        if (audioData) {
            state.audioPlayer.src = `data:audio/mp3;base64,${audioData}`;
            state.audioPlayer.play().catch(err => {
                console.error('Playback error:', err);
                showToast('Error playing song');
            });
            
            updateNowPlaying();
            updateQueueDisplay();
            updateStats();
        } else {
            showToast('Error loading song');
        }
    }
}

function toggleRepeat() {
    const modes = ['off', 'all', 'one'];
    const currentIdx = modes.indexOf(state.repeatMode);
    state.repeatMode = modes[(currentIdx + 1) % modes.length];
    
    updateRepeatButton();
    updateStats();
    showToast(`Repeat: ${state.repeatMode.toUpperCase()}`);
}

// UI Updates
function updateNowPlaying() {
    const container = document.getElementById('audioPlayerContainer');
    const songName = document.getElementById('currentSongName');
    const songMeta = document.getElementById('currentSongMeta');
    const upNextList = document.getElementById('upNextList');
    
    if (state.queue.length > 0 && state.currentIndex < state.queue.length) {
        const currentSong = state.queue[state.currentIndex];
        const displayName = currentSong.replace('.pkl', '');
        
        songName.textContent = displayName;
        songMeta.textContent = `Track ${state.currentIndex + 1} of ${state.queue.length}`;
        container.style.display = 'block';
        
        // Update Up Next
        upNextList.innerHTML = '';
        const nextSongs = state.queue.slice(state.currentIndex + 1, state.currentIndex + 4);
        
        if (nextSongs.length > 0) {
            nextSongs.forEach((song, idx) => {
                const div = document.createElement('div');
                div.className = 'up-next-item';
                const name = song.replace('.pkl', '');
                div.textContent = `${idx + 1}. ${name.substring(0, 30)}${name.length > 30 ? '...' : ''}`;
                upNextList.appendChild(div);
            });
        } else {
            upNextList.innerHTML = '<p class="empty-text">No more songs in queue</p>';
        }
    } else {
        songName.textContent = 'No song playing';
        songMeta.textContent = 'Select songs from your library';
        container.style.display = 'none';
        upNextList.innerHTML = '<p class="empty-text">No more songs in queue</p>';
    }
}

function updateRepeatButton() {
    const btn = document.getElementById('repeatBtn');
    const icons = {
        'off': '🔁',
        'all': '🔂',
        'one': '🔂'
    };
    
    btn.textContent = icons[state.repeatMode] || '🔁';
    
    if (state.repeatMode !== 'off') {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

function updateQueueDisplay() {
    const queueList = document.getElementById('queueList');
    
    if (state.queue.length === 0) {
        queueList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>Queue is empty</h3>
                <p>Add songs from your library to start listening</p>
            </div>
        `;
        return;
    }
    
    queueList.innerHTML = '';
    state.queue.forEach((song, index) => {
        const div = document.createElement('div');
        div.className = 'queue-item' + (index === state.currentIndex ? ' current' : '');
        
        const displayName = song.replace('.pkl', '');
        const isPlaying = index === state.currentIndex;
        
        div.innerHTML = `
            <div class="queue-index">${isPlaying ? '▶️' : index + 1}</div>
            <div class="queue-name">${displayName}</div>
            <button class="song-btn" onclick="removeFromQueue(${index})">❌</button>
        `;
        
        queueList.appendChild(div);
    });
}

function renderLibrary() {
    const songsList = document.getElementById('songsList');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    const filteredSongs = state.allSongs.filter(song => 
        song.toLowerCase().includes(searchQuery)
    );
    
    if (filteredSongs.length === 0) {
        songsList.innerHTML = '<p class="empty-text">No songs found</p>';
        return;
    }
    
    songsList.innerHTML = `<p style="margin-bottom: 1rem;"><strong>${filteredSongs.length}</strong> songs found</p>`;
    
    filteredSongs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-item';
        
        const displayName = song.replace('.pkl', '');
        const isInQueue = state.queue.includes(song);
        const isSelected = state.selectedSongs.has(song);
        
        div.innerHTML = `
            <input type="checkbox" class="song-checkbox" ${isSelected ? 'checked' : ''} 
                   onchange="toggleSongSelection('${song}')">
            <div class="song-name">
                ${isInQueue ? '🎵' : '🎧'} <strong>${displayName}</strong>
            </div>
            <div class="song-actions">
                <button class="song-btn" onclick="addSongToQueue('${song}')">➕</button>
                <button class="song-btn" onclick="playSongNow('${song}')">▶️</button>
            </div>
        `;
        
        songsList.appendChild(div);
    });
}

function updateStats() {
    // Header
    document.getElementById('totalSongsCount').textContent = state.allSongs.length;
    
    // Stats cards
    document.getElementById('statTotalSongs').textContent = state.allSongs.length;
    document.getElementById('statInQueue').textContent = state.queue.length;
    document.getElementById('statPlaying').textContent = 
        state.queue.length > 0 ? state.currentIndex + 1 : 0;
    document.getElementById('statSelected').textContent = state.selectedSongs.size;
    
    // Settings info
    document.getElementById('infoTotalSongs').textContent = state.allSongs.length;
    document.getElementById('infoQueueSize').textContent = state.queue.length;
    document.getElementById('infoRepeatMode').textContent = state.repeatMode.toUpperCase();
    document.getElementById('infoIsPlaying').textContent = state.isPlaying ? 'Yes' : 'No';
    
    // Enable/disable add selected button
    document.getElementById('addSelectedBtn').disabled = state.selectedSongs.size === 0;
}

// Event Handlers
function toggleSongSelection(song) {
    if (state.selectedSongs.has(song)) {
        state.selectedSongs.delete(song);
    } else {
        state.selectedSongs.add(song);
    }
    updateStats();
}

function addSongToQueue(song) {
    if (addToQueue(song)) {
        showToast('Added to queue');
    } else {
        showToast('Already in queue');
    }
}

function playSongNow(song) {
    state.queue = [song];
    state.currentIndex = 0;
    playSongAtIndex(0);
    showToast('Now playing');
}

function playAll() {
    state.queue = [...state.allSongs];
    state.currentIndex = 0;
    playSongAtIndex(0);
    showToast(`Playing ${state.queue.length} songs`);
}

function shuffleAll() {
    state.queue = [...state.allSongs];
    
    // Fisher-Yates shuffle
    for (let i = state.queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]];
    }
    
    state.currentIndex = 0;
    playSongAtIndex(0);
    showToast('Playing shuffled');
}

function addSelected() {
    const added = addMultipleToQueue(Array.from(state.selectedSongs));
    state.selectedSongs.clear();
    renderLibrary();
    showToast(`Added ${added} songs to queue`);
}

// Toast Notifications
function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Tab Switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// File Upload
async function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        return;
    }
    
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.innerHTML = '<p>Uploading...</p>';
    
    const formData = new FormData();
    for (let file of files) {
        formData.append('files', file);
    }
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            statusDiv.innerHTML = `<p style="color: green;">✅ Uploaded ${data.count} file(s)</p>`;
            fileInput.value = '';
            
            setTimeout(() => {
                loadSongs();
                statusDiv.innerHTML = '';
            }, 2000);
        } else {
            statusDiv.innerHTML = '<p style="color: red;">❌ Upload failed</p>';
        }
    } catch (error) {
        console.error('Upload error:', error);
        statusDiv.innerHTML = '<p style="color: red;">❌ Upload failed</p>';
    }
}

// Event Listeners
function initializeEventListeners() {
    // Playback controls
    document.getElementById('shuffleBtn').addEventListener('click', shuffleQueue);
    document.getElementById('prevBtn').addEventListener('click', playPrevious);
    document.getElementById('stopBtn').addEventListener('click', clearQueue);
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (playNext()) {
            playSongAtIndex(state.currentIndex);
        }
    });
    document.getElementById('repeatBtn').addEventListener('click', toggleRepeat);
    
    // Library actions
    document.getElementById('searchInput').addEventListener('input', renderLibrary);
    document.getElementById('playAllBtn').addEventListener('click', playAll);
    document.getElementById('shuffleAllBtn').addEventListener('click', shuffleAll);
    document.getElementById('addSelectedBtn').addEventListener('click', addSelected);
    
    // Queue actions
    document.getElementById('shuffleQueueBtn').addEventListener('click', shuffleQueue);
    document.getElementById('clearQueueBtn').addEventListener('click', clearQueue);
    
    // Upload
    document.getElementById('uploadBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}
