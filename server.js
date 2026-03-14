// --- DATABASE (IndexedDB) FOR OFFLINE STORAGE ---
let db;
const request = indexedDB.open("SkyMusicDB", 1);
let downloadedURLs = JSON.parse(localStorage.getItem('downloadedURLs')) || [];

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("offlineAudio")) db.createObjectStore("offlineAudio");
};
request.onsuccess = (e) => db = e.target.result;

function saveSongOffline(url, blob, silent = false) {
    const transaction = db.transaction(["offlineAudio"], "readwrite");
    const store = transaction.objectStore("offlineAudio");
    store.put(blob, url);
    transaction.oncomplete = () => {
        if (!downloadedURLs.includes(url)) {
            downloadedURLs.push(url);
            localStorage.setItem('downloadedURLs', JSON.stringify(downloadedURLs));
            renderLibrary();
        }
        if (!silent) alert("Saved offline!");
    };
}

function getOfflineSong(url) {
    return new Promise((resolve) => {
        if (!db) return resolve(null);
        const request = db.transaction(["offlineAudio"], "readonly").objectStore("offlineAudio").get(url);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
    });
}

// --- DATA AND STATE ---
let songs = JSON.parse(localStorage.getItem('songs')) || [
    {title:"Dream Waves",artist:"Sky Artist",cover:"https://picsum.photos/200?1",file:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"},
    {title:"Cloud Drift",artist:"BlueTone",cover:"https://picsum.photos/200?2",file:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"}
];
let likedSongs = [];
let audio = new Audio();
let currentSong = 0;
let isLooping = false;
let currentObjectURL = null;

// --- UI RENDERING ---
function loadSongs() {
    let grid = document.getElementById("songGrid");
    grid.innerHTML = "";
    songs.forEach((song, index) => {
        let liked = likedSongs.includes(song);
        grid.innerHTML += `
        <div class="card" onclick="playSong(${index})" oncontextmenu="openContextMenu(event, ${index})">
            <div class="like" onclick="toggleLike(event,${index})">${liked ? "💙" : "🤍"}</div>
            <div class="cover" style="background-image:url('${song.cover}')"></div>
            <div class="title">${song.title}</div>
            <div class="artist">${song.artist}</div>
        </div>`;
    });
}
loadSongs();

async function playSong(index) {
    currentSong = index;
    let song = songs[index];
    document.getElementById("player").style.display = "flex";
    document.getElementById("playerCover").src = song.cover;
    document.getElementById("playerTitle").innerText = "Loading...";
    
    let offlineBlob = await getOfflineSong(song.file);
    if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
    
    audio.src = offlineBlob ? (currentObjectURL = URL.createObjectURL(offlineBlob)) : song.file;
    audio.loop = isLooping;
    audio.play().then(() => {
        document.getElementById("playerTitle").innerText = song.title;
        document.getElementById("playerArtist").innerText = song.artist;
    }).catch(() => {
        document.getElementById("playerTitle").innerText = "⚠️ Error Playing";
    });
}

// --- DOWNLOAD LOGIC (CATBOX OPTIMIZED) ---
async function triggerOfflineSave(url) {
    const toast = document.getElementById("downloadToast");
    const toastText = document.getElementById("toastText");
    const spinner = document.getElementById("toastSpinner");

    try {
        toast.classList.remove("hidden");
        toastText.innerText = "Connecting...";
        
        // Try direct fetch first (works for Catbox often)
        let response = await fetch(url).catch(() => null);
        
        if (!response || !response.ok) {
            toastText.innerText = "Using Proxy...";
            let proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
            response = await fetch(proxyUrl);
        }

        if (!response.ok) throw new Error("Blocked");

        const blob = await response.blob();
        saveSongOffline(url, blob, true);
        
        spinner.style.display = "none";
        toastText.innerText = "✅ Done!";
        setTimeout(() => toast.classList.add("hidden"), 2000);

    } catch (error) {
        spinner.style.display = "none";
        toastText.innerText = "❌ Blocked. Opening Link...";
        // FALLBACK: Open link in new tab so user can manually download
        setTimeout(() => {
            toast.classList.add("hidden");
            window.open(url, '_blank');
        }, 2000);
    }
}

// --- CONTEXT MENU & EDIT ---
let activeContextIndex = -1;
function openContextMenu(event, index) {
    event.preventDefault();
    activeContextIndex = index;
    let menu = document.getElementById("contextMenu");
    menu.style.display = "block";
    menu.style.left = event.pageX + "px";
    menu.style.top = event.pageY + "px";
}
document.addEventListener("click", () => document.getElementById("contextMenu").style.display = "none");

function handleCmEdit() {
    let song = songs[activeContextIndex];
    document.getElementById("editTitleInput").value = song.title;
    document.getElementById("editArtistInput").value = song.artist;
    document.getElementById("editCoverInput").value = song.cover;
    document.getElementById("editModal").style.display = "flex";
}

function saveEditedSong() {
    songs[activeContextIndex].title = document.getElementById("editTitleInput").value;
    songs[activeContextIndex].artist = document.getElementById("editArtistInput").value;
    songs[activeContextIndex].cover = document.getElementById("editCoverInput").value;
    localStorage.setItem('songs', JSON.stringify(songs));
    loadSongs();
    document.getElementById("editModal").style.display = "none";
}

// Helper functions (required)
function togglePlay() { audio.paused ? audio.play() : audio.pause(); }
function nextSong() { playSong((currentSong + 1) % songs.length); }
function prevSong() { playSong((currentSong - 1 + songs.length) % songs.length); }
function formatTime(s) { return Math.floor(s/60) + ":" + String(Math.floor(s%60)).padStart(2,'0'); }
function showSection(id) { 
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'library') renderLibrary();
}
function closePlayer() { document.getElementById("player").style.display="none"; audio.pause(); }
function shrinkPlayer() { document.getElementById("player").classList.remove("fullscreen"); }
function expandPlayer() { document.getElementById("player").classList.add("fullscreen"); }
function handleCmDownload() { triggerOfflineSave(songs[activeContextIndex].file); }
function closeEditModal() { document.getElementById("editModal").style.display="none"; }

audio.addEventListener('timeupdate', () => {
    document.getElementById("progressBar").style.width = (audio.currentTime/audio.duration)*100 + "%";
});
