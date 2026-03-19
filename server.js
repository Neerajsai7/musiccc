// --- LOAD THEME BEFORE ANYTHING ELSE ---
let currentTheme = localStorage.getItem('sky_theme') || '#00f2fe';
document.documentElement.style.setProperty('--accent', currentTheme);

function changeTheme(color) {
    currentTheme = color;
    document.documentElement.style.setProperty('--accent', color);
    localStorage.setItem('sky_theme', color);
}

// --- DATABASE (IndexedDB) ---
let db;
const request = indexedDB.open("SkyMusicDB", 1);
let downloadedURLs = JSON.parse(localStorage.getItem('downloadedURLs')) || [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let playlists = JSON.parse(localStorage.getItem('sky_playlists')) || [];

// NEW: RECENTLY PLAYED ARRAY
let recentHistory = JSON.parse(localStorage.getItem('sky_recent')) || [];

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("offlineAudio")) db.createObjectStore("offlineAudio");
};
request.onsuccess = (e) => {
    db = e.target.result;
    renderLibrary();
};

function saveSongOffline(url, blob) {
    const transaction = db.transaction(["offlineAudio"], "readwrite");
    const store = transaction.objectStore("offlineAudio");
    store.put(blob, url);
    transaction.oncomplete = () => {
        if (!downloadedURLs.includes(url)) {
            downloadedURLs.push(url);
            localStorage.setItem('downloadedURLs', JSON.stringify(downloadedURLs));
            refreshAllGrids();
        }
    };
}

function getOfflineSong(url) {
    return new Promise((resolve) => {
        if (!db) return resolve(null);
        const req = db.transaction(["offlineAudio"], "readonly").objectStore("offlineAudio").get(url);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}

// ========================================================
// DATA & STATE (SMART SYNC)
// ========================================================
let savedSongs = JSON.parse(localStorage.getItem('sky_songs_v4')) || [];

if (typeof defaultSongs !== 'undefined') {
    defaultSongs.forEach(ds => {
        let existing = savedSongs.find(ss => ss.file === ds.file);
        if (!existing) {
            savedSongs.push(ds);
        } else {
            existing.language = ds.language;
            existing.title = ds.title;
            existing.artist = ds.artist;
            existing.cover = ds.cover;
            existing.lyrics = ds.lyrics; // Sync lyrics from songs.js too!
        }
    });
}

let songs = savedSongs;
localStorage.setItem('sky_songs_v4', JSON.stringify(songs));

let audio = new Audio();
audio.crossOrigin = "anonymous"; 
let currentSong = -1; 
let isLooping = false;
let isShuffle = false; 
let currentObjectURL = null;
let activeContextIndex = -1;
let touchTimer = null; 
let currentViewedPlaylist = ""; 

let currentPlaybackQueue = [];
let currentQueueContext = 'all';
let homeScreenIndices = [];
let searchScreenIndices = [];
let currentSearchFilter = 'All';

// ========================================================
// AUDIO VISUALIZER & EQUALIZER (Web Audio API)
// ========================================================
let audioCtx;
let sourceNode;
let lowFilter, midFilter, highFilter;
let analyser;
let canvasCtx;
let visualizerAnimation;

function initAudioEQ() {
    if (audioCtx) return; 
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaElementSource(audio);
    
    // EQ Nodes
    lowFilter = audioCtx.createBiquadFilter(); lowFilter.type = "lowshelf"; lowFilter.frequency.value = 250; 
    midFilter = audioCtx.createBiquadFilter(); midFilter.type = "peaking"; midFilter.frequency.value = 1000; midFilter.Q.value = 1;
    highFilter = audioCtx.createBiquadFilter(); highFilter.type = "highshelf"; highFilter.frequency.value = 4000;

    // Visualizer Node
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128; // Determines number of bars

    sourceNode.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(analyser); // Connect to visualizer
    analyser.connect(audioCtx.destination); // Connect to speakers
    
    updateEQ(); 

    // Setup Canvas
    const canvas = document.getElementById("visualizer");
    canvasCtx = canvas.getContext("2d");
    drawVisualizer();
}

function drawVisualizer() {
    visualizerAnimation = requestAnimationFrame(drawVisualizer);
    
    if (!analyser || audio.paused) return; // Save CPU when paused

    const canvas = document.getElementById("visualizer");
    canvas.width = window.innerWidth;
    canvas.height = 300;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        // Draw with current Accent Color
        canvasCtx.fillStyle = currentTheme;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 2;
    }
}

function updateEQ() {
    if (!audioCtx) return;
    const low = parseFloat(document.getElementById("eqLow").value);
    const mid = parseFloat(document.getElementById("eqMid").value);
    const high = parseFloat(document.getElementById("eqHigh").value);
    
    lowFilter.gain.value = low;
    midFilter.gain.value = mid;
    highFilter.gain.value = high;

    document.getElementById("eqLowVal").innerText = (low > 0 ? "+" : "") + low + " dB";
    document.getElementById("eqMidVal").innerText = (mid > 0 ? "+" : "") + mid + " dB";
    document.getElementById("eqHighVal").innerText = (high > 0 ? "+" : "") + high + " dB";
}

['eqLow', 'eqMid', 'eqHigh'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateEQ);
});

