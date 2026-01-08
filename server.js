import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import OBSWebSocket from 'obs-websocket-js';
import { DIRECTOR_PROMPT } from './prompts/director.js';

dotenv.config();

const wss = new WebSocketServer({ port: 8080 });
const obs = new OBSWebSocket();
const GEMINI_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";

// 1. Connect to OBS
console.log("Connecting to OBS...");
obs.connect('ws://127.0.0.1:4455', process.env.OBS_PASSWORD)
  .then(() => console.log("✅ Connected to OBS Studio"))
  .catch(err => console.error("❌ OBS Connection Failed:", err.message));

wss.on('connection', (clientWs) => {
  console.log("Streamer Connected. Initializing HypeMan...");

  // 2. Connect to Gemini Live API
  const geminiWs = new WebSocket(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`);

  geminiWs.on('open', () => {
    console.log("✅ Connected to Gemini 3");
    
    // Send Initial Setup
    const setupMessage = {
      setup: {
        model: "models/gemini-2.0-flash-exp", 
        generation_config: {
          response_modalities: ["TEXT"],
          temperature: 0.2
        },
        system_instruction: { parts: [{ text: DIRECTOR_PROMPT }] }
      }
    };
    geminiWs.send(JSON.stringify(setupMessage));
  });

  // 3. Pipeline: Client -> Gemini
  clientWs.on('message', (data) => {
    const message = JSON.parse(data);
    
    // DEBUG LOG: Prove we are getting video
    if (message.realtime_input) {
        process.stdout.write("."); // Print a dot for every frame received
    }

    if (message.realtime_input && geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.send(JSON.stringify({
        realtime_input: {
          media_chunks: [{
              mime_type: "image/jpeg",
              data: message.realtime_input.data 
          }]
        }
      }));
    }
  });

  // 4. Pipeline: Gemini -> OBS
  geminiWs.on('message', async (data) => {
    const response = JSON.parse(data);
    const text = response.serverContent?.modelTurn?.parts?.[0]?.text;
    
    // --- THIS IS THE PART YOU NEED TO CHANGE ---
    if (text) {
      console.log("🤖 RAW GEMINI OUTPUT:", text); // <--- ADD THIS LINE HERE
      
      try {
        const cmd = JSON.parse(text);
        console.log("🎬 DIRECTOR COMMAND:", cmd.action, cmd.name || cmd.file);

        if (cmd.action === "SCENE") {
            // Switch Scene in OBS
            await obs.call('SetCurrentProgramScene', { sceneName: cmd.name });
        }
      } catch (e) {
        // If it's not JSON, it will print this error
        console.log("❌ Gemini sent text, but not JSON:", e.message);
      }
    }
    // -------------------------------------------
  });

  clientWs.on('close', () => geminiWs.close());
});

console.log("HypeMan Server running on ws://localhost:8080");
