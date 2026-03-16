// --- DATABASE (IndexedDB) ---
let db;
const request = indexedDB.open("SkyMusicDB", 1);
let downloadedURLs = JSON.parse(localStorage.getItem('downloadedURLs')) || [];
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || [];

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
let songs = JSON.parse(localStorage.getItem('songs')) || [
    {title:"Dream Waves",artist:"Sky Artist",cover:"https://picsum.photos/200?1",file:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
    {title:"Cloud Drift",artist:"BlueTone",cover:"https://picsum.photos/200?2",file:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"}
];

let audio = new Audio();
let currentSong = 0;
let isLooping = false;
let currentObjectURL = null;
let activeContextIndex = -1;
let touchTimer = null; 

// --- RENDERING ---
function loadSongs() {
    const grid = document.getElementById("songGrid");
    if (!grid) return;
    grid.innerHTML = "";
    songs.forEach((song, index) => {
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
    });
}

function renderLibrary() {
    const likedGrid = document.getElementById("likedSongsGrid");
    const downloadedGrid = document.getElementById("downloadedSongsGrid");

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
    searchSongs();
}

function toggleLoop() {
    isLooping = !isLooping;
    audio.loop = isLooping;
    document.getElementById("loopBtn").classList.toggle("loop-active", isLooping);
}

// ========================================================
// MOBILE & PC DOWNLOAD LOGIC
// ========================================================
async function triggerOfflineSave(url) {
    const toast = document.getElementById("downloadToast");
    const text = document.getElementById("toastText");
    const spinner = document.getElementById("toastSpinner");
    
    toast.classList.remove("hidden");
    text.innerText = "Downloading...";
    spinner.style.display = "block";

    try {
        let res;
        
        // Step 1: Try Direct fetch first (Best for Catbox)
        res = await fetch(url).catch(() => null);
        
        // Step 2: Try Proxy 1 (AllOrigins) if direct fails
        if (!res || !res.ok) {
            text.innerText = "Using Proxy 1...";
            res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url)).catch(() => null);
        }
        
        // Step 3: Try Proxy 2 (Corsproxy) if proxy 1 fails
        if (!res || !res.ok) {
            text.innerText = "Using Proxy 2...";
            res = await fetch("https://corsproxy.io/?" + encodeURIComponent(url)).catch(() => null);
        }

        // If all 3 fail, throw error
        if (!res || !res.ok) throw new Error("Blocked by server");

        const blob = await res.blob();
        saveSongOffline(url, blob);
        
        spinner.style.display = "none";
        text.innerText = "✅ Saved to Library!";
        setTimeout(() => toast.classList.add("hidden"), 2000);

    } catch (error) {
        spinner.style.display = "none";
        text.innerText = "❌ Blocked. Try Uploading.";
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
        
        localStorage.setItem('songs', JSON.stringify(songs));
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
        localStorage.setItem('downloadedURLs', JSON.stringify(downloadedURLs));
        
        const store = db.transaction(["offlineAudio"], "readwrite").objectStore("offlineAudio");
        store.delete(song.file);
        
        loadSongs();
        renderLibrary();
        searchSongs();
    }
}

function saveEditedSong() {
    songs[activeContextIndex].title = document.getElementById("editTitleInput").value;
    songs[activeContextIndex].artist = document.getElementById("editArtistInput").value;
    songs[activeContextIndex].cover = document.getElementById("editCoverInput").value;
    localStorage.setItem('songs', JSON.stringify(songs));
    loadSongs();
    renderLibrary();
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
    localStorage.setItem('songs', JSON.stringify(songs));
    
    // Clear inputs after adding
    document.getElementById("songName").value = "";
    document.getElementById("artistName").value = "";
    document.getElementById("coverURL").value = "";
    document.getElementById("songURL").value = "";
    document.getElementById("localAudio").value = "";
    
    loadSongs();
    alert("Song added!");
}

function showSection(id) { 
    // Hide all sections, show the clicked one
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Change the Header Title
    document.getElementById("pageTitle").innerText = id.charAt(0).toUpperCase() + id.slice(1);
    
    // Show or Hide the Search Bar
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

audio.addEventListener('timeupdate', () => {
    const bar = document.getElementById("progressBar");
    if (bar && audio.duration) bar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
});

// ========================================================
// KEYBOARD CONTROLS (RESTORED SPACEBAR PLAY/PAUSE)
// ========================================================
document.addEventListener("keydown", function(event) {
    let active = document.activeElement.tagName;
    // Don't trigger if typing in search bar or add song inputs
    if (active === "INPUT" || active === "TEXTAREA") return;
    
    if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
    }
});

// Initialize App
loadSongs();