// ========================================================
// SYNCED LYRICS PARSER
// ========================================================
let parsedLyrics = [];
let isLyricsVisible = false;

function parseLRC(lrcText) {
    parsedLyrics = [];
    const lines = lrcText.split('\n');
    const timeRegex = /\[(\d{2}):(\d{2}\.\d{2})\]/;

    lines.forEach(line => {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseFloat(match[2]);
            const time = minutes * 60 + seconds;
            const text = line.replace(timeRegex, '').trim();
            if (text) parsedLyrics.push({ time, text });
        }
    });
}

function toggleLyrics() {
    isLyricsVisible = !isLyricsVisible;
    const overlay = document.getElementById("lyricsOverlay");
    const btn = document.getElementById("lyricsBtn");
    
    if (isLyricsVisible) {
        overlay.style.display = "block";
        btn.classList.add("lyrics-active");
        renderLyrics();
    } else {
        overlay.style.display = "none";
        btn.classList.remove("lyrics-active");
    }
}

function renderLyrics() {
    const overlay = document.getElementById("lyricsOverlay");
    overlay.innerHTML = "";
    
    if (parsedLyrics.length === 0) {
        overlay.innerHTML = `<p style="color:gray; margin-top:150px;">No synced lyrics found for this track.</p>`;
        return;
    }

    parsedLyrics.forEach((line, i) => {
        overlay.innerHTML += `<div class="lyric-line" id="lyric-${i}">${line.text}</div>`;
    });
}

