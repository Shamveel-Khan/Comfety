export type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
export type RecognitionEngine = {
 lang: string; continuous: boolean; interimResults: boolean;
 onresult: ((event: RecognitionEvent) => void) | null; onstart: (() => void) | null;
 onend: (() => void) | null; onerror: ((event: {error: string}) => void) | null;
 start(): void; abort(): void;
};
export type RecognitionCallbacks = { transcript: (final: string, interim: string) => void; status: (value: string) => void; error: (message: string) => void };
export interface SpeechRecognizer { start(language: string): void; stop(): void; pause(): void; resume(): void; dispose(): void; readonly wanted: boolean }
export function mergeResults(results: ArrayLike<RecognitionResult>) {
 let final = '', interim = '';
 for (let i = 0; i < results.length; i++) {
  if (results[i].isFinal) final += results[i][0].transcript + ' ';
  else interim += results[i][0].transcript + ' ';
 }
 return {final: final.trim(), interim: interim.trim()};
}
const messages: Record<string,string> = {
 'not-allowed':'Microphone permission was denied. Allow microphone access in your browser settings, then try again.',
 'service-not-allowed':'Speech recognition is unavailable in this browser. You can still type and speak replies.',
 'audio-capture':'No microphone was found. Check your microphone and try again.',
 'network':'Speech recognition lost its connection. Check your internet and tap Start listening.',
 'language-not-supported':'This recognition language is unavailable on your device. Try the other language.',
 'no-speech':'No speech detected. Move closer to the speaker and try again.'
};
export class BrowserRecognizer implements SpeechRecognizer {
 wanted = false;
 private engine: RecognitionEngine | null = null;
 private language = 'en-US';
 private timer: ReturnType<typeof setTimeout> | undefined;
 private paused = false;
 private emptyEnds = 0;
 constructor(private factory: (()=>RecognitionEngine) | null, private callbacks: RecognitionCallbacks) {}
 start(language: string) { this.stop(); this.language = language; this.wanted = true; this.paused = false; this.emptyEnds = 0; this.launch(); }
 private launch() {
  if (!this.wanted || this.paused) return;
  if (!this.factory) { this.fail('Speech recognition is not available here. Try Chrome on Android. You can still type replies.'); return; }
  const engine = this.factory(); this.engine = engine;
  engine.lang = this.language; engine.continuous = true; engine.interimResults = true;
  let heard = false;
  engine.onstart = () => this.callbacks.status('listening');
  engine.onresult = e => { heard = true; this.emptyEnds = 0; const t = mergeResults(e.results); this.callbacks.transcript(t.final,t.interim); };
  engine.onerror = e => {
   if (e.error === 'aborted') return;
   this.fail(messages[e.error] || `Recognition stopped (${e.error}). Tap Start listening to try again.`);
  };
  engine.onend = () => {
   if (this.engine !== engine) return;
   this.engine = null;
   this.callbacks.transcript('', ''); // commit current session in the UI
   if (this.wanted && !this.paused) {
    if (!heard) this.emptyEnds++;
    if (this.emptyEnds >= 3) { this.fail('Listening stopped repeatedly. Check your connection and tap Start listening to retry.'); return; }
    this.callbacks.status('reconnecting');
    this.timer = setTimeout(()=>this.launch(),500);
   }
  };
  this.callbacks.status('starting');
  try { engine.start(); } catch { this.fail('Could not start listening. Please try again.'); }
 }
 private detach() {
  clearTimeout(this.timer);
  const engine = this.engine; this.engine = null;
  if (engine) { engine.onresult = engine.onstart = engine.onend = engine.onerror = null; try {engine.abort();} catch { /* already stopped */ } }
 }
 private fail(message: string) { this.wanted = false; this.detach(); this.callbacks.status('idle'); this.callbacks.error(message); }
 stop() { this.wanted = false; this.paused = false; this.detach(); this.callbacks.status('idle'); }
 pause() { this.paused = true; this.detach(); this.callbacks.status(this.wanted ? 'paused' : 'idle'); }
 resume() { if (this.wanted && this.paused) { this.paused = false; this.launch(); } }
 dispose() { this.stop(); }
}
export interface SpeechSpeaker { voices(): SpeechSynthesisVoice[]; speak(text: string, voice: string, language: string, rate: number, done: (error?: string)=>void): void; cancel(): void }
export class BrowserSpeaker implements SpeechSpeaker {
 private generation = 0;
 constructor(private synth: SpeechSynthesis | undefined) {}
 voices() { return this.synth?.getVoices() || []; }
 speak(text: string, voice: string, language: string, rate: number, done: (error?: string)=>void) {
  this.cancel();
  if (!this.synth) { done('Speech output is unavailable in this browser.'); return; }
  const generation = this.generation;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = this.voices().find(v=>v.voiceURI === voice) || this.voices().find(v=>v.lang === language) || null;
  utterance.lang = utterance.voice?.lang || language; utterance.rate = rate;
  utterance.onend = ()=> { if (generation === this.generation) done(); };
  utterance.onerror = ()=> { if (generation === this.generation) done('Could not speak this reply. Check your device’s voice settings and try again.'); };
  this.synth.speak(utterance);
 }
 cancel() { this.generation++; this.synth?.cancel(); }
}
export function recognitionFactory(): (()=>RecognitionEngine) | null {
 const w = window as unknown as {SpeechRecognition?: new()=>RecognitionEngine; webkitSpeechRecognition?: new()=>RecognitionEngine};
 const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
 return Constructor ? ()=>new Constructor() : null;
}
