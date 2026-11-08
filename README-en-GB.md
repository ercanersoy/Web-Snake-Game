# Snake Game

A snake game in the web browser

Copyright (c) 2026 Ercan Ersoy

This software is licensed under the MIT License.

Made with the help of Claude Code Opus 5.5.

A web-based, two-dimensional snake game written with HTML5 Canvas. No installation is needed: just open `index.html` in your browser.

## Features

- Canvas play area that fills the whole window
- Main menu: **Start Game**, **Settings**, **About**
- Game setup: map (25 in total), 1–2 human and 0–2 computer players (up to 4 snakes), computer difficulty (Easy / Medium / Hard), snake speed (1–10), target score (10–100), food on the board at once (2–10)
- Green player snake, blue opponent snake (Player 2 is orange, Computer 2 is purple), yellow food, light grey walls, black background
- Only web-safe colours are used; the colour picker in the settings shows the 216-colour web-safe palette
- Settings: language, sound effects and music on/off, volume and all colours (saved in the browser)
- Languages: Turkish (Türkiye), American English, British English. The language is detected from the browser when the game is first opened; for languages other than Turkish and English, American English is used.
- Sound effects and background music generated with the Web Audio API (no audio files)
- Keyboard and touch (swipe) support

## Rules

- Each piece of food is worth 1 point and makes the snake longer. The first to reach the target score wins.
- A snake that hits a wall or leaves the map is knocked out, and its player loses.
- Running into yourself or another snake also knocks you out. The last snake standing wins; if the last snakes go out together, the game is a draw.
- If every human player is knocked out, the computers win.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / WASD | Steer (one player) |
| WASD | Player 1 steering (two players) |
| Arrow keys | Player 2 steering (two players) |
| P / Esc | Pause / resume |
| Swipe | Steer (touch screen) |

## Files

- `index.html` – page and menus
- `css/style.css` – interface styles
- `js/i18n.js` – translations and browser language detection
- `js/maps.js` – 25 maps
- `js/game.js` – game rules and the computer snakes' AI
- `js/render.js` – canvas drawing
- `js/audio.js` – sound effects and music
- `js/settings.js` – saving settings
- `js/main.js` – menus, input and main loop