function updateSyncedLyrics() {
    if (!isLyricsVisible || parsedLyrics.length === 0) return;
    
    const currentTime = audio.currentTime;
    let activeIndex = -1;

    for (let i = 0; i < parsedLyrics.length; i++) {
        if (currentTime >= parsedLyrics[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== -1) {
        document.querySelectorAll(".lyric-line").forEach(el => el.classList.remove("active-lyric"));
        const activeEl = document.getElementById(`lyric-${activeIndex}`);
        if (activeEl && !activeEl.classList.contains("active-lyric")) {
            activeEl.classList.add("active-lyric");
            
            // Auto-scroll logic
            const overlay = document.getElementById("lyricsOverlay");
            overlay.scrollTo({
                top: activeEl.offsetTop - (overlay.clientHeight / 2) + 20,
                behavior: 'smooth'
            });
        }
    }
}

// ========================================================
// CUSTOM MODALS
// ========================================================
let confirmActionCallback = null;

function customAlert(message) {
    document.getElementById("customAlertMessage").innerText = message;
    document.getElementById("customAlertModal").style.display = "flex";
}

function closeCustomAlert() {
    document.getElementById("customAlertModal").style.display = "none";
}

function customConfirm(message, callback) {
    document.getElementById("customConfirmMessage").innerText = message;
    confirmActionCallback = callback;
    document.getElementById("customConfirmModal").style.display = "flex";
}

function closeCustomConfirm() {
    document.getElementById("customConfirmModal").style.display = "none";
    confirmActionCallback = null;
}

document.getElementById("customConfirmYesBtn").addEventListener("click", () => {
    if (confirmActionCallback) confirmActionCallback();
    closeCustomConfirm();
});

// ========================================================
// QUEUE BUILDING & RENDERING
// ========================================================
function generateHomeRecommendations() {
    let indices = songs.map((_, i) => i);
    indices.sort(() => 0.5 - Math.random());
    homeScreenIndices = indices.slice(0, 6);
}

function buildQueue(context) {
    currentPlaybackQueue = [];
    if (context === 'home') {
        currentPlaybackQueue = [...homeScreenIndices];
    } else if (context === 'recent') { // Support queueing from Recent tab
        currentPlaybackQueue = [...recentHistory];
    } else if (context === 'liked') {
        likedSongs.forEach(ls => {
            let idx = songs.findIndex(s => s.file === ls.file);
            if (idx > -1) currentPlaybackQueue.push(idx);
        });
    } else if (context === 'downloaded') {
        songs.forEach((s, idx) => {
            if (downloadedURLs.includes(s.file) || s.file.startsWith("local_")) currentPlaybackQueue.push(idx);
        });
    } else if (context === 'playlist') {
        const p = playlists.find(p => p.name === currentViewedPlaylist);
        if (p) {
            p.songs.forEach(f => {
                let idx = songs.findIndex(s => s.file === f);
                if (idx > -1) currentPlaybackQueue.push(idx);
            });
        }
    } else if (context === 'all') {
        currentPlaybackQueue = songs.map((s, i) => i);
    }
}

function refreshAllGrids() {
    loadSongs();
    renderLibrary();
    searchSongs();
    if(document.getElementById("playlistView").classList.contains("active")) {
        renderPlaylistView();
    }
}

function loadSongs() {
    // 1. Render Recommendations
    const recGrid = document.getElementById("songGrid");
    if (recGrid) {
        recGrid.innerHTML = "";
        homeScreenIndices.forEach((index) => {
            const song = songs[index];
            if (!song) return;
            const isLiked = likedSongs.some(s => s.file === song.file);
            const isPlaying = (currentSong === index);
            
            recGrid.innerHTML += `
            <div class="card ${isPlaying ? 'playing-card' : ''}" 
                 onclick="playSong(${index}, 'home')" 
                 oncontextmenu="openContextMenu(event, ${index})" 
                 ontouchstart="handleTouchStart(event, ${index})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
                ${isPlaying ? '<div class="playing-icon">▶ PLAYING</div>' : ''}
                <div class="like" onclick="toggleLike(event,${index})">${isLiked ? "💙" : "🤍"}</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>`;
        });
    }

    // 2. Render Recently Played
    const recentSection = document.getElementById("recentSection");
    const recentGrid = document.getElementById("recentGrid");
    
    if (recentGrid && recentHistory.length > 0) {
        recentSection.style.display = "block";
        recentGrid.innerHTML = "";
        
        recentHistory.forEach((index) => {
            const song = songs[index];
            if (!song) return;
            const isLiked = likedSongs.some(s => s.file === song.file);
            const isPlaying = (currentSong === index);
            
            recentGrid.innerHTML += `
            <div class="card ${isPlaying ? 'playing-card' : ''}" 
                 onclick="playSong(${index}, 'recent')" 
                 oncontextmenu="openContextMenu(event, ${index})" 
                 ontouchstart="handleTouchStart(event, ${index})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
                ${isPlaying ? '<div class="playing-icon">▶ PLAYING</div>' : ''}
                <div class="like" onclick="toggleLike(event,${index})">${isLiked ? "💙" : "🤍"}</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>`;
        });
    }
}

function renderLibrary() {
    const likedGrid = document.getElementById("likedSongsGrid");
    const downloadedGrid = document.getElementById("downloadedSongsGrid");
    const playlistsGrid = document.getElementById("playlistsGrid");

    if (playlistsGrid) {
        playlistsGrid.innerHTML = playlists.length ? "" : "<p style='color:gray; width:100%;'>No custom playlists yet.</p>";
        playlists.forEach((p) => {
            playlistsGrid.innerHTML += `
            <div class="card" onclick="openPlaylist(decodeURIComponent('${encodeURIComponent(p.name)}'))" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:120px; background:rgba(255,255,255,0.05); border:2px dashed rgba(255,255,255,0.2);">
                <div style="font-size: 30px; margin-bottom: 5px;">📁</div>
                <h3 style="color:white; text-align:center; font-size:14px; word-break: break-all;">${p.name}</h3>
                <p style="color:gray; font-size:11px; margin-top:5px;">${p.songs.length} songs</p>
            </div>`;
        });
    }

    if (likedGrid) {
        likedGrid.innerHTML = likedSongs.length ? "" : "<p style='color:gray'>No liked songs yet.</p>";
        likedSongs.forEach((song) => {
            const idx = songs.findIndex(s => s.file === song.file);
            const isPlaying = (currentSong === idx);
            likedGrid.innerHTML += `
            <div class="card ${isPlaying ? 'playing-card' : ''}" 
                 onclick="playSong(${idx}, 'liked')" 
                 oncontextmenu="openContextMenu(event, ${idx})"
                 ontouchstart="handleTouchStart(event, ${idx})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
                ${isPlaying ? '<div class="playing-icon">▶ PLAYING</div>' : ''}
                <div class="like" onclick="toggleLike(event,${idx})">💙</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
            </div>`;
        });
    }

    if (downloadedGrid) {
        const offline = songs.filter(s => downloadedURLs.includes(s.file) || s.file.startsWith("local_"));
        downloadedGrid.innerHTML = offline.length ? "" : "<p style='color:gray'>No downloaded songs yet.</p>";
        offline.forEach((song) => {
            const idx = songs.findIndex(s => s.file === song.file);
            const isLiked = likedSongs.some(ls => ls.file === song.file);
            const isPlaying = (currentSong === idx);
            downloadedGrid.innerHTML += `
            <div class="card ${isPlaying ? 'playing-card' : ''}" 
                 onclick="playSong(${idx}, 'downloaded')" 
                 oncontextmenu="openContextMenu(event, ${idx})"
                 ontouchstart="handleTouchStart(event, ${idx})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
                ${isPlaying ? '<div class="playing-icon">▶ PLAYING</div>' : ''}
                <div class="like" onclick="toggleLike(event,${idx})">${isLiked ? "💙" : "🤍"}</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
            </div>`;
        });
    }
}

// ========================================================
// PLAYLIST FOLDER LOGIC
// ========================================================
document.getElementById("newPlaylistName").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        createNewPlaylist();
    }
});

