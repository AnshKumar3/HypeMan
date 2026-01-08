# HypeMan Project

## Setup Instructions
1. **Clone the repo:** `git clone https://github.com/AnshKumar3/HypeMan`
2. **Install dependencies:** `npm install`
3. **Environment Setup:**
   - Create a file named `.env` in the root folder.
   - Add the following keys:
     ```
     GEMINI_API_KEY=your_key_here
     OBS_WEBSOCKET_URL=ws://localhost:4455
     OBS_WEBSOCKET_PASSWORD=your_password
     ```
4. **Run the server:** `node server.js`

## Current Issues (Debug Status)
* **Goal:** Connecting to Gemini and OBS to automate hype.
* **Status:** OBS connects successfully. Gemini connects, but debug output is missing/silent.
* **To Reproduce:** Run the server and trigger the action by coming closer to the camera.
