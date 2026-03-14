// --- DATABASE (IndexedDB) FOR OFFLINE STORAGE ---
let db;
const request = indexedDB.open("SkyMusicDB", 1);

let downloadedURLs = JSON.parse(localStorage.getItem('downloadedURLs')) || [];

request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("offlineAudio")) {
        db.createObjectStore("offlineAudio"); 
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
};

request.onerror = function(event) {
    console.error("Database error: " + event.target.errorCode);
};

// Updated to remove the default alert entirely
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
        // If it's a local file upload from the "Add" tab, alert them it worked.
        // Otherwise, let the Toast animation handle the success message!
        if (!silent) alert("Song saved offline successfully! Find it in your Library.");
    };
    transaction.onerror = () => {
        if (!silent) alert("Failed to save song to database.");
    };
}

function getOfflineSong(url) {
    return new Promise((resolve, reject) => {
        if (!db) return resolve(null);
        const transaction = db.transaction(["offlineAudio"], "readonly");
        const store = transaction.objectStore("offlineAudio");
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
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

// --- INITIAL LOAD ---
function loadSongs() {
    let grid = document.getElementById("songGrid");
    grid.innerHTML = "";
    songs.forEach((song, index) => {
        let liked = likedSongs.includes(song);
        grid.innerHTML += `
        <div class="card" onclick="playSong(${index})" oncontextmenu="openContextMenu(event, ${index})">
            <div class="like" onclick="toggleLike(event,${index})">${liked ? "💙" : "🤍"}</div>
            <div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>
        </div>`;
    });
}
loadSongs();

// --- PLAYER EXPAND/SHRINK ---
function expandPlayer() { document.getElementById("player").classList.add("fullscreen"); }
function shrinkPlayer(event) { document.getElementById("player").classList.remove("fullscreen"); if(event) event.stopPropagation(); }

// --- AUDIO PLAYBACK ---
async function playSong(index) {
    currentSong = index;
    let song = songs[index];
    let audioSource = song.file;

    document.getElementById("player").style.display = "flex";
    document.getElementById("playerCover").src = song.cover;
    document.getElementById("playerTitle").innerText = "Loading..."; 
    document.getElementById("playerArtist").innerText = "Buffering audio...";

    let offlineBlob = await getOfflineSong(song.file);
    
    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
        currentObjectURL = null;
    }

    if (offlineBlob) {
        currentObjectURL = URL.createObjectURL(offlineBlob);
        audioSource = currentObjectURL;
    }

    audio.src = audioSource;
    audio.loop = isLooping; 
    
    audio.play().then(() => {
        document.getElementById("playerTitle").innerText = song.title;
        document.getElementById("playerArtist").innerText = song.artist;
    }).catch((error) => {
        console.error("Playback failed:", error);
        document.getElementById("playerTitle").innerText = "⚠️ Error playing song";
        document.getElementById("playerArtist").innerText = "Link might be broken or slow";
    });

    audio.addEventListener('loadedmetadata', () => {
        document.getElementById("duration").innerText = formatTime(audio.duration);
    }, {once: true}); 
}

function togglePlay(event) {
    if(event) event.stopPropagation();
    if (audio.paused) audio.play();
    else audio.pause();
}

function nextSong(event) {
    if(event) event.stopPropagation();
    currentSong = (currentSong + 1) % songs.length;
    playSong(currentSong);
}

function prevSong(event) {
    if(event) event.stopPropagation();
    currentSong = (currentSong - 1 + songs.length) % songs.length;
    playSong(currentSong);
}

function toggleLoop(event) {
    if(event) event.stopPropagation();
    isLooping = !isLooping;
    audio.loop = isLooping; 
    
    let loopBtn = document.getElementById("loopBtn");
    if (isLooping) loopBtn.classList.add("loop-active"); 
    else loopBtn.classList.remove("loop-active");
}

// --- LIBRARY, LIKES, AND OFFLINE DOWNLOADS ---
function toggleLike(event, index) {
    event.stopPropagation();
    let song = songs[index];
    let pos = likedSongs.indexOf(song);
    
    if (pos === -1) likedSongs.push(song); 
    else likedSongs.splice(pos, 1); 
    
    renderLibrary();
    loadSongs(); 
}

function renderLibrary() {
    let likedGrid = document.getElementById("likedSongsGrid");
    let downloadedGrid = document.getElementById("downloadedSongsGrid");
    
    likedGrid.innerHTML = "";
    downloadedGrid.innerHTML = "";
    
    if (likedSongs.length === 0) {
        likedGrid.innerHTML = "<p style='color:#e2e8f0; grid-column: 1 / -1; font-size:14px;'>No liked songs yet.</p>";
    } else {
        likedSongs.forEach(song => {
            let index = songs.indexOf(song);
            let isDownloaded = downloadedURLs.includes(song.file) || song.file.startsWith("local_");
            let downloadBtnHTML = isDownloaded ? "" : `<div class="download-icon" title="Save to App for Offline" onclick="downloadSongFile(event, '${song.file}')">⬇️</div>`;
            
            likedGrid.innerHTML += `
            <div class="card" onclick="playSong(${index})" oncontextmenu="openContextMenu(event, ${index})">
                ${downloadBtnHTML}
                <div class="like" title="Remove Like" onclick="toggleLike(event,${index})">💙</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>`;
        });
    }

    let offlineSongs = songs.filter(s => downloadedURLs.includes(s.file) || s.file.startsWith("local_"));

    if (offlineSongs.length === 0) {
        downloadedGrid.innerHTML = "<p style='color:#e2e8f0; grid-column: 1 / -1; font-size:14px;'>No songs downloaded for offline listening yet.</p>";
    } else {
        offlineSongs.forEach(song => {
            let index = songs.indexOf(song);
            let liked = likedSongs.includes(song);
            
            downloadedGrid.innerHTML += `
            <div class="card" onclick="playSong(${index})" oncontextmenu="openContextMenu(event, ${index})">
                <div class="like" title="Toggle Like" onclick="toggleLike(event,${index})">${liked ? "💙" : "🤍"}</div>
                <div class="cover" style="background-image:url('${song.cover}')"></div>
                <div class="title">${song.title}</div>
                <div class="artist">${song.artist}</div>
            </div>`;
        });
    }
}

async function downloadSongFile(event, url) {
    event.stopPropagation(); 
    triggerOfflineSave(url);
}

async function downloadCurrentSong(event) {
    if (event) event.stopPropagation(); 
    let song = songs[currentSong];
    if (!song || song.file.startsWith("local_") || downloadedURLs.includes(song.file)) {
        alert("This song is already saved offline in your Library!");
        return;
    }
    triggerOfflineSave(song.file);
}

// ==========================================
// --- NEW ANIMATED DOWNLOAD LOGIC ----------
// ==========================================
async function triggerOfflineSave(url) {
    const toast = document.getElementById("downloadToast");
    const toastText = document.getElementById("toastText");
    const spinner = document.getElementById("toastSpinner");

    try {
        // 1. Show the beautiful downloading animation
        toast.classList.remove("hidden");
        toastText.innerText = "Downloading...";
        spinner.style.display = "block";
        
        // 2. Try the new, more aggressive proxy
        let fetchUrl = url.startsWith("http") ? "https://api.allorigins.win/raw?url=" + encodeURIComponent(url) : url;
        
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        
        // 3. Save it silently (true means no ugly alert box)
        saveSongOffline(url, blob, true);
        
        // 4. Show success in the toast, then hide it after 3 seconds
        spinner.style.display = "none";
        toastText.innerText = "✅ Download Complete!";
        
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 3000);

    } catch (error) {
        console.warn("Proxy/CORS Blocked Download:", error);
        
        // 5. Show failure in the toast, then hide it
        spinner.style.display = "none";
        toastText.innerText = "❌ Download Blocked by Server";
        
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 4000);
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
            let liked = likedSongs.includes(song);
            results.innerHTML += `
            <div class="card" onclick="playSong(${index})" oncontextmenu="openContextMenu(event, ${index})">
                <div class="like" onclick="toggleLike(event,${index})">${liked ? "💙" : "🤍"}</div>
                <div>
                    <div class="cover" style="background-image:url('${song.cover}')"></div>
                    <div class="title">${song.title}</div>
                    <div class="artist">${song.artist}</div>
                </div>
            </div>`;
        }
    });
}