function createNewPlaylist() {
    const input = document.getElementById("newPlaylistName");
    const name = input.value.trim();
    if (!name) return;
    
    if (playlists.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return customAlert("A playlist with this name already exists!");
    }
    
    playlists.push({ name: name, songs: [] });
    localStorage.setItem('sky_playlists', JSON.stringify(playlists));
    input.value = "";
    refreshAllGrids();
}

function openPlaylist(name) {
    currentViewedPlaylist = name;
    showSection("playlistView");
    document.getElementById("playlistViewTitle").innerText = "📁 " + name;
    renderPlaylistView();
}

function renderPlaylistView() {
    const grid = document.getElementById("playlistSongsGrid");
    grid.innerHTML = "";
    
    const playlist = playlists.find(p => p.name === currentViewedPlaylist);
    if (!playlist || playlist.songs.length === 0) {
        grid.innerHTML = "<p style='color:gray'>This playlist is empty. Right click a song to add it here.</p>";
        return;
    }
    
    playlist.songs.forEach(fileUrl => {
        const idx = songs.findIndex(s => s.file === fileUrl);
        if (idx !== -1) {
            const song = songs[idx];
            const isLiked = likedSongs.some(ls => ls.file === song.file);
            const isPlaying = (currentSong === idx);
            grid.innerHTML += `
            <div class="card ${isPlaying ? 'playing-card' : ''}" 
                 onclick="playSong(${idx}, 'playlist')" 
                 oncontextmenu="openContextMenu(event, ${idx})"
                 ontouchstart="handleTouchStart(event, ${idx})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
                ${isPlaying ? '<div class="playing-icon">▶ PLAYING</div>' : ''}
                <div class="like" onclick="toggleLike(event,${idx})">${isLiked ? "💙" : "🤍"}</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>`;
        }
    });
}

function deleteCurrentPlaylist() {
    customConfirm(`Are you sure you want to delete the playlist "${currentViewedPlaylist}"?\n\nThe songs will not be deleted from your main library.`, () => {
        playlists = playlists.filter(p => p.name !== currentViewedPlaylist);
        localStorage.setItem('sky_playlists', JSON.stringify(playlists));
        showSection('library');
    });
}

function handleCmAddToPlaylist() {
    document.getElementById("contextMenu").style.display = "none";
    const list = document.getElementById("playlistSelectionList");
    
    if (playlists.length === 0) {
        list.innerHTML = "<p style='color:gray; font-size:14px; text-align:center;'>No playlists created yet. Go to the Library to create one.</p>";
    } else {
        list.innerHTML = "";
        playlists.forEach(p => {
            list.innerHTML += `<button onclick="addSongToPlaylist(decodeURIComponent('${encodeURIComponent(p.name)}'))" style="width:100%; text-align:left; justify-content:flex-start; margin-bottom:5px;">📁 ${p.name}</button>`;
        });
    }
    
    document.getElementById("addToPlaylistModal").style.display = "flex";
}

function closeAddToPlaylistModal() {
    document.getElementById("addToPlaylistModal").style.display = "none";
}

function addSongToPlaylist(playlistName) {
    const song = songs[activeContextIndex];
    const playlist = playlists.find(p => p.name === playlistName);
    
    if (playlist) {
        if (!playlist.songs.includes(song.file)) {
            playlist.songs.push(song.file);
            localStorage.setItem('sky_playlists', JSON.stringify(playlists));
            customAlert(`Added to ${playlistName}`);
        } else {
            customAlert(`Song is already in ${playlistName}`);
        }
    }
    
    closeAddToPlaylistModal();
    refreshAllGrids(); 
}

// ========================================================
// SEARCH LOGIC & LANGUAGE FILTERS
// ========================================================
function setSearchFilter(lang) {
    currentSearchFilter = lang;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if(btn.innerText === lang) btn.classList.add('active-filter');
        else btn.classList.remove('active-filter');
    });
    searchSongs(); 
}

function generateSearchRecommendations() {
    let indices = songs.map((_, i) => i);
    indices.sort(() => 0.5 - Math.random());
    searchScreenIndices = indices.slice(0, 12);
}

