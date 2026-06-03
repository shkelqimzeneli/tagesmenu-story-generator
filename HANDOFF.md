# Tagesmenu Story Generator Handoff

## Project

Local workspace:

`C:\Users\shkel\Documents\Codex\2026-05-29\i-have-to-daily-edit-menus`

This app generates 1080 x 1920 story PNGs from Lunchgate menu APIs.

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev -- --port 5173
npm.cmd run server
```

Frontend:

`http://127.0.0.1:5173`

Backend:

`http://127.0.0.1:4300`

Health check:

`http://127.0.0.1:4300/health`

## Current Restaurants

### Türmli

Lunchgate API:

`https://api2.lunchgate.ch/menu/box/id/3234/`

Template source:

`C:\Users\shkel\Desktop\TUE - Tagesmenu 2.png`

### Kuonimatt

Lunchgate API:

`https://api2.lunchgate.ch/menu/box/id/10941/`

Current clean template source:

`C:\Users\shkel\Downloads\1212.png`

Visual reference used for text positions:

`C:\Users\shkel\Downloads\1212 - Filled.png`

Important: Kuonimatt should use the clean `1212.png` design and draw only the dynamic text:

- date
- dish 1 title, description, price
- dish 2 title, description, price
- `HOLZOFENPIZZA`
- `nach Wahl`
- `MENÜ INKLUSIVE`
- included soup/salad text

## Important Files

Frontend:

`src/App.jsx`

Styles/layout:

`src/styles.css`

Backend/API/rendering:

`server/index.js`

Fonts:

`public/fonts/Avenir.ttc`

`public/fonts/BebasNeue-Bold.ttf`

`public/fonts/Helium-Regular.ttf`

## Export

The `PNG` button posts the current menu JSON to:

`POST http://127.0.0.1:4300/api/render`

The backend opens the frontend render route in Playwright and screenshots:

`[data-story-frame]`

The browser downloads the PNG to:

`C:\Users\shkel\Downloads`

## Google Drive

The backend has a placeholder route:

`POST /api/render-to-drive`

If Google Drive credentials are not configured, it saves under:

`exports/`

Config is expected through `.env`:

```text
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_DRIVE_FOLDER_ID=
```

## Notes For Cloud Work

The current project is a local Vite + Express app. To move it to cloud code:

1. Keep templates and fonts in the repo or upload them to cloud storage.
2. Replace local Windows template paths in `server/index.js` with repo-relative or storage URLs.
3. Run the backend somewhere with Playwright/Chromium available.
4. Add Google Drive credentials as secrets.
5. Add a scheduled job to call the render/upload route daily.

## Latest Verified Export

Kuonimatt latest export:

`C:\Users\shkel\Documents\Codex\2026-05-29\i-have-to-daily-edit-menus\kuonimatt-1212-live.png`

Build command was verified:

```powershell
npm.cmd run build
```
