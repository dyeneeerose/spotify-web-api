// ================================
// 1. SETTINGS & ENDPOINTS
// ================================
const redirect_uri = "http://127.0.0.1:5500/index.html";

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAYER = "https://api.spotify.com/v1/me/player";

// ================================
// 2. PAGE LOAD
// ================================
function onPageLoad() {
    if (window.location.search.length > 0) {
        handleRedirect();
        return;
    }

    const access_token = localStorage.getItem("access_token");
    if (!access_token) {
        document.getElementById("tokenSection").style.display = "block";
        document.getElementById("deviceSection").style.display = "none";
    } else {
        document.getElementById("tokenSection").style.display = "none";
        document.getElementById("deviceSection").style.display = "block";
        refreshDevices();
        refreshPlaylists();
        currentlyPlaying();
    }
}

// ================================
// 3. AUTHORIZATION
// ================================
function requestAuthorization() {
    const client_id = document.getElementById("clientId").value;
    const client_secret = document.getElementById("clientSecret").value;

    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURIComponent(redirect_uri);
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-state playlist-read-private";
    url += "&show_dialog=true";

    window.location.href = url;
}

function handleRedirect() {
    const code = new URLSearchParams(window.location.search).get("code");
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri);
}

function fetchAccessToken(code) {
    const client_id = localStorage.getItem("client_id");
    const client_secret = localStorage.getItem("client_secret");

    let body = `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirect_uri)}`;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader(
        "Authorization",
        "Basic " + btoa(client_id + ":" + client_secret)
    );

    xhr.onload = function () {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            localStorage.setItem("access_token", data.access_token);
            onPageLoad();
        } else {
            alert("Authorization failed. Check Client ID / Secret / Redirect URI.");
        }
    };

    xhr.send(body);
}

// ================================
// 4. DEVICES
// ================================
function refreshDevices() {
    callApi("GET", DEVICES, null, function () {
        if (this.status === 200) {
            const data = JSON.parse(this.responseText);
            const select = document.getElementById("devices");
            select.innerHTML = "";

            data.devices.forEach(d => {
                let opt = document.createElement("option");
                opt.value = d.id;
                opt.text = d.name + (d.is_active ? " (Active)" : "");
                select.appendChild(opt);
            });
        }
    });
}

function transferPlayback() {
    const deviceId = document.getElementById("devices").value;

    callApi(
        "PUT",
        PLAYER,
        JSON.stringify({ device_ids: [deviceId], play: true }),
        () => setTimeout(currentlyPlaying, 500)
    );
}

// ================================
// 5. PLAYLISTS & TRACKS
// ================================
function refreshPlaylists() {
    callApi("GET", PLAYLISTS, null, function () {
        if (this.status === 200) {
            const data = JSON.parse(this.responseText);
            const select = document.getElementById("playlists");
            select.innerHTML = "";

            data.items.forEach(p => {
                let opt = document.createElement("option");
                opt.value = p.id;
                opt.text = p.name;
                select.appendChild(opt);
            });
        }
    });
}

function refreshPlaylists() {
    fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + access_token
        }
    })
    .then(response => response.json())
    .then(data => populatePlaylists(data.items))
    .catch(error => console.error("Error fetching playlists:", error));
}

function populatePlaylists(playlists) {
    let playlistSelect = document.getElementById("playlists");
    playlistSelect.innerHTML = "";

    playlists.forEach(playlist => {
        let option = document.createElement("option");
        option.value = playlist.id;      // playlist ID
        option.text = playlist.name;     // playlist name
        playlistSelect.appendChild(option);
    });
}

function fetchTracks() {
    const playlistId = document.getElementById("playlists").value;
    if (!playlistId) return;

    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    callApi("GET", url, null, function () {
        if (this.status === 200) {
            const data = JSON.parse(this.responseText);
            const select = document.getElementById("tracks");
            select.innerHTML = "";

            data.items.forEach(item => {
                if (item.track) {
                    let opt = document.createElement("option");
                    opt.value = item.track.uri;
                    opt.text = item.track.name + " - " + item.track.artists[0].name;
                    select.appendChild(opt);
                }
            });
        }
    });
}

// ================================
// 6. PLAYER
// ================================
function play() {
    const uri = document.getElementById("tracks").value;
    if (!uri) return;

    callApi(
        "PUT",
        PLAYER + "/play",
        JSON.stringify({ uris: [uri] }),
        () => setTimeout(currentlyPlaying, 500)
    );
}

function currentlyPlaying() {
    callApi("GET", PLAYER + "/currently-playing", null, function () {
        if (this.status === 200) {
            const data = JSON.parse(this.responseText);
            if (!data.item) return;

            document.getElementById("albumImage").src = data.item.album.images[0].url;
            document.getElementById("trackTitle").innerText = data.item.name;
            document.getElementById("trackArtist").innerText = data.item.artists[0].name;
        }
    });
}

// ================================
// 7. GENERIC API CALL
// ================================
function callApi(method, url, body, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader(
        "Authorization",
        "Bearer " + localStorage.getItem("access_token")
    );
    xhr.onload = callback;
    xhr.send(body);
}