function showRandomSearchSuggestions() {
    const results = document.getElementById("searchResults");
    if (!results) return;
    results.innerHTML = "";

    if (searchScreenIndices.length === 0) {
        generateSearchRecommendations();
    }
    
    currentQueueContext = 'search';
    currentPlaybackQueue = [...searchScreenIndices];

    searchScreenIndices.forEach((index) => {
        const song = songs[index];
        if (!song) return;
        const isLiked = likedSongs.some(s => s.file === song.file);
        const isPlaying = (currentSong === index);
        
        results.innerHTML += `
        <div class="card ${isPlaying ? 'playing-card' : ''}" 
             onclick="playSong(${index}, 'search')" 
             oncontextmenu="openContextMenu(event, ${index})"
             ontouchstart="handleTouchStart(event, ${index})" 
             ontouchend="handleTouchEnd()" 
             ontouchmove="handleTouchEnd()">
            ${isPlaying ? '<div class="playing-icon">▶ PLAYING</div>' : ''}
            <div class="like" onclick="toggleLike(event,${index})">${isLiked ? "💙" : "🤍"}</div>
            <div class="cover" style="background-image:url('${song.cover}')"></div>
            <div class="title">${song.title}</div>
            <div class="artist">${song.artist}</div>
        </div>`;
    });
}

function searchSongs() {
    if (!document.getElementById("search").classList.contains("active")) return;
    let query = document.getElementById("searchInput").value.toLowerCase();
    
    if (query.trim() === "" && currentSearchFilter === 'All') {
        showRandomSearchSuggestions();
        return;
    }

    let results = document.getElementById("searchResults");
    results.innerHTML = "";
    
    let filteredIndices = [];
    
    songs.forEach((song, index) => {
        let matchesFilter = (currentSearchFilter === 'All') || (song.language === currentSearchFilter);
        
        let matchesQuery = song.title.toLowerCase().includes(query) || 
                           song.artist.toLowerCase().includes(query) || 
                           (song.language && song.language.toLowerCase().includes(query));
                           
        if (matchesFilter && matchesQuery) {
            filteredIndices.push(index);
        }
    });

    currentQueueContext = 'search';
    currentPlaybackQueue = [...filteredIndices];

    if (filteredIndices.length === 0) {
        results.innerHTML = `<p style="color:gray; width:100%;">No songs found for this filter/search.</p>`;
        return;
    }

    filteredIndices.forEach((index) => {
        const song = songs[index];
        const isLiked = likedSongs.some(s => s.file === song.file);
        const isPlaying = (currentSong === index);
        results.innerHTML += `
        <div class="card ${isPlaying ? 'playing-card' : ''}" 
             onclick="playSong(${index}, 'search')" 
             oncontextmenu="openContextMenu(event, ${index})"
             ontouchstart="handleTouchStart(event, ${index})" 
             ontouchend="handleTouchEnd()" 
             ontouchmove="handleTouchEnd()">
            ${isPlaying ? '<div class="playing-icon">▶ PLAYING</div>' : ''}
            <div class="like" onclick="toggleLike(event,${index})">${isLiked ? "💙" : "🤍"}</div>
            <div class="cover" style="background-image:url('${song.cover}')"></div>
            <div class="title">${song.title}</div>
            <div class="artist">${song.artist}</div>
        </div>`;
    });
}

// --- ACTIONS & HISTORY ---
async function playSong(index, context = null) {
    if (context) {
        currentQueueContext = context;
        if (context !== 'search') {
            buildQueue(context);
        }
    } else if (currentPlaybackQueue.length === 0) {
        buildQueue('all'); 
    }

    currentSong = index;
    const song = songs[index];

    // UPDATE RECENT HISTORY
    recentHistory = recentHistory.filter(i => i !== index);
    recentHistory.unshift(index);
    if (recentHistory.length > 10) recentHistory.pop();
    localStorage.setItem('sky_recent', JSON.stringify(recentHistory));

    // UI Updates
    refreshAllGrids(); 
    document.getElementById("player").style.display = "flex";
    document.getElementById("playerCover").src = song.cover;
    document.getElementById("playerTitle").innerText = "Loading...";
    document.getElementById("playerArtist").innerText = "";
    
    // Parse Lyrics if available
    if (song.lyrics) {
        parseLRC(song.lyrics);
        document.getElementById("lyricsBtn").style.display = "flex";
        if (isLyricsVisible) renderLyrics();
    } else {
        parsedLyrics = [];
        document.getElementById("lyricsBtn").style.display = "none";
        document.getElementById("lyricsOverlay").style.display = "none";
        isLyricsVisible = false;
        document.getElementById("lyricsBtn").classList.remove("lyrics-active");
    }
    
    const blob = await getOfflineSong(song.file);
    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    
    audio.src = blob ? (currentObjectURL = URL.createObjectURL(blob)) : song.file;
    audio.loop = isLooping;
    
    initAudioEQ(); 
    
    audio.play().then(() => {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        document.getElementById("playerTitle").innerText = song.title;
        document.getElementById("playerArtist").innerText = song.artist;
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist || 'SkyMusic',
                artwork: [{ src: song.cover, sizes: '512x512', type: 'image/jpeg' }]
            });

            navigator.mediaSession.setActionHandler('play', () => togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
            navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
        }
    }).catch(() => {
        document.getElementById("playerTitle").innerText = "⚠️ Error Playing";
    });
}

