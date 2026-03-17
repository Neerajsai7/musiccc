// --- DATABASE (IndexedDB) ---
let db;
const request = indexedDB.open("SkyMusicDB", 1);
let downloadedURLs = JSON.parse(localStorage.getItem('downloadedURLs')) || [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];
// NEW: Playlists State Array
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
            renderLibrary();
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
let currentSong = 0;
let isLooping = false;
let currentObjectURL = null;
let activeContextIndex = -1;
let touchTimer = null; 
let currentViewedPlaylist = ""; // Tracks which playlist folder is currently open

// --- RENDERING ---
function loadSongs() {
    const grid = document.getElementById("songGrid");
    if (!grid) return;
    grid.innerHTML = "";
    
    for (let index = 0; index < songs.length; index++) {
        if (index >= 6) break; 
        
        const song = songs[index];
        const isLiked = likedSongs.some(s => s.file === song.file);
        
        grid.innerHTML += `
        <div class="card" 
             oncontextmenu="openContextMenu(event, ${index})" 
             ontouchstart="handleTouchStart(event, ${index})" 
             ontouchend="handleTouchEnd()" 
             ontouchmove="handleTouchEnd()">
            <div class="like" onclick="toggleLike(event,${index})">${isLiked ? "💙" : "🤍"}</div>
            <div onclick="playSong(${index})">
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

    // 1. Render Playlists
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

    // 2. Render Liked Songs
    if (likedGrid) {
        likedGrid.innerHTML = likedSongs.length ? "" : "<p style='color:gray'>No liked songs yet.</p>";
        likedSongs.forEach((song) => {
            const idx = songs.findIndex(s => s.file === song.file);
            likedGrid.innerHTML += `
            <div class="card" 
                 onclick="playSong(${idx})" 
                 oncontextmenu="openContextMenu(event, ${idx})"
                 ontouchstart="handleTouchStart(event, ${idx})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
                <div class="like" onclick="toggleLike(event,${idx})">💙</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
            </div>`;
        });
    }

    // 3. Render Downloaded Songs
    if (downloadedGrid) {
        const offline = songs.filter(s => downloadedURLs.includes(s.file) || s.file.startsWith("local_"));
        downloadedGrid.innerHTML = offline.length ? "" : "<p style='color:gray'>No downloaded songs yet.</p>";
        offline.forEach((song) => {
            const idx = songs.findIndex(s => s.file === song.file);
            const isLiked = likedSongs.some(ls => ls.file === song.file);
            downloadedGrid.innerHTML += `
            <div class="card" 
                 onclick="playSong(${idx})" 
                 oncontextmenu="openContextMenu(event, ${idx})"
                 ontouchstart="handleTouchStart(event, ${idx})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
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
function createNewPlaylist() {
    const input = document.getElementById("newPlaylistName");
    const name = input.value.trim();
    if (!name) return;
    
    if (playlists.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return alert("A playlist with this name already exists!");
    }
    
    playlists.push({ name: name, songs: [] });
    localStorage.setItem('sky_playlists', JSON.stringify(playlists));
    input.value = "";
    renderLibrary();
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
            grid.innerHTML += `
            <div class="card" 
                 onclick="playSong(${idx})" 
                 oncontextmenu="openContextMenu(event, ${idx})"
                 ontouchstart="handleTouchStart(event, ${idx})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
                <div class="like" onclick="toggleLike(event,${idx})">${isLiked ? "💙" : "🤍"}</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>`;
        }
    });
}

function deleteCurrentPlaylist() {
    if (confirm(`Are you sure you want to delete the playlist "${currentViewedPlaylist}"? The songs will not be deleted from your main library.`)) {
        playlists = playlists.filter(p => p.name !== currentViewedPlaylist);
        localStorage.setItem('sky_playlists', JSON.stringify(playlists));
        showSection('library');
    }
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
            alert(`Added to ${playlistName}`);
        } else {
            alert(`Song is already in ${playlistName}`);
        }
    }
    
    closeAddToPlaylistModal();
    
    // Refresh playlist view if we are currently looking at it
    if (document.getElementById("playlistView").classList.contains("active") && currentViewedPlaylist === playlistName) {
        renderPlaylistView();
    }
    renderLibrary(); // Update song counts on folders
}

// --- SEARCH ---
function searchSongs() {
    if (!document.getElementById("search").classList.contains("active")) return;
    let query = document.getElementById("searchInput").value.toLowerCase();
    let results = document.getElementById("searchResults");
    results.innerHTML = "";
    
    songs.forEach((song, index) => {
        if (song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)) {
            const isLiked = likedSongs.some(s => s.file === song.file);
            results.innerHTML += `
            <div class="card" 
                 onclick="playSong(${index})" 
                 oncontextmenu="openContextMenu(event, ${index})"
                 ontouchstart="handleTouchStart(event, ${index})" 
                 ontouchend="handleTouchEnd()" 
                 ontouchmove="handleTouchEnd()">
                <div class="like" onclick="toggleLike(event,${index})">${isLiked ? "💙" : "🤍"}</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>`;
        }
    });
}

