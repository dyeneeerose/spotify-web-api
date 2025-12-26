// 1. SETTINGS & ENDPOINTS
var redirect_uri = "http://127.0.0.1:5500/index.html"; 

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAYER = "https://api.spotify.com/v1/me/player";

// 2. PAGE LOAD LOGIC
function onPageLoad(){
    client_id = localStorage.getItem("client_id");
    client_secret = localStorage.getItem("client_secret");

    if ( window.location.search.length > 0 ){
        handleRedirect();
    } else {
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            document.getElementById("tokenSection").style.display = 'block';
            document.getElementById("deviceSection").style.display = 'none';
        } else {
            document.getElementById("tokenSection").style.display = 'none';
            document.getElementById("deviceSection").style.display = 'block';
            refreshDevices();
            refreshPlaylists();
            currentlyPlaying();
        }
    }
}

// 3. AUTHENTICATION FUNCTIONS
function requestAuthorization(){
    // These IDs must match your index.html exactly
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;
    
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-state playlist-read-private";
    
    window.location.href = url; // This redirects the user to Spotify
}

function refreshDevices() {
    callApi("GET", DEVICES, null, handleDevicesResponse);
}
// This function runs when you click the "Request Authorization" button
function requestAuthorization(){
    // 1. Get the ID and Secret from your input boxes
    let client_id = document.getElementById("clientId").value;
    let client_secret = document.getElementById("clientSecret").value;

    // 2. Store them in your browser so you don't have to re-type them
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    // 3. Build the Spotify Authorization URL
    let url = "https://accounts.spotify.com/authorize";
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI("http://127.0.0.1:5500/index.html");
    url += "&show_dialog=true";
    
    // 4. Scopes (Permissions you are asking from the user)
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-state playlist-read-private";

    // 5. Redirect the window to Spotify
    window.location.href = url;
}
function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    
    // Tinatawag ang Spotify API para makuha ang token
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    // Kailangan ang Base64 encoding para sa security
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    
    xhr.onload = function() {
        if (this.status == 200) {
            var data = JSON.parse(this.responseText);
            if (data.access_token != undefined) {
                localStorage.setItem("access_token", data.access_token);
                // Kapag may token na, i-load na ang dashboard
                onPageLoad(); 
            }
        } else {
            console.log("Error: " + this.responseText);
            alert("Maling Client Secret o Redirect URI. Pakicheck ang Spotify Dashboard.");
        }
    };
    
    xhr.send(body);
}

function handleDevicesResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        let select = document.getElementById("devices");
        select.innerHTML = "";
        
        // Loop through all active devices (Phone, PC, Web Player)
        data.devices.forEach(item => {
            let node = document.createElement("option");
            node.value = item.id;
            node.innerHTML = item.name + (item.is_active ? " (Active)" : "");
            select.appendChild(node);
        });
    }
}
const SEARCH = "https://api.spotify.com/v1/search";

function searchSpotify() {
    let query = document.getElementById("searchQuery").value;
    if (!query) return;

    // We search for tracks specifically
    let url = SEARCH + "?q=" + encodeURI(query) + "&type=track&limit=10";
    callApi("GET", url, null, handleSearchResponse);
}

function handleSearchResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        let select = document.getElementById("tracks");
        select.innerHTML = "";
        
        // Loop through search results
        data.tracks.items.forEach(item => {
            let node = document.createElement("option");
            node.value = item.uri; // We use URI for playing directly
            node.innerHTML = item.name + " - " + item.artists[0].name;
            select.appendChild(node);
        });
        console.log("Search results loaded into Tracks dropdown.");
    }
}

function transferPlayback() {
    let deviceId = document.getElementById("devices").value;
    let body = JSON.stringify({
        "device_ids": [deviceId],
        "play": true
    });
    // This tells Spotify to start playing on the device you picked
    callApi("PUT", PLAYER, body, (res) => {
        console.log("Playback transferred to device: " + deviceId);
    });
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("", "", redirect_uri);
}

function fetchAccessToken(code){
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            localStorage.setItem("access_token", data.access_token);
        }
        onPageLoad();
    }
}

// 4. PLAYER & PLAYLIST FUNCTIONS
function refreshPlaylists(){
    callApi("GET", PLAYLISTS, null, handlePlaylistsResponse);
}

function handlePlaylistsResponse(){
    if (this.status == 200){
        var data = JSON.parse(this.responseText);
        let select = document.getElementById("playlists");
        select.innerHTML = "";
        data.items.forEach(item => {
            let opt = document.createElement("option");
            opt.value = item.id;
            opt.innerHTML = item.name;
            select.appendChild(opt);
        });
    }
}

function currentlyPlaying(){
    callApi("GET", PLAYER + "/currently-playing", null, handleCurrentlyPlayingResponse);
}

function handleCurrentlyPlayingResponse(){
    if (this.status == 200){
        var data = JSON.parse(this.responseText);
        if (data.item != null){
            document.getElementById("albumImage").src = data.item.album.images[0].url;
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("trackArtist").innerHTML = data.item.artists[0].name;
        }
    }
}
// New Endpoint for Tracks
const TRACKS = "https://api.spotify.com/v1/playlists/{{playlist_id}}/tracks";

// This fills the Playlist dropdown
function refreshPlaylists() {
    callApi("GET", PLAYLISTS, null, handlePlaylistsResponse);
}