function toggleLike(e, index) {
    if (e) e.stopPropagation();
    const song = songs[index];
    const exists = likedSongs.findIndex(s => s.file === song.file);
    if (exists === -1) likedSongs.push(song);
    else likedSongs.splice(exists, 1);
    
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    refreshAllGrids();
}

function toggleLoop() {
    isLooping = !isLooping;
    audio.loop = isLooping;
    document.getElementById("loopBtn").classList.toggle("loop-active", isLooping);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById("shuffleBtn").classList.toggle("shuffle-active", isShuffle);
}

function nextSong() {
    if (currentPlaybackQueue.length === 0) return;
    let queueIdx = currentPlaybackQueue.indexOf(currentSong);
    if (queueIdx === -1) queueIdx = 0; 

    if (isShuffle) {
        let rand = Math.floor(Math.random() * currentPlaybackQueue.length);
        playSong(currentPlaybackQueue[rand]); 
    } else {
        let nextQueueIdx = (queueIdx + 1) % currentPlaybackQueue.length;
        playSong(currentPlaybackQueue[nextQueueIdx]);
    }
}

function prevSong() {
    if (currentPlaybackQueue.length === 0) return;
    let queueIdx = currentPlaybackQueue.indexOf(currentSong);
    if (queueIdx === -1) queueIdx = 0;

    if (isShuffle) {
        let rand = Math.floor(Math.random() * currentPlaybackQueue.length);
        playSong(currentPlaybackQueue[rand]);
    } else {
        let prevQueueIdx = (queueIdx - 1 + currentPlaybackQueue.length) % currentPlaybackQueue.length;
        playSong(currentPlaybackQueue[prevQueueIdx]);
    }
}

// ========================================================
// MOBILE DOWNLOAD LOGIC 
// ========================================================
async function triggerOfflineSave(url) {
    const toast = document.getElementById("downloadToast");
    const text = document.getElementById("toastText");
    const spinner = document.getElementById("toastSpinner");
    
    toast.classList.remove("hidden");
    spinner.style.display = "block";
    text.innerText = "Connecting...";

    const controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        let res;
        let fetchUrl = url;
        
        if (!url.includes("catbox.moe")) {
            fetchUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
        }

        res = await fetch(fetchUrl, { signal: controller.signal, mode: 'cors' }).catch(() => null);
        
        if (!res || !res.ok) {
            text.innerText = "Trying backup proxy...";
            let backupUrl = "https://corsproxy.io/?" + encodeURIComponent(url);
            res = await fetch(backupUrl, { signal: controller.signal });
        }

        if (!res || !res.ok) throw new Error("Blocked by server");

        spinner.style.display = "none";
        
        const contentLength = res.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        let blob;

        if (total && res.body) {
            const reader = res.body.getReader();
            let receivedLength = 0;
            let chunks = [];
            
            while(true) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => controller.abort(), 15000);

                const {done, value} = await reader.read();
                if (done) break;
                
                chunks.push(value);
                receivedLength += value.length;
                
                let percent = Math.floor((receivedLength / total) * 100);
                text.innerText = `Downloading... ${percent}%`;
            }
            
            let chunksAll = new Uint8Array(receivedLength);
            let position = 0;
            for(let chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
            }
            
            blob = new Blob([chunksAll], {type: res.headers.get('content-type') || 'audio/mpeg'});

        } else {
            text.innerText = "Downloading...";
            blob = await res.blob();
        }

        clearTimeout(timeoutId); 
        saveSongOffline(url, blob);
        
        text.innerText = "✅ Saved to Library!";
        setTimeout(() => toast.classList.add("hidden"), 2000);

    } catch (error) {
        clearTimeout(timeoutId);
        spinner.style.display = "none";
        
        if (error.name === 'AbortError') {
            text.innerText = "⏱️ Connection Timed Out";
        } else {
            text.innerText = "❌ Blocked or Failed";
        }
        
        setTimeout(() => toast.classList.add("hidden"), 3000);
    }
}

// --- CONTEXT MENU & MOBILE LONG PRESS ---
function handleTouchStart(e, index) {
    touchTimer = setTimeout(() => {
        openContextMenu(e, index);
    }, 600); 
}

function handleTouchEnd() {
    clearTimeout(touchTimer); 
}