// --- ACTIONS ---
async function playSong(index) {
    currentSong = index;
    const song = songs[index];
    document.getElementById("player").style.display = "flex";
    document.getElementById("playerCover").src = song.cover;
    document.getElementById("playerTitle").innerText = "Loading...";
    document.getElementById("playerArtist").innerText = "";
    
    const blob = await getOfflineSong(song.file);
    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    
    audio.src = blob ? (currentObjectURL = URL.createObjectURL(blob)) : song.file;
    audio.loop = isLooping;
    audio.play().then(() => {
        document.getElementById("playerTitle").innerText = song.title;
        document.getElementById("playerArtist").innerText = song.artist;
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
    loadSongs();
    renderLibrary();
    if(document.getElementById("playlistView").classList.contains("active")) renderPlaylistView();
    searchSongs();
}

function toggleLoop() {
    isLooping = !isLooping;
    audio.loop = isLooping;
    document.getElementById("loopBtn").classList.toggle("loop-active", isLooping);
}

// --- DOWNLOAD LOGIC ---
async function triggerOfflineSave(url) {
    const toast = document.getElementById("downloadToast");
    const text = document.getElementById("toastText");
    const spinner = document.getElementById("toastSpinner");
    
    toast.classList.remove("hidden");
    text.innerText = "Downloading...";
    spinner.style.display = "block";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

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

        clearTimeout(timeoutId); 
        if (!res || !res.ok) throw new Error("Blocked by server");

        const blob = await res.blob();
        saveSongOffline(url, blob);
        
        spinner.style.display = "none";
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
}

document.addEventListener("click", () => {
    const menu = document.getElementById("contextMenu");
    if (menu) menu.style.display = "none";
});

function handleCmDownload() { triggerOfflineSave(songs[activeContextIndex].file); }

function handleCmEdit() {
    const s = songs[activeContextIndex];
    document.getElementById("editTitleInput").value = s.title;
    document.getElementById("editArtistInput").value = s.artist;
    document.getElementById("editCoverInput").value = s.cover;
    document.getElementById("editModal").style.display = "flex";
}

function handleCmDelete() {
    if (confirm("Delete this song permanently?")) {
        const song = songs[activeContextIndex];
        songs.splice(activeContextIndex, 1);
        likedSongs = likedSongs.filter(ls => ls.file !== song.file);
        downloadedURLs = downloadedURLs.filter(url => url !== song.file);
        
        // Remove from all playlists too
        playlists.forEach(p => {
            p.songs = p.songs.filter(f => f !== song.file);
        });
        
        localStorage.setItem('sky_songs_v2', JSON.stringify(songs));
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
        localStorage.setItem('downloadedURLs', JSON.stringify(downloadedURLs));
        localStorage.setItem('sky_playlists', JSON.stringify(playlists));
        
        const store = db.transaction(["offlineAudio"], "readwrite").objectStore("offlineAudio");
        store.delete(song.file);
        
        loadSongs();
        renderLibrary();
        if(document.getElementById("playlistView").classList.contains("active")) renderPlaylistView();
        searchSongs();
    }
}

function saveEditedSong() {
    songs[activeContextIndex].title = document.getElementById("editTitleInput").value;
    songs[activeContextIndex].artist = document.getElementById("editArtistInput").value;
    songs[activeContextIndex].cover = document.getElementById("editCoverInput").value;
    localStorage.setItem('sky_songs_v2', JSON.stringify(songs));
    loadSongs();
    renderLibrary();
    if(document.getElementById("playlistView").classList.contains("active")) renderPlaylistView();
    searchSongs();
    closeEditModal();
}

// --- HELPERS ---
function addSong() {
    const name = document.getElementById("songName").value;
    const artist = document.getElementById("artistName").value || "Unknown";
    const cover = document.getElementById("coverURL").value || "https://picsum.photos/200";
    const url = document.getElementById("songURL").value;
    const fileInput = document.getElementById("localAudio").files[0];

    if (!name) return alert("Name required");

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
    
    loadSongs();
    alert("Song added!");
}

function showSection(id) { 
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Custom Title Logic for Playlists
    if (id !== "playlistView") {
        document.getElementById("pageTitle").innerText = id.charAt(0).toUpperCase() + id.slice(1);
    }
    
    let searchBar = document.getElementById("searchInput");
    if (id === "search") {
        searchBar.style.display = "block";
        searchBar.focus(); 
    } else {
        searchBar.style.display = "none";
        searchBar.value = ""; 
    }

    if (id === 'library') renderLibrary();
}

function togglePlay() { audio.paused ? audio.play() : audio.pause(); }
function nextSong() { playSong((currentSong + 1) % songs.length); }
function prevSong() { playSong((currentSong - 1 + songs.length) % songs.length); }
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

// --- DYNAMIC PLAY/PAUSE ICON UPDATE ---
audio.addEventListener('play', () => {
    const icon = document.getElementById("playPauseIcon");
    if (icon) icon.src = "https://files.catbox.moe/uklwfc.jpg"; // Pause
});

audio.addEventListener('pause', () => {
    const icon = document.getElementById("playPauseIcon");
    if (icon) icon.src = "https://files.catbox.moe/p0hffa.jpg"; // Play
});

// --- KEYBOARD CONTROLS ---
document.addEventListener("keydown", function(event) {
    let active = document.activeElement.tagName;
    if (active === "INPUT" || active === "TEXTAREA") return;
    
    if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
    }
});

// Initialize App
loadSongs();
