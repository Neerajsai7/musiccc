// --- DATABASE (IndexedDB) ---
let db;
const request = indexedDB.open("SkyMusicDB", 1);
let downloadedURLs = JSON.parse(localStorage.getItem('downloadedURLs')) || [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
let playlists = JSON.parse(localStorage.getItem('sky_playlists')) || [];

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

// --- DATA & STATE ---
let songs = JSON.parse(localStorage.getItem('sky_songs_v2')) || [
    {title: "Kesariya (Hindi)", artist: "Brahmāstra", cover: "https://picsum.photos/200?random=1", file: "https://files.catbox.moe/mn42vj.mp3"},
    {title: "Boyfriend", artist: "Karan Aujla", cover: "https://picsum.photos/200?random=2", file: "https://files.catbox.moe/fcllvp.mp3"},
    {title: "Bulleya", artist: "Sultan", cover: "https://picsum.photos/200?random=3", file: "https://files.catbox.moe/195dty.mp3"},
    {title: "Tabaahi", artist: "Toxic", cover: "https://picsum.photos/200?random=4", file: "https://files.catbox.moe/m37ohm.mp3"},
    {title: "Rai Rai Raa Raa", artist: "Toxic", cover: "https://picsum.photos/200?random=5", file: "https://files.catbox.moe/no3t0i.mp3"},
    {title: "Chikiri Chikiri", artist: "Unknown", cover: "https://picsum.photos/200?random=6", file: "https://files.catbox.moe/y0df1k.mp3"},
    {title: "Aari Aari", artist: "Dhurandhar-2", cover: "https://picsum.photos/200?random=7", file: "https://files.catbox.moe/4a3svo.mp3"},
    {title: "MF Gabhru", artist: "Unknown", cover: "https://picsum.photos/200?random=8", file: "https://files.catbox.moe/bc3mcw.mp3"},
    {title: "You Are You Though", artist: "Karan Aujla", cover: "https://picsum.photos/200?random=9", file: "https://files.catbox.moe/hcselx.mp3"},
    {title: "I Really Do", artist: "Unknown", cover: "https://picsum.photos/200?random=10", file: "https://files.catbox.moe/hs231u.mp3"},
    {title: "For A Reason", artist: "Unknown", cover: "https://picsum.photos/200?random=11", file: "https://files.catbox.moe/eq7c5h.mp3"}
];

let audio = new Audio();
audio.crossOrigin = "anonymous"; 
let currentSong = -1; 
let isLooping = false;
let isShuffle = false; 
let currentObjectURL = null;
let activeContextIndex = -1;
let touchTimer = null; 
let currentViewedPlaylist = ""; 

// NEW: CONTEXTUAL PLAYBACK STATE
let currentPlaybackQueue = [];
let currentQueueContext = 'all';

// ========================================================
// AUDIO EQUALIZER LOGIC (Web Audio API)
// ========================================================
let audioCtx;
let sourceNode;
let lowFilter, midFilter, highFilter;

function initAudioEQ() {
    if (audioCtx) return; 
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaElementSource(audio);
    
    lowFilter = audioCtx.createBiquadFilter();
    lowFilter.type = "lowshelf";
    lowFilter.frequency.value = 250; 
    
    midFilter = audioCtx.createBiquadFilter();
    midFilter.type = "peaking";
    midFilter.frequency.value = 1000;
    midFilter.Q.value = 1;
    
    highFilter = audioCtx.createBiquadFilter();
    highFilter.type = "highshelf";
    highFilter.frequency.value = 4000;

    sourceNode.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(audioCtx.destination);
    
    updateEQ(); 
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
// NEW: Contextual Playback. Next/Prev stays within the folder you played from!
function buildQueue(context) {
    currentPlaybackQueue = [];
    if (context === 'home') {
        for (let i = 0; i < Math.min(6, songs.length); i++) currentPlaybackQueue.push(i);
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
    } else if (context === 'search') {
        let query = document.getElementById("searchInput").value.toLowerCase();
        songs.forEach((s, idx) => {
            if (s.title.toLowerCase().includes(query) || s.artist.toLowerCase().includes(query)) {
                currentPlaybackQueue.push(idx);
            }
        });
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
    const grid = document.getElementById("songGrid");
    if (!grid) return;
    grid.innerHTML = "";
    
    for (let index = 0; index < songs.length; index++) {
        if (index >= 6) break; 
        
        const song = songs[index];
        const isLiked = likedSongs.some(s => s.file === song.file);
        const isPlaying = (currentSong === index);
        
        grid.innerHTML += `
        <div class="card ${isPlaying ? 'playing-card' : ''}" 
             oncontextmenu="openContextMenu(event, ${index})" 
             ontouchstart="handleTouchStart(event, ${index})" 
             ontouchend="handleTouchEnd()" 
             ontouchmove="handleTouchEnd()">
            ${isPlaying ? '<div class="playing-icon">▶ PLAYING</div>' : ''}
            <div class="like" onclick="toggleLike(event,${index})">${isLiked ? "💙" : "🤍"}</div>
            <div onclick="playSong(${index}, 'home')">
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>
        </div>`;
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
// SEARCH LOGIC 
// ========================================================
function showRandomSearchSuggestions() {
    const results = document.getElementById("searchResults");
    if (!results) return;
    results.innerHTML = "";

    let shuffled = [...songs].sort(() => 0.5 - Math.random());
    let selected = shuffled.slice(0, 12); 
    
    // Set up queue context instantly for random suggestions
    currentQueueContext = 'random_search';
    currentPlaybackQueue = selected.map(s => songs.indexOf(s));

    selected.forEach((song) => {
        const index = songs.indexOf(song); 
        const isLiked = likedSongs.some(s => s.file === song.file);
        const isPlaying = (currentSong === index);
        
        results.innerHTML += `
        <div class="card ${isPlaying ? 'playing-card' : ''}" 
             onclick="playSong(${index}, 'random_search')" 
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
    
    if (query.trim() === "") {
        showRandomSearchSuggestions();
        return;
    }

    let results = document.getElementById("searchResults");
    results.innerHTML = "";
    
    songs.forEach((song, index) => {
        if (song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)) {
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
        }
    });
}

// --- ACTIONS ---
async function playSong(index, context = null) {
    // 1. Manage the playback queue context
    if (context) {
        currentQueueContext = context;
        if (context !== 'random_search') {
            buildQueue(context);
        }
    } else if (currentPlaybackQueue.length === 0) {
        buildQueue('all'); // Fail-safe
    }

    currentSong = index;
    refreshAllGrids(); 

    const song = songs[index];
    document.getElementById("player").style.display = "flex";
    document.getElementById("playerCover").src = song.cover;
    document.getElementById("playerTitle").innerText = "Loading...";
    document.getElementById("playerArtist").innerText = "";
    
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

// Context-aware Next and Previous
function nextSong() {
    if (currentPlaybackQueue.length === 0) return;
    let queueIdx = currentPlaybackQueue.indexOf(currentSong);
    if (queueIdx === -1) queueIdx = 0; 

    if (isShuffle) {
        let rand = Math.floor(Math.random() * currentPlaybackQueue.length);
        playSong(currentPlaybackQueue[rand]); // Continues using same queue
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
// MOBILE DOWNLOAD LOGIC (WITH REAL-TIME PERCENTAGE)
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

    // Toggle Download vs Remove Download based on status
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

// NEW: REMOVE DOWNLOAD FUNCTION
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
    customConfirm("Are you sure you want to delete this song permanently?", () => {
        const song = songs[activeContextIndex];
        songs.splice(activeContextIndex, 1);
        likedSongs = likedSongs.filter(ls => ls.file !== song.file);
        downloadedURLs = downloadedURLs.filter(url => url !== song.file);
        
        playlists.forEach(p => {
            p.songs = p.songs.filter(f => f !== song.file);
        });
        
        localStorage.setItem('sky_songs_v2', JSON.stringify(songs));
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
        localStorage.setItem('downloadedURLs', JSON.stringify(downloadedURLs));
        localStorage.setItem('sky_playlists', JSON.stringify(playlists));
        
        const store = db.transaction(["offlineAudio"], "readwrite").objectStore("offlineAudio");
        store.delete(song.file);
        
        refreshAllGrids();
    });
}

function saveEditedSong() {
    songs[activeContextIndex].title = document.getElementById("editTitleInput").value;
    songs[activeContextIndex].artist = document.getElementById("editArtistInput").value;
    songs[activeContextIndex].cover = document.getElementById("editCoverInput").value;
    localStorage.setItem('sky_songs_v2', JSON.stringify(songs));
    refreshAllGrids();
    closeEditModal();
}

// --- HELPERS ---
function addSong() {
    const name = document.getElementById("songName").value;
    const artist = document.getElementById("artistName").value || "Unknown";
    const cover = document.getElementById("coverURL").value || "https://picsum.photos/200";
    const url = document.getElementById("songURL").value;
    const fileInput = document.getElementById("localAudio").files[0];

    if (!name) return customAlert("Please enter a song name.");

    let finalFile = url;
    if (fileInput) {
        finalFile = "local_" + Date.now();
        saveSongOffline(finalFile, fileInput);
    }

    songs.push({ title: name, artist: artist, cover: cover, file: finalFile });
    localStorage.setItem('sky_songs_v2', JSON.stringify(songs));
    
    document.getElementById("songName").value = "";
    document.getElementById("artistName").value = "";
    document.getElementById("coverURL").value = "";
    document.getElementById("songURL").value = "";
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
        
        if (searchBar.value.trim() === "") {
            showRandomSearchSuggestions();
        }
    } else {
        searchBar.style.display = "none";
        searchBar.value = ""; 
    }

    if (id === 'library') renderLibrary();

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
});

audio.addEventListener('ended', nextSong);

audio.addEventListener('play', () => {
    const icon = document.getElementById("playPauseIcon");
    if (icon) icon.src = "https://files.catbox.moe/p0hffa.jpg"; 
});

audio.addEventListener('pause', () => {
    const icon = document.getElementById("playPauseIcon");
    if (icon) icon.src = "https://files.catbox.moe/uklwfc.jpg"; 
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
        songs: JSON.parse(localStorage.getItem('sky_songs_v2')) || songs,
        liked: JSON.parse(localStorage.getItem('likedSongs')) || [],
        downloads: JSON.parse(localStorage.getItem('downloadedURLs')) || [],
        playlists: JSON.parse(localStorage.getItem('sky_playlists')) || []
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
            
            if(data.songs) localStorage.setItem('sky_songs_v2', JSON.stringify(data.songs));
            if(data.liked) localStorage.setItem('likedSongs', JSON.stringify(data.liked));
            if(data.downloads) localStorage.setItem('downloadedURLs', JSON.stringify(data.downloads));
            if(data.playlists) localStorage.setItem('sky_playlists', JSON.stringify(data.playlists));
            
            customAlert("Backup restored successfully! Refreshing app...");
            setTimeout(() => location.reload(), 1500);
            
        } catch(err) {
            customAlert("Invalid backup file.");
        }
    };
    reader.readAsText(file);
}

// Initialize App
loadSongs();