function openContextMenu(e, index) {
    if (e.cancelable) e.preventDefault();
    activeContextIndex = index;
    const menu = document.getElementById("contextMenu");
    menu.style.display = "block";
    
    let x = e.type === 'touchstart' ? e.touches[0].pageX : e.pageX;
    let y = e.type === 'touchstart' ? e.touches[0].pageY : e.pageY;
    
    menu.style.left = x + "px";
    menu.style.top = y + "px";

    const song = songs[index];
    const isDownloaded = downloadedURLs.includes(song.file) || song.file.startsWith("local_");
    
    const dlBtn = document.getElementById("cmDownloadBtn");
    const rmDlBtn = document.getElementById("cmRemoveDownloadBtn");
    
    if (isDownloaded) {
        if(dlBtn) dlBtn.style.display = "none";
        if(rmDlBtn) rmDlBtn.style.display = "flex";
    } else {
        if(dlBtn) dlBtn.style.display = "flex";
        if(rmDlBtn) rmDlBtn.style.display = "none";
    }
}

document.addEventListener("click", () => {
    const menu = document.getElementById("contextMenu");
    if (menu) menu.style.display = "none";
});

function handleCmDownload() { triggerOfflineSave(songs[activeContextIndex].file); }

function handleCmRemoveDownload() {
    const song = songs[activeContextIndex];
    customConfirm("Remove this song from offline downloads?", () => {
        downloadedURLs = downloadedURLs.filter(url => url !== song.file);
        localStorage.setItem('downloadedURLs', JSON.stringify(downloadedURLs));
        
        const store = db.transaction(["offlineAudio"], "readwrite").objectStore("offlineAudio");
        store.delete(song.file);
        
        refreshAllGrids();
        document.getElementById("contextMenu").style.display = "none";
        customAlert("Removed from downloads.");
    });
}

function handleCmEdit() {
    const s = songs[activeContextIndex];
    document.getElementById("editTitleInput").value = s.title;
    document.getElementById("editArtistInput").value = s.artist;
    document.getElementById("editCoverInput").value = s.cover;
    document.getElementById("editModal").style.display = "flex";
}

function handleCmDelete() {
    customConfirm("Are you sure you want to delete this song permanently?\n(Note: Base library songs will return on refresh. To permanently delete base songs, remove them from songs.js)", () => {
        const song = songs[activeContextIndex];
        songs.splice(activeContextIndex, 1);
        likedSongs = likedSongs.filter(ls => ls.file !== song.file);
        downloadedURLs = downloadedURLs.filter(url => url !== song.file);
        recentHistory = recentHistory.filter(i => i !== activeContextIndex);
        
        playlists.forEach(p => {
            p.songs = p.songs.filter(f => f !== song.file);
        });
        
        localStorage.setItem('sky_songs_v4', JSON.stringify(songs));
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
        localStorage.setItem('downloadedURLs', JSON.stringify(downloadedURLs));
        localStorage.setItem('sky_playlists', JSON.stringify(playlists));
        localStorage.setItem('sky_recent', JSON.stringify(recentHistory));
        
        const store = db.transaction(["offlineAudio"], "readwrite").objectStore("offlineAudio");
        store.delete(song.file);
        
        refreshAllGrids();
    });
}

function saveEditedSong() {
    songs[activeContextIndex].title = document.getElementById("editTitleInput").value;
    songs[activeContextIndex].artist = document.getElementById("editArtistInput").value;
    songs[activeContextIndex].cover = document.getElementById("editCoverInput").value;
    localStorage.setItem('sky_songs_v4', JSON.stringify(songs));
    refreshAllGrids();
    closeEditModal();
}

// --- HELPERS ---
function addSong() {
    const name = document.getElementById("songName").value;
    const artist = document.getElementById("artistName").value || "Unknown";
    const cover = document.getElementById("coverURL").value || "https://picsum.photos/200";
    const url = document.getElementById("songURL").value;
    const lang = document.getElementById("songLanguage").value || "Other";
    const fileInput = document.getElementById("localAudio").files[0];

    if (!name) return customAlert("Please enter a song name.");

    let finalFile = url;
    if (fileInput) {
        finalFile = "local_" + Date.now();
        saveSongOffline(finalFile, fileInput);
    }

    songs.push({ title: name, artist: artist, cover: cover, file: finalFile, language: lang });
    localStorage.setItem('sky_songs_v4', JSON.stringify(songs));
    
    document.getElementById("songName").value = "";
    document.getElementById("artistName").value = "";
    document.getElementById("coverURL").value = "";
    document.getElementById("songURL").value = "";
    document.getElementById("songLanguage").value = "";
    document.getElementById("localAudio").value = "";
    
    refreshAllGrids();
    customAlert("Song successfully added!");
}

function toggleSidebar() {
    document.getElementById('appSidebar').classList.toggle('open');
    document.getElementById('mobileOverlay').classList.toggle('active');
}

