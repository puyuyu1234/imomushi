/**
 * test08.ts - Multi-Track MIDI Controller
 * Demonstrates individual track control with waveform, synth type, and ADSR settings
 */

import * as Tone from "tone";
import { Midi } from "@tonejs/midi";

// Track configuration interface
interface TrackConfig {
  synth: any;
  chorus: any;
  waveformAnalyzer: any;
  synthType: string;
  waveform: string;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  volume: number;
  chorusFrequency: number;
  chorusDelayTime: number;
  chorusDepth: number;
  chorusWet: number;
  muted: boolean;
  solo: boolean;
}

// UI Controls
const container = document.getElementById("canvasContainer");
if (!container) {
  throw new Error("Canvas container not found");
}

// Initialize track configurations (5 tracks as per test.mid)
const trackConfigs: TrackConfig[] = [
  // Track 1: Noise, sine, 0.001, 0.5, 0, 0.001, -18dB
  {
    synth: null,
    chorus: null,
    waveformAnalyzer: null,
    synthType: "NoiseSynth",
    waveform: "sine",
    attack: 0.001,
    decay: 0.5,
    sustain: 0,
    release: 0.001,
    volume: -22,
    chorusFrequency: 1.5,
    chorusDelayTime: 3.5,
    chorusDepth: 0.7,
    chorusWet: 0.0,
    muted: false,
    solo: false,
  },
  // Track 2: Basic, square, 0.001, 0.15, 0, 0.001, -10dB
  {
    synth: null,
    chorus: null,
    waveformAnalyzer: null,
    synthType: "Synth",
    waveform: "square",
    attack: 0.001,
    decay: 0.5,
    sustain: 0.15,
    release: 0.001,
    volume: -10,
    chorusFrequency: 1.5,
    chorusDelayTime: 3.5,
    chorusDepth: 0.7,
    chorusWet: 0.0,
    muted: false,
    solo: false,
  },
  // Track 3: Basic, sawtooth, 0.001, 1, 0.3, 1, -10dB
  {
    synth: null,
    chorus: null,
    waveformAnalyzer: null,
    synthType: "Synth",
    waveform: "sawtooth",
    attack: 0.001,
    decay: 0.7,
    sustain: 0.1,
    release: 1,
    volume: -10,
    chorusFrequency: 1.5,
    chorusDelayTime: 3.5,
    chorusDepth: 0.7,
    chorusWet: 0.0,
    muted: false,
    solo: false,
  },
  // Track 4: Basic, square, 0, 0.4, 0.001, 0.6, -10dB
  {
    synth: null,
    chorus: null,
    waveformAnalyzer: null,
    synthType: "Synth",
    waveform: "square",
    attack: 0.4,
    decay: 0.001,
    sustain: 1,
    release: 0.6,
    volume: -15,
    chorusFrequency: 1.5,
    chorusDelayTime: 3.5,
    chorusDepth: 0.7,
    chorusWet: 0.0,
    muted: false,
    solo: false,
  },
  // Track 5: Basic, sawtooth, 0.001, 0.5, 0.1, 0.001, -10dB
  {
    synth: null,
    chorus: null,
    waveformAnalyzer: null,
    synthType: "Synth",
    waveform: "sawtooth",
    attack: 0.001,
    decay: 0.5,
    sustain: 0.1,
    release: 0.001,
    volume: -10,
    chorusFrequency: 1.5,
    chorusDelayTime: 3.5,
    chorusDepth: 0.7,
    chorusWet: 0.0,
    muted: false,
    solo: false,
  },
];

