/**
 * test07.ts - Tone.js MIDI Loop Sample
 * Demonstrates seamless MIDI looping using Tone.js
 */

import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

// UI Controls
const container = document.getElementById('canvasContainer');
if (!container) {
  throw new Error('Canvas container not found');
}

// Create UI
container.innerHTML = `
  <div style="padding: 20px; font-family: monospace;">
    <h1>Tone.js MIDI Loop Sample</h1>
    <div style="margin: 20px 0;">
      <label>MIDI File:
        <select id="midiSelect" style="padding: 5px; font-size: 14px;">
          <option value="test1.mid">test1.mid</option>
          <option value="test2.mid">test2.mid</option>
        </select>
      </label>
      <button id="loadBtn" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">Load</button>
    </div>
    <div style="margin: 20px 0;">
      <button id="playBtn" style="padding: 10px 20px; font-size: 16px; margin-right: 10px;">Play</button>
      <button id="stopBtn" style="padding: 10px 20px; font-size: 16px; margin-right: 10px;">Stop</button>
      <button id="loopBtn" style="padding: 10px 20px; font-size: 16px;">Loop: ON</button>
    </div>
    <div style="margin: 20px 0;">
      <label>Synth Type:
        <select id="synthSelect" style="padding: 5px; font-size: 14px;">
          <option value="Synth">Basic Synth</option>
          <option value="AMSynth">AM Synth (振幅変調)</option>
          <option value="FMSynth">FM Synth (周波数変調)</option>
          <option value="MonoSynth">Mono Synth (フィルター付き)</option>
          <option value="DuoSynth">Duo Synth (デュアル)</option>
        </select>
      </label>
      <label style="margin-left: 10px;">Waveform:
        <select id="waveformSelect" style="padding: 5px; font-size: 14px;">
          <option value="sine">正弦波 (Sine)</option>
          <option value="triangle">三角波 (Triangle)</option>
          <option value="square">矩形波 (Square)</option>
          <option value="sawtooth">ノコギリ波 (Sawtooth)</option>
        </select>
      </label>
    </div>
    <div style="margin: 20px 0;">
      <label>Volume: <input id="volumeSlider" type="range" min="-40" max="0" value="-10" step="1" /></label>
      <span id="volumeValue">-10 dB</span>
    </div>
    <div style="margin: 20px 0;">
      <div>Status: <span id="status">Ready</span></div>
      <div>Time: <span id="time">0.00</span>s</div>
      <div>Loop: <span id="loopStatus">Enabled</span></div>
      <div>Current File: <span id="currentFile">test1.mid</span></div>
    </div>
  </div>
`;

const midiSelect = document.getElementById('midiSelect') as HTMLSelectElement;
const loadBtn = document.getElementById('loadBtn') as HTMLButtonElement;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
const loopBtn = document.getElementById('loopBtn') as HTMLButtonElement;
const synthSelect = document.getElementById('synthSelect') as HTMLSelectElement;
const waveformSelect = document.getElementById('waveformSelect') as HTMLSelectElement;
const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
const volumeValue = document.getElementById('volumeValue') as HTMLSpanElement;
const statusText = document.getElementById('status') as HTMLSpanElement;
const timeText = document.getElementById('time') as HTMLSpanElement;
const loopStatusText = document.getElementById('loopStatus') as HTMLSpanElement;
const currentFileText = document.getElementById('currentFile') as HTMLSpanElement;

// Synth setup
let synth: any = new Tone.PolySynth(Tone.Synth).toDestination();
synth.volume.value = -10;

// Create synth based on type
function createSynth(type: string): any {
  const volume = synth.volume.value;
  synth.dispose();

  let newSynth: any;

  switch (type) {
    case 'AMSynth':
      newSynth = new Tone.PolySynth(Tone.AMSynth).toDestination();
      break;
    case 'FMSynth':
      newSynth = new Tone.PolySynth(Tone.FMSynth).toDestination();
      break;
    case 'MonoSynth':
      newSynth = new Tone.PolySynth(Tone.MonoSynth).toDestination();
      break;
    case 'DuoSynth':
      newSynth = new Tone.PolySynth(Tone.DuoSynth).toDestination();
      break;
    default:
      newSynth = new Tone.PolySynth(Tone.Synth).toDestination();
  }

  newSynth.volume.value = volume;
  return newSynth;
}

