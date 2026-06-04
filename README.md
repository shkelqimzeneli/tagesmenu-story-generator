# Tagesmenu Story Generator

React + Node app for generating Instagram story PNGs from Lunchgate menu APIs.

## Requirements

- Windows, macOS, or Linux
- Node.js 22 or newer
- Internet access for Lunchgate API data

## Setup

```bash
npm install
npm exec playwright install chromium
```

## Run

```bash
npm run start
```

Then open:

```text
http://127.0.0.1:5173/
```

On Windows you can also double-click:

```text
Start Daily Menus.bat
```

If you want the cleanest app-like start with no command window, double-click:

```text
Start Daily Menus.vbs
```

The Windows launcher installs missing packages and the PNG export browser the first time it runs.

It also installs the bundled fonts for the current Windows user. The app still loads fonts directly from `public/fonts`, so the menu designs keep their fonts even before the fonts are available system-wide.

## Updates

Use the `Get updates` button inside the app to pull the newest GitHub version.

This only works when the app was downloaded with `git clone`. If someone downloaded the app as a ZIP, they need to download it again or clone the repository.

If the update changes backend files or dependencies, restart the app after the update finishes.

## Export Output

PNG exports are saved locally when Google Drive credentials are not configured.

Default export folder:

```text
exports/
```

You can change it with:

```env
APP_EXPORT_ROOT=C:\path\to\your\folder
```

## Google Drive

Google Drive upload is optional. Copy `.env.example` to `.env` and configure:

```env
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_DRIVE_FOLDER_ID=
```

Do not commit `.env` or credential JSON files.

## Included Restaurants

- Türmli
- Kuonimatt
- LUX
- Zellfeld
- Fischerstube
- Militärgarten