// Create UI
function createUI() {
  let html = `
  <div style="padding: 20px; font-family: monospace; background: #1a1a1a; color: #eee; min-height: 100vh;">
    <h1 style="color: #00ff88;">Multi-Track MIDI Controller</h1>
    <div style="margin: 20px 0;">
      <button id="playBtn" style="padding: 10px 20px; font-size: 16px; margin-right: 10px; background: #00ff88; border: none; cursor: pointer;">Play</button>
      <button id="stopBtn" style="padding: 10px 20px; font-size: 16px; background: #ff4444; border: none; cursor: pointer;">Stop</button>
    </div>
    <div style="margin: 20px 0;">
      <div>Status: <span id="status" style="color: #00ff88;">Ready (test.mid loaded)</span></div>
      <div>Time: <span id="time">0.00</span>s</div>
      <div>Current File: <span id="currentFile">test.mid</span></div>
    </div>
    <h2 style="color: #00ff88; margin-top: 30px;">Track Settings</h2>
    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px;">
  `;

  // Create cards for each track
  for (let i = 0; i < 5; i++) {
    const config = trackConfigs[i];
    html += `
      <div style="background: #2a2a2a; border: 2px solid #00ff88; border-radius: 8px; padding: 15px; min-width: 280px; flex: 1;">
        <h3 style="color: #00ff88; margin-top: 0;">Track ${i + 1}</h3>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Synth Type</label>
          <select id="synthSelect${i}" style="width: 100%; padding: 8px; font-size: 14px; background: #333; color: #eee; border: 1px solid #555; border-radius: 4px;">
            <option value="Synth" ${
              config.synthType === "Synth" ? "selected" : ""
            }>Basic Synth</option>
            <option value="AMSynth" ${
              config.synthType === "AMSynth" ? "selected" : ""
            }>AM Synth</option>
            <option value="FMSynth" ${
              config.synthType === "FMSynth" ? "selected" : ""
            }>FM Synth</option>
            <option value="MonoSynth" ${
              config.synthType === "MonoSynth" ? "selected" : ""
            }>Mono Synth</option>
            <option value="DuoSynth" ${
              config.synthType === "DuoSynth" ? "selected" : ""
            }>Duo Synth</option>
            <option value="NoiseSynth" ${
              config.synthType === "NoiseSynth" ? "selected" : ""
            }>Noise Synth</option>
          </select>
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Waveform</label>
          <select id="waveformSelect${i}" style="width: 100%; padding: 8px; font-size: 14px; background: #333; color: #eee; border: 1px solid #555; border-radius: 4px;">
            <option value="sine" ${
              config.waveform === "sine" ? "selected" : ""
            }>Sine</option>
            <option value="triangle" ${
              config.waveform === "triangle" ? "selected" : ""
            }>Triangle</option>
            <option value="square" ${
              config.waveform === "square" ? "selected" : ""
            }>Square</option>
            <option value="sawtooth" ${
              config.waveform === "sawtooth" ? "selected" : ""
            }>Sawtooth</option>
          </select>
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Attack: <span id="attackValue${i}" style="color: #00ff88;">${config.attack.toFixed(
      3
    )}s</span></label>
          <input id="attack${i}" type="range" min="0.001" max="2" step="0.001" value="${
      config.attack
    }" style="width: 100%;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Decay: <span id="decayValue${i}" style="color: #00ff88;">${config.decay.toFixed(
      3
    )}s</span></label>
          <input id="decay${i}" type="range" min="0.001" max="2" step="0.001" value="${
      config.decay
    }" style="width: 100%;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Sustain: <span id="sustainValue${i}" style="color: #00ff88;">${config.sustain.toFixed(
      2
    )}</span></label>
          <input id="sustain${i}" type="range" min="0" max="1" step="0.01" value="${
      config.sustain
    }" style="width: 100%;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Release: <span id="releaseValue${i}" style="color: #00ff88;">${config.release.toFixed(
      3
    )}s</span></label>
          <input id="release${i}" type="range" min="0.001" max="5" step="0.001" value="${
      config.release
    }" style="width: 100%;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Volume: <span id="volumeValue${i}" style="color: #00ff88;">${
      config.volume
    }dB</span></label>
          <input id="volume${i}" type="range" min="-60" max="0" step="1" value="${
      config.volume
    }" style="width: 100%;" />
        </div>

        <hr style="border: 1px solid #444; margin: 15px 0;" />
        <h4 style="color: #00ff88; margin-bottom: 10px;">Chorus</h4>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Frequency: <span id="chorusFreqValue${i}" style="color: #00ff88;">1.50Hz</span></label>
          <input id="chorusFreq${i}" type="range" min="0.1" max="10" step="0.1" value="1.5" style="width: 100%;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Delay Time: <span id="chorusDelayValue${i}" style="color: #00ff88;">3.50ms</span></label>
          <input id="chorusDelay${i}" type="range" min="1" max="10" step="0.1" value="3.5" style="width: 100%;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Depth: <span id="chorusDepthValue${i}" style="color: #00ff88;">0.70</span></label>
          <input id="chorusDepth${i}" type="range" min="0" max="1" step="0.01" value="0.7" style="width: 100%;" />
        </div>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 3px;">Wet: <span id="chorusWetValue${i}" style="color: #00ff88;">0.00</span></label>
          <input id="chorusWet${i}" type="range" min="0" max="1" step="0.01" value="0.0" style="width: 100%;" />
        </div>

        <hr style="border: 1px solid #444; margin: 15px 0;" />
        <h4 style="color: #00ff88; margin-bottom: 10px;">Waveform</h4>
        <canvas id="waveformCanvas${i}" width="260" height="100" style="width: 100%; height: 100px; background: #0a0a0a; border: 1px solid #00ff88; border-radius: 4px;"></canvas>
      </div>
    `;
  }

  html += `
    </div>
  </div>
  `;

  container.innerHTML = html;
}