function showSection(id) { 
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id !== "playlistView") {
        document.getElementById("pageTitle").innerText = id.charAt(0).toUpperCase() + id.slice(1);
    }
    
    let searchBar = document.getElementById("searchInput");
    if (id === "search") {
        searchBar.style.display = "block";
        searchBar.focus(); 
        
        if (searchBar.value.trim() === "" && currentSearchFilter === 'All') {
            generateSearchRecommendations();
            showRandomSearchSuggestions();
        } else {
            searchSongs();
        }
    } else {
        searchBar.style.display = "none";
        searchBar.value = ""; 
    }

    if (id === 'home') {
        generateHomeRecommendations();
    }

    if (id === 'library' || id === 'home') refreshAllGrids();

    if (window.innerWidth <= 768) {
        document.getElementById('appSidebar').classList.remove('open');
        document.getElementById('mobileOverlay').classList.remove('active');
    }
}

function togglePlay() { audio.paused ? audio.play() : audio.pause(); }
function closePlayer(event) { if(event) event.stopPropagation(); document.getElementById("player").style.display="none"; audio.pause(); }
function shrinkPlayer() { document.getElementById("player").classList.remove("fullscreen"); }
function expandPlayer() { document.getElementById("player").classList.add("fullscreen"); }
function closeEditModal() { document.getElementById("editModal").style.display="none"; }
function downloadCurrentSong() { triggerOfflineSave(songs[currentSong].file); }
function scrub(e) { 
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
}

document.getElementById('volumeSlider').addEventListener('input', (e) => {
    audio.volume = e.target.value;
});

// --- TIME FORMATTING & UI UPDATE ---
function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}

audio.addEventListener('loadedmetadata', () => {
    document.getElementById("duration").innerText = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
    const bar = document.getElementById("progressBar");
    if (bar && audio.duration) {
        bar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
        document.getElementById("currentTime").innerText = formatTime(audio.currentTime);
    }
    updateSyncedLyrics(); // NEW: Trigger lyrics update
});

audio.addEventListener('ended', nextSong);

audio.addEventListener('play', () => {
    const icon = document.getElementById("playPauseIcon");
    if (icon) icon.src = "https://files.catbox.moe/uklwfc.jpg"; 
    
    // NEW: Ensure visualizer resumes
    if (audioCtx && audioCtx.state === 'running') {
        cancelAnimationFrame(visualizerAnimation);
        drawVisualizer();
    }
});

audio.addEventListener('pause', () => {
    const icon = document.getElementById("playPauseIcon");
    if (icon) icon.src = "https://files.catbox.moe/p0hffa.jpg"; 
});

document.addEventListener("keydown", function(event) {
    let active = document.activeElement.tagName;
    if (active === "INPUT" || active === "TEXTAREA") return;
    
    if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
    } else if (event.code === "ArrowRight") {
        event.preventDefault();
        nextSong();
    } else if (event.code === "ArrowLeft") {
        event.preventDefault();
        prevSong();
    } else if (event.code === "ArrowUp") {
        event.preventDefault();
        audio.volume = Math.min(1, audio.volume + 0.1);
        document.getElementById('volumeSlider').value = audio.volume;
    } else if (event.code === "ArrowDown") {
        event.preventDefault();
        audio.volume = Math.max(0, audio.volume - 0.1);
        document.getElementById('volumeSlider').value = audio.volume;
    } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        audio.muted = !audio.muted;
    }
});

// ========================================================
// BACKUP & RESTORE DATA
// ========================================================
function exportBackup() {
    const data = {
        songs: JSON.parse(localStorage.getItem('sky_songs_v4')) || songs,
        liked: JSON.parse(localStorage.getItem('likedSongs')) || [],
        downloads: JSON.parse(localStorage.getItem('downloadedURLs')) || [],
        playlists: JSON.parse(localStorage.getItem('sky_playlists')) || [],
        recent: JSON.parse(localStorage.getItem('sky_recent')) || [] // Backup recent history
    };
    
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skymusic_backup.json";
    a.click();
    URL.revokeObjectURL(url);
    
    customAlert("Backup exported successfully!");
}

function importBackup() {
    const file = document.getElementById('backupFileInput').files[0];
    if (!file) return customAlert("Please select a backup file first.");
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if(data.songs) localStorage.setItem('sky_songs_v4', JSON.stringify(data.songs));
            if(data.liked) localStorage.setItem('likedSongs', JSON.stringify(data.liked));
            if(data.downloads) localStorage.setItem('downloadedURLs', JSON.stringify(data.downloads));
            if(data.playlists) localStorage.setItem('sky_playlists', JSON.stringify(data.playlists));
            if(data.recent) localStorage.setItem('sky_recent', JSON.stringify(data.recent));
            
            customAlert("Backup restored successfully! Refreshing app...");
            setTimeout(() => location.reload(), 1500);
            
        } catch(err) {
            customAlert("Invalid backup file.");
        }
    };
    reader.readAsText(file);
}

// Initialize App
generateHomeRecommendations();
generateSearchRecommendations();
loadSongs();
