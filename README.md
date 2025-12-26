# Spotify Web API Control Panel

A web-based dashboard that interacts with the Spotify Web API to manage playback, view playlists, and switch between active devices.

## Table of Contents
* [Project Overview](#project-overview)
* [Features](#features)
* [How It Works](#how-it-works)
* [Setup Instructions](#setup-instructions)

---

## Project Overview
This project is a single-page application built with HTML, Bootstrap, and Vanilla JavaScript. It uses the **Spotify Authorization Code Flow** to securely access a user's account and control their music player in real-time.

## Features
* **OAuth 2.0 Login**: Securely requests permissions for user email, playback state, and playlist access.
* **Device Selection**: Fetches and lists all available Spotify Connect devices.
* **Playlist & Track Browsing**: Dynamically loads user playlists and individual tracks.
* **Playback Controls**: Standard media buttons including Play, Pause, Next, Previous, and Shuffle.
* **Now Playing Display**: Updates with the current album art, song title, and artist name.

## How It Works
1. **Authentication**: The app takes your Client ID and Secret to generate a unique login link.
2. **Token Exchange**: Once you log in, Spotify sends a 'code' back to the `redirect_uri` which is then exchanged for an `access_token`.
3. **API Interaction**: The `access_token` is used in the header of every request to talk to Spotify's servers.

## Setup Instructions
1. Clone this repository to your local machine.
2. Open the Spotify Developer Dashboard and create a new App.
3. Add `http://127.0.0.1:5500/index.html` to your **Redirect URIs**.
4. Open the `index.html` file using **Live Server** in VS Code.