createUI();

// Get UI elements
const playBtn = document.getElementById("playBtn") as HTMLButtonElement;
const stopBtn = document.getElementById("stopBtn") as HTMLButtonElement;
const statusText = document.getElementById("status") as HTMLSpanElement;
const timeText = document.getElementById("time") as HTMLSpanElement;
const currentFileText = document.getElementById(
  "currentFile"
) as HTMLSpanElement;

// Create synth based on type
function createSynth(type: string): any {
  let newSynth: any;

  switch (type) {
    case "AMSynth":
      newSynth = new Tone.PolySynth(Tone.AMSynth);
      break;
    case "FMSynth":
      newSynth = new Tone.PolySynth(Tone.FMSynth);
      break;
    case "MonoSynth":
      newSynth = new Tone.PolySynth(Tone.MonoSynth);
      break;
    case "DuoSynth":
      newSynth = new Tone.PolySynth(Tone.DuoSynth);
      break;
    case "NoiseSynth":
      // NoiseSynth cannot be used with PolySynth, use a basic synth instead
      newSynth = new Tone.NoiseSynth();
      break;
    default:
      newSynth = new Tone.PolySynth(Tone.Synth);
  }

  newSynth.toDestination();
  return newSynth;
}

// Initialize synths for all tracks
function initializeSynths() {
  for (let i = 0; i < 5; i++) {
    if (trackConfigs[i].synth) {
      trackConfigs[i].synth.dispose();
    }
    if (trackConfigs[i].chorus) {
      trackConfigs[i].chorus.dispose();
    }
    if (trackConfigs[i].waveformAnalyzer) {
      trackConfigs[i].waveformAnalyzer.dispose();
    }

    // Create synth
    trackConfigs[i].synth = createSynth(trackConfigs[i].synthType);
    trackConfigs[i].synth.volume.value = trackConfigs[i].volume;

    // Create waveform analyzer
    trackConfigs[i].waveformAnalyzer = new Tone.Waveform(256);

    // Create chorus and connect
    const config = trackConfigs[i];
    trackConfigs[i].chorus = new Tone.Chorus(
      config.chorusFrequency,
      config.chorusDelayTime,
      config.chorusDepth
    ).toDestination();
    trackConfigs[i].chorus.wet.value = config.chorusWet;

    // Connect synth -> waveform -> chorus -> destination
    trackConfigs[i].synth.disconnect();
    trackConfigs[i].synth.connect(trackConfigs[i].waveformAnalyzer);
    trackConfigs[i].synth.connect(trackConfigs[i].chorus);

    updateSynthSettings(i);
  }
}

// Update synth settings
function updateSynthSettings(trackIndex: number) {
  const config = trackConfigs[trackIndex];
  const synth = config.synth;

  if (!synth) return;

  // Update envelope
  synth.set({
    envelope: {
      attack: config.attack,
      decay: config.decay,
      sustain: config.sustain,
      release: config.release,
    },
  });

  // Update waveform (skip for NoiseSynth)
  if (config.synthType !== "NoiseSynth") {
    try {
      synth.set({
        oscillator: {
          type: config.waveform,
        },
      });
    } catch (e) {
      console.warn(`Cannot set waveform for ${config.synthType}`);
    }
  }

  // Update volume
  synth.volume.value = config.volume;

  // Update chorus settings
  if (config.chorus) {
    config.chorus.frequency.value = config.chorusFrequency;
    config.chorus.delayTime = config.chorusDelayTime;
    config.chorus.depth = config.chorusDepth;
    config.chorus.wet.value = config.chorusWet;
  }
}