let midiData: Midi | null = null;
let isLooping = true;
let currentPart: Tone.Part | null = null;

// Get transport instance
const transport = Tone.getTransport();

// Load MIDI file
async function loadMidi(fileName: string = 'test1.mid') {
  try {
    statusText.textContent = 'Loading MIDI...';
    // Use relative path to work with both dev and production builds
    const response = await fetch(`./sound/${fileName}`);
    const arrayBuffer = await response.arrayBuffer();
    midiData = new Midi(arrayBuffer);
    currentFileText.textContent = fileName;
    statusText.textContent = 'MIDI Loaded';
    console.log('MIDI loaded:', midiData.name);
    console.log('Duration:', midiData.duration, 'seconds');
    console.log('Tracks:', midiData.tracks.length);
  } catch (error) {
    statusText.textContent = 'Error loading MIDI';
    console.error('Failed to load MIDI:', error);
  }
}

// Play MIDI
function playMidi() {
  if (!midiData) {
    console.error('MIDI not loaded');
    return;
  }

  // Stop existing part if any
  if (currentPart) {
    currentPart.stop(0);
    currentPart.dispose();
  }

  // Reset transport to avoid timing issues
  transport.stop();
  transport.position = 0;

  // Start Tone.js audio context
  Tone.start();

  // Schedule all notes from all tracks
  const events: Array<{ time: number; note: string; duration: number; velocity: number }> = [];

  midiData.tracks.forEach((track: any) => {
    track.notes.forEach((note: any) => {
      events.push({
        time: note.time,
        note: note.name,
        duration: note.duration,
        velocity: note.velocity,
      });
    });
  });

  // Create a Part for looping
  currentPart = new Tone.Part((time: number, event: any) => {
    synth.triggerAttackRelease(
      event.note,
      event.duration,
      time,
      event.velocity
    );
  }, events);

  // Set loop
  currentPart.loop = isLooping;
  // Add small epsilon to avoid floating point errors
  currentPart.loopEnd = Math.max(0.01, midiData.duration);

  // Start playback
  currentPart.start(0);
  transport.start();

  statusText.textContent = 'Playing';
  updateTimeDisplay();
}

// Stop playback
function stopMidi() {
  if (currentPart) {
    currentPart.stop(0);
  }
  transport.stop();
  transport.cancel(0);
  transport.position = 0;
  statusText.textContent = 'Stopped';
  timeText.textContent = '0.00';
}

// Toggle loop
function toggleLoop() {
  isLooping = !isLooping;
  if (currentPart) {
    currentPart.loop = isLooping;
  }
  loopBtn.textContent = `Loop: ${isLooping ? 'ON' : 'OFF'}`;
  loopStatusText.textContent = isLooping ? 'Enabled' : 'Disabled';
}

// Update time display
function updateTimeDisplay() {
  const updateTime = () => {
    if (transport.state === 'started') {
      timeText.textContent = transport.seconds.toFixed(2);
      requestAnimationFrame(updateTime);
    }
  };
  updateTime();
}

// Event listeners
loadBtn.addEventListener('click', () => {
  const selectedFile = midiSelect.value;
  loadMidi(selectedFile);
});

playBtn.addEventListener('click', playMidi);
stopBtn.addEventListener('click', stopMidi);
loopBtn.addEventListener('click', toggleLoop);

synthSelect.addEventListener('change', (e) => {
  const selectedType = (e.target as HTMLSelectElement).value;
  synth = createSynth(selectedType);
  // Apply current waveform to new synth
  updateWaveform(waveformSelect.value);
  console.log('Synth changed to:', selectedType);
});

waveformSelect.addEventListener('change', (e) => {
  const selectedWaveform = (e.target as HTMLSelectElement).value;
  updateWaveform(selectedWaveform);
  console.log('Waveform changed to:', selectedWaveform);
});

// Update synth waveform
function updateWaveform(waveformType: string) {
  // Set waveform for all voices in PolySynth
  synth.set({
    oscillator: {
      type: waveformType
    }
  });
}

volumeSlider.addEventListener('input', (e) => {
  const value = parseFloat((e.target as HTMLInputElement).value);
  synth.volume.value = value;
  volumeValue.textContent = `${value} dB`;
});

// Initialize with default file
loadMidi('test1.mid');
