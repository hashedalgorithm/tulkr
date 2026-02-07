
# Tulkr — Custom Subtitles Overlay (Chromium Based Browser Extension) 🎬📝

Tulkr is a Chromium-based browser extension built with [Plasmo](https://www.plasmo.com/) that lets you upload your own `.srt` subtitle files and display them as a subtitle overlay on videos on (most) websites. 🌐

You can run multiple subtitle sessions across different tabs, customize subtitle appearance globally, and adjust timing (delay/offset) per session. ⏱️🎨  
The name is inspired by Norse and loosely translates to “Translator.” ⚔️📖

---
<img width="787" height="630" alt="Screenshot 2026-02-07 at 18 47 28" src="https://github.com/user-attachments/assets/43f217ef-ec49-4db1-b475-f6e891d3cbe0" />
<img width="786" height="631" alt="Screenshot 2026-02-07 at 18 44 56" src="https://github.com/user-attachments/assets/88fcf80a-8699-48c2-b591-0c2c712c5ef5" />


## Features ✨

- Upload `.srt` subtitle files 📤
- Attach subtitles to a chosen tab (one session per tab) 🧩
- Subtitle overlay synced to the video using `video.currentTime` 🎥⏱️
- Per-session delay/offset to fix sync issues 🔧
- Global styling controls 🎨
  - font size 🔠
  - text color 🖍️
  - background color 🟦
  - text stroke color + stroke weight ✍️
- Update/replace subtitles for an existing session ♻️
- Works even if the popup is closed (content script renders overlay) ✅

---

## How it works (high-level architecture) 🧠

Tulkr is split into three contexts:

1. **Popup UI (React)** 🪟
   - Upload subtitles
   - Create and manage sessions
   - Configure global subtitle styling

2. **Background Service Worker** ⚙️
   - Stores sessions in extension IndexedDB
   - Routes messages between popup and content scripts
   - Sends session updates to the correct tab when needed

3. **Content Script (React overlay)** 🧩
   - Detects the `<video>` element on the page
   - Renders the subtitle overlay inside the webpage context
   - Updates the currently displayed subtitle by reading `video.currentTime`
   - Handles fullscreen behavior and styling updates

Subtitles are selected by time using an efficient lookup (binary search) so they remain stable through seek, pause, playback speed changes, etc. 🔍✅

---

## Installation (Development) 🛠️

### Prerequisites 📦
- Node.js (LTS recommended) ✅
- `pnpm` (recommended) or `npm`

### Install dependencies
```bash
pnpm install
```

### Run in development 🚧
```bash
pnpm dev
```

Plasmo will output a development build and instructions for loading it as an unpacked extension.

### Build a production package (zip) 📦
```bash
pnpm build
pnpm package
```

Look for the generated `.zip` in the `build/` output directory (path depends on Plasmo version).

---

## How to use (End user) ✅

### 1) Create a session ➕
1. Open the extension popup 🪟
2. Go to **Create** ➕
3. Select the browser tab where your video is playing (or will play) 🧭
4. Upload an `.srt` file 📤
5. Click **Create Session** ✅

Tulkr will attach that subtitle file to the selected tab.

### 2) See active sessions 🗂️
- Open the **Active** tab in the popup
- You can:
  - select a session/tab for configuration 🎛️
  - edit/replace the subtitle file ♻️
  - delete a session 🗑️

### 3) Adjust synchronization (per session) ⏱️
- Select a session/tab
- In **Synchronization**, change **Delay**
  - positive delay: subtitles appear later ➕
  - negative delay: subtitles appear earlier ➖

### 4) Customize appearance (global) 🎨
In **Configuration**, adjust:
- visibility toggle 👁️
- font size 🔠
- text color 🖍️
- background color 🟦
- stroke color and stroke weight ✍️

These apply across all sessions.

---

## Notes / Limitations ⚠️

- Some pages (e.g. `chrome://` and Chrome Web Store pages) do not allow content scripts. Tulkr cannot render subtitles there. 🚫
- Some sites embed video inside cross-origin iframes. In those cases, the overlay may not be able to access the video element. 🧱
- Subtitle format currently focuses on `.srt`. Other formats may require additional parsing. 🧩

---

## Privacy & Data Disclosures 🔒

Tulkr is designed to run locally in your browser. 🧠💻

### Data you provide
- Subtitle files (`.srt`) you upload 📄
- Session metadata (tab id, tab title, tab URL as needed for session management) 🧾
- Your configuration choices (colors, font size, stroke settings, etc.) 🎛️

### Where data is stored
- **Extension storage**: global configuration 🗄️
- **Extension IndexedDB**: session records and uploaded subtitle text for each session 🧠

### What Tulkr does NOT do
- Does not sell your data ❌💰
- Does not transmit subtitle files to remote servers (no cloud upload) ❌☁️
- Does not track browsing history for advertising ❌📈

### Permissions rationale (typical)
- `tabs`: list tabs in the popup and attach sessions to a specific tab 🧭
- `storage`: persist configuration and session data 🗄️
- `host_permissions` / `<all_urls>`: required so the content script can run where you want subtitles to render 🌐

If you fork this project, you are responsible for keeping the privacy disclosures accurate. ✅

---

## Legal Notice (Important) ⚖️

You must use Tulkr legally and in accordance with:
- the website’s Terms of Service 📜
- applicable copyright laws 🧾
- applicable local laws/regulations 🏛️

Do not upload or use subtitles you do not have the rights to use. Tulkr is a tool for accessibility and personal customization; you are responsible for how you use it. ✅

---

## Contributing 🤝

Issues and PRs are welcome!  
If you report a bug, please include:
- the site URL (or a minimal repro) 🌐
- whether the video is in an iframe 🧱
- whether fullscreen is involved 🖥️
- the `.srt` characteristics (size, number of cues) 📄

---

## License 📄

Licensed under the **Apache License 2.0**.

You may obtain a copy of the License at:

- https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an **"AS IS" BASIS**, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