// Setup event listeners for all tracks
function setupEventListeners() {
  for (let i = 0; i < 5; i++) {
    const trackIndex = i;

    // Synth type selector
    const synthSelect = document.getElementById(
      `synthSelect${i}`
    ) as HTMLSelectElement;
    synthSelect.addEventListener("change", (e) => {
      const selectedType = (e.target as HTMLSelectElement).value;
      trackConfigs[trackIndex].synthType = selectedType;

      // Recreate synth
      if (trackConfigs[trackIndex].synth) {
        trackConfigs[trackIndex].synth.dispose();
      }
      trackConfigs[trackIndex].synth = createSynth(selectedType);
      updateSynthSettings(trackIndex);
    });

    // Waveform selector
    const waveformSelect = document.getElementById(
      `waveformSelect${i}`
    ) as HTMLSelectElement;
    waveformSelect.addEventListener("change", (e) => {
      trackConfigs[trackIndex].waveform = (e.target as HTMLSelectElement).value;
      updateSynthSettings(trackIndex);
    });

    // ADSR controls
    const attackInput = document.getElementById(
      `attack${i}`
    ) as HTMLInputElement;
    const attackValue = document.getElementById(
      `attackValue${i}`
    ) as HTMLSpanElement;
    attackInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].attack = value;
      attackValue.textContent = value.toFixed(3) + "s";
      updateSynthSettings(trackIndex);
    });

    const decayInput = document.getElementById(`decay${i}`) as HTMLInputElement;
    const decayValue = document.getElementById(
      `decayValue${i}`
    ) as HTMLSpanElement;
    decayInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].decay = value;
      decayValue.textContent = value.toFixed(3) + "s";
      updateSynthSettings(trackIndex);
    });

    const sustainInput = document.getElementById(
      `sustain${i}`
    ) as HTMLInputElement;
    const sustainValue = document.getElementById(
      `sustainValue${i}`
    ) as HTMLSpanElement;
    sustainInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].sustain = value;
      sustainValue.textContent = value.toFixed(2);
      updateSynthSettings(trackIndex);
    });

    const releaseInput = document.getElementById(
      `release${i}`
    ) as HTMLInputElement;
    const releaseValue = document.getElementById(
      `releaseValue${i}`
    ) as HTMLSpanElement;
    releaseInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].release = value;
      releaseValue.textContent = value.toFixed(3) + "s";
      updateSynthSettings(trackIndex);
    });

    // Volume control
    const volumeInput = document.getElementById(
      `volume${i}`
    ) as HTMLInputElement;
    const volumeValue = document.getElementById(
      `volumeValue${i}`
    ) as HTMLSpanElement;
    volumeInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].volume = value;
      volumeValue.textContent = value + "dB";
      updateSynthSettings(trackIndex);
    });

    // Chorus controls
    const chorusFreqInput = document.getElementById(
      `chorusFreq${i}`
    ) as HTMLInputElement;
    const chorusFreqValue = document.getElementById(
      `chorusFreqValue${i}`
    ) as HTMLSpanElement;
    chorusFreqInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].chorusFrequency = value;
      chorusFreqValue.textContent = value.toFixed(2) + "Hz";
      updateSynthSettings(trackIndex);
    });

    const chorusDelayInput = document.getElementById(
      `chorusDelay${i}`
    ) as HTMLInputElement;
    const chorusDelayValue = document.getElementById(
      `chorusDelayValue${i}`
    ) as HTMLSpanElement;
    chorusDelayInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].chorusDelayTime = value;
      chorusDelayValue.textContent = value.toFixed(2) + "ms";
      updateSynthSettings(trackIndex);
    });

    const chorusDepthInput = document.getElementById(
      `chorusDepth${i}`
    ) as HTMLInputElement;
    const chorusDepthValue = document.getElementById(
      `chorusDepthValue${i}`
    ) as HTMLSpanElement;
    chorusDepthInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].chorusDepth = value;
      chorusDepthValue.textContent = value.toFixed(2);
      updateSynthSettings(trackIndex);
    });

    const chorusWetInput = document.getElementById(
      `chorusWet${i}`
    ) as HTMLInputElement;
    const chorusWetValue = document.getElementById(
      `chorusWetValue${i}`
    ) as HTMLSpanElement;
    chorusWetInput.addEventListener("input", (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      trackConfigs[trackIndex].chorusWet = value;
      chorusWetValue.textContent = value.toFixed(2);
      updateSynthSettings(trackIndex);
    });
  }
}