// --- ADD SONG (WITH LOCAL FILE SUPPORT) ---
function addSong() {
    let name = document.getElementById("songName").value;
    let artist = document.getElementById("artistName").value || "Unknown Artist";
    let cover = document.getElementById("coverURL").value || ("https://picsum.photos/200?random=" + Math.random());
    
    let urlInput = document.getElementById("songURL").value;
    let fileInput = document.getElementById("localAudio").files[0];

    if (!name) {
        alert("Enter a song name!");
        return;
    }

    let finalUrl = "";

    if (fileInput) {
        finalUrl = "local_" + Date.now(); 
        saveSongOffline(finalUrl, fileInput, false); // Keep alert for local upload success
    } else if (urlInput) {
        finalUrl = urlInput;
    } else {
        alert("Please provide an MP3 URL or upload a local MP3 file.");
        return;
    }

    songs.push({
        title: name,
        artist: artist,
        cover: cover,
        file: finalUrl
    });
    
    localStorage.setItem('songs', JSON.stringify(songs));

    document.getElementById("songName").value = "";
    document.getElementById("artistName").value = "";
    document.getElementById("coverURL").value = "";
    document.getElementById("songURL").value = "";
    document.getElementById("localAudio").value = "";

    loadSongs();
    
    if(!fileInput) alert("Song Added Successfully!");
}