function handlePlaylistsResponse(xhr) {
    if (xhr.status == 200) {
        var data = JSON.parse(xhr.responseText);
        let select = document.getElementById("playlists");
        select.innerHTML = ""; // Clear existing options
        
        data.items.forEach(item => {
            let node = document.createElement("option");
            node.value = item.id; // Store Playlist ID
            node.innerHTML = item.name;
            select.appendChild(node);
        });
    }
}

// This fills the Tracks dropdown based on the selected playlist
function fetchTracks() {
    let playlist_id = document.getElementById("playlists").value;
    if (!playlist_id) return;

    let url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`;
    callApi("GET", url, null, handleTracksResponse);
}

function handleTracksResponse(xhr) {
    if (xhr.status == 200) {
        var data = JSON.parse(xhr.responseText);
        let select = document.getElementById("tracks");
        select.innerHTML = ""; // Clear existing tracks
        
        data.items.forEach(item => {
            if (item.track) {
                let node = document.createElement("option");
                node.value = item.track.uri; // Store URI for playing
                node.innerHTML = item.track.name + " - " + item.track.artists[0].name;
                select.appendChild(node);
            }
        });
    }
}
function fetchTracks() {
    let playlist_id = document.getElementById("playlists").value;
    if (playlist_id) {
        // API endpoint to get tracks from a specific playlist
        const TRACKS = `https://developer.spotify.com/documentation/web-api/concepts/authorization9{playlist_id}/tracks`;
        callApi("GET", TRACKS, null, handleTracksResponse);
    }
}
// Function to get all your playlists
function refreshPlaylists() {
    callApi("GET", PLAYLISTS, null, handlePlaylistsResponse);
}

function handlePlaylistsResponse(xhr) {
    if (xhr.status == 200) {
        var data = JSON.parse(xhr.responseText);
        let select = document.getElementById("playlists");
        select.innerHTML = ""; // Clear old list
        
        data.items.forEach(item => {
            let node = document.createElement("option");
            node.value = item.id; // Store ID to fetch tracks later
            node.innerHTML = item.name;
            select.appendChild(node);
        });
        // Automatically fetch tracks for the first playlist in the list
        fetchTracks();
    }
}
function refreshDevices() {
    callApi("GET", DEVICES, null, handleDevicesResponse);
}

function handleDevicesResponse(xhr) {
    if (xhr.status == 200) {
        var data = JSON.parse(xhr.responseText);
        let select = document.getElementById("devices");
        select.innerHTML = ""; // Clear the list first
        
        data.devices.forEach(item => {
            let opt = document.createElement("option");
            opt.value = item.id; // The ID is used for the "Transfer" function
            opt.innerHTML = item.name + (item.is_active ? " (Active)" : "");
            select.appendChild(opt);
        });
    }
}
function transferPlayback() {
    let deviceId = document.getElementById("devices").value;
    let body = JSON.stringify({
        "device_ids": [deviceId],
        "play": true // Starts playing immediately on the new device
    });
    callApi("PUT", PLAYER, body, (xhr) => {
        console.log("Device switched!");
        setTimeout(currentlyPlaying, 500); // Update the album art
    });
}

// Function to get tracks for the selected playlist
function fetchTracks() {
    let playlist_id = document.getElementById("playlists").value;
    if (!playlist_id) return;

    // The endpoint uses the playlist ID to find specific songs
    let url = "https://api.spotify.com/v1/playlists/" + playlist_id + "/tracks";
    callApi("GET", url, null, handleTracksResponse);
}

function handleTracksResponse(xhr) {
    if (xhr.status == 200) {
        var data = JSON.parse(xhr.responseText);
        let select = document.getElementById("tracks");
        select.innerHTML = ""; // Clear old tracks
        
        data.items.forEach(item => {
            if (item.track) {
                let node = document.createElement("option");
                node.value = item.track.uri; // Store URI to play the song
                node.innerHTML = item.track.name + " - " + item.track.artists[0].name;
                select.appendChild(node);
            }
        });
    }
}

function handleTracksResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        let select = document.getElementById("tracks");
        select.innerHTML = "";
        data.items.forEach(item => {
            let node = document.createElement("option");
            node.value = item.track.id;
            node.innerHTML = item.track.name + " - " + item.track.artists[0].name;
            select.appendChild(node);
        });
    }
}

function play() {
    let trackUri = document.getElementById("tracks").value;
    let body = {};
    
    // If a track is selected in the dropdown, play that specific one
    if (trackUri) {
        body = JSON.stringify({ "uris": [trackUri] });
    }

    callApi("PUT", PLAYER + "/play", body, (res) => {
        // Refresh the UI after a short delay to show the new song art
        setTimeout(currentlyPlaying, 500);
    });
}
function play() {
    let trackUri = document.getElementById("tracks").value;
    let body = {};
    
    // If a track is selected in the dropdown, tell Spotify to play that URI
    if (trackUri) {
        body = JSON.stringify({ "uris": [trackUri] });
    }

    callApi("PUT", PLAYER + "/play", body, (xhr) => {
        // Wait 500ms for Spotify to update, then refresh the album art
        setTimeout(currentlyPlaying, 500);
    });
}

// 5. GENERIC API CALLER
function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("access_token"));
    xhr.send(body);
    xhr.onload = callback;
}

function getCode(){
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
}