let midiData: Midi | null = null;
let currentParts: (Tone.Part | null)[] = [null, null, null, null, null];

// Get transport instance
const transport = Tone.getTransport();

// Load MIDI file automatically
async function loadMidi() {
  try {
    statusText.textContent = "Loading MIDI...";
    const response = await fetch(`./sound/test.mid`);
    const arrayBuffer = await response.arrayBuffer();
    midiData = new Midi(arrayBuffer);
    currentFileText.textContent = "test.mid";
    statusText.textContent = "Ready (test.mid loaded)";
    console.log("MIDI loaded:", midiData.name);
    console.log("Duration:", midiData.duration, "seconds");
    console.log("Tracks:", midiData.tracks.length);
  } catch (error) {
    statusText.textContent = "Error loading MIDI";
    console.error("Failed to load MIDI:", error);
  }
}

// Play MIDI
function playMidi() {
  if (!midiData) {
    console.error("MIDI not loaded");
    return;
  }

  // Stop existing parts if any
  currentParts.forEach((part) => {
    if (part) {
      part.stop(0);
      part.dispose();
    }
  });
  currentParts = [null, null, null, null, null];

  // Reset transport
  transport.stop();
  transport.position = 0;

  // Start Tone.js audio context
  Tone.start();

  // Create a Part for each track
  midiData.tracks.forEach((track: any, trackIndex: number) => {
    if (trackIndex >= 5) return; // Only process first 5 tracks

    const config = trackConfigs[trackIndex];

    const events: Array<{
      time: number;
      note: string;
      duration: number;
      velocity: number;
    }> = [];

    track.notes.forEach((note: any) => {
      events.push({
        time: note.time,
        note: note.name,
        duration: note.duration,
        velocity: note.velocity,
      });
    });

    if (events.length === 0) return;

    // Create a Part for this track
    const part = new Tone.Part((time: number, event: any) => {
      if (config.synthType === "NoiseSynth") {
        // NoiseSynth doesn't use pitch, only duration
        config.synth.triggerAttackRelease(event.duration, time);
      } else {
        config.synth.triggerAttackRelease(
          event.note,
          event.duration,
          time,
          event.velocity
        );
      }
    }, events);

    // Set loop (always ON)
    part.loop = true;
    part.loopEnd = Math.max(0.01, midiData!.duration);

    // Start playback
    part.start(0);
    currentParts[trackIndex] = part;
  });

  transport.start();
  statusText.textContent = "Playing";
  updateTimeDisplay();
}

// Stop playback
function stopMidi() {
  currentParts.forEach((part) => {
    if (part) {
      part.stop(0);
    }
  });
  transport.stop();
  transport.cancel(0);
  transport.position = 0;
  statusText.textContent = "Stopped";
  timeText.textContent = "0.00";
}

// Update time display
function updateTimeDisplay() {
  const updateTime = () => {
    if (transport.state === "started") {
      timeText.textContent = transport.seconds.toFixed(2);
      requestAnimationFrame(updateTime);
    }
  };
  updateTime();
}

// Draw waveforms
function drawWaveforms() {
  for (let i = 0; i < 5; i++) {
    const canvas = document.getElementById(`waveformCanvas${i}`) as HTMLCanvasElement;
    if (!canvas) continue;

    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    const waveform = trackConfigs[i].waveformAnalyzer;
    if (!waveform) continue;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // Get waveform data
    const values = waveform.getValue();
    const sliceWidth = width / values.length;

    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#00ff88";
    ctx.beginPath();

    let x = 0;
    for (let j = 0; j < values.length; j++) {
      const v = (values[j] + 1) / 2; // Normalize from [-1, 1] to [0, 1]
      const y = v * height;

      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  requestAnimationFrame(drawWaveforms);
}

// Event listeners for playback controls
playBtn.addEventListener("click", playMidi);
stopBtn.addEventListener("click", stopMidi);

// Initialize
initializeSynths();
setupEventListeners();
loadMidi();

// Start waveform drawing loop
drawWaveforms();