// --- NAVIGATION ---
function showSection(section) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(section).classList.add("active");
    
    document.getElementById("pageTitle").innerText = section.charAt(0).toUpperCase() + section.slice(1);

    if (section === 'library') {
        renderLibrary(); 
    }

    let searchBar = document.getElementById("searchInput");
    if (section === "search") {
        searchBar.style.display = "block";
        searchBar.focus(); 
    } else {
        searchBar.style.display = "none";
        searchBar.value = "";
    }
}

// --- TIME AND PROGRESS BAR ---
function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        document.getElementById("progressBar").style.width = percent + "%";
        document.getElementById("currentTime").innerText = formatTime(audio.currentTime);
    }
});

function scrubAudio(e) {
    e.stopPropagation(); 
    const container = document.getElementById("progressContainer");
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audio.currentTime = percent * audio.duration;
}

// --- KEYBOARD CONTROLS ---
document.addEventListener("keydown", function(event) {
    let active = document.activeElement.tagName;
    if (active === "INPUT" || active === "TEXTAREA") return;
    
    if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
    }
});

audio.addEventListener('ended', nextSong);

function closePlayer(event) {
    if(event) event.stopPropagation(); 
    document.getElementById("player").style.display = "none";
    audio.pause();
}

let activeContextIndex = -1;

function openContextMenu(event, index) {
    event.preventDefault(); 
    
    activeContextIndex = index;
    let song = songs[index];
    let isDownloaded = downloadedURLs.includes(song.file) || song.file.startsWith("local_");
    
    let menu = document.getElementById("contextMenu");
    let downloadBtn = document.getElementById("cmDownloadBtn");
    
    if (isDownloaded) {
        downloadBtn.innerText = "✅ Downloaded";
        downloadBtn.classList.add("disabled");
    } else {
        downloadBtn.innerText = "⬇️ Download";
        downloadBtn.classList.remove("disabled");
    }
    
    menu.style.display = "block";
    menu.style.left = event.pageX + "px";
    menu.style.top = event.pageY + "px";
}

document.addEventListener("click", function() {
    document.getElementById("contextMenu").style.display = "none";
});

function handleCmDownload() {
    let song = songs[activeContextIndex];
    let isDownloaded = downloadedURLs.includes(song.file) || song.file.startsWith("local_");
    
    if (!isDownloaded) {
        triggerOfflineSave(song.file);
    }
}

function handleCmEdit() {
    let song = songs[activeContextIndex];
    
    document.getElementById("editTitleInput").value = song.title;
    document.getElementById("editArtistInput").value = song.artist;
    document.getElementById("editCoverInput").value = song.cover;
    
    document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("editModal").style.display = "none";
    activeContextIndex = -1;
}

function saveEditedSong() {
    if (activeContextIndex === -1) return;
    
    let newTitle = document.getElementById("editTitleInput").value;
    let newArtist = document.getElementById("editArtistInput").value;
    let newCover = document.getElementById("editCoverInput").value;
    
    if (!newTitle) {
        alert("Song Title cannot be empty!");
        return;
    }

    songs[activeContextIndex].title = newTitle;
    songs[activeContextIndex].artist = newArtist || "Unknown Artist";
    if (newCover) {
        songs[activeContextIndex].cover = newCover;
    }
    
    localStorage.setItem('songs', JSON.stringify(songs));
    
    if (activeContextIndex === currentSong) {
        document.getElementById("playerTitle").innerText = songs[activeContextIndex].title;
        document.getElementById("playerArtist").innerText = songs[activeContextIndex].artist;
        document.getElementById("playerCover").src = songs[activeContextIndex].cover;
    }

    loadSongs();
    renderLibrary();
    searchSongs();
    
    closeEditModal();
}
