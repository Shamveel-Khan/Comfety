import { useEffect, useRef, useState } from 'react';
import { AudioLines, ArrowDown, ArrowUp, Check, ChevronDown, CircleHelp, Heart, MessageCircle, Mic, MicOff, Plus, Settings, ShieldCheck, Sparkles, Square, Trash2, Volume2, X, Pencil, Download } from 'lucide-react';
import { defaults, load, persist, type Phrase, type Saved } from './storage';
import { BrowserRecognizer, BrowserSpeaker, recognitionFactory } from './speech';

type Turn = {id: string; text: string; speaker: 'them'|'you'; time: string};
type InstallEvent = Event & { prompt(): Promise<void> };
const time = ()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
export default function App() {
 const [saved,setSaved] = useState<Saved>(()=>{try{return load(localStorage);}catch{return structuredClone(defaults);}});
 const [storageError,setStorageError] = useState(false);
 const [turns,setTurns] = useState<Turn[]>([]);
 const [partial,setPartial] = useState({final:'',interim:''});
 const partialRef = useRef(partial);
 const [status,setStatus] = useState('idle');
 const [speaking,setSpeaking] = useState(false);
 const [error,setError] = useState('');
 const [reply,setReply] = useState('');
 const [settings,setSettings] = useState(false);
 const [help,setHelp] = useState(false);
 const [category,setCategory] = useState('All phrases');
 const [editing,setEditing] = useState<Phrase|null>(null);
 const [managing,setManaging] = useState(false);
 const [voices,setVoices] = useState<SpeechSynthesisVoice[]>([]);
 const [install,setInstall] = useState<InstallEvent|null>(null);
 const [online,setOnline] = useState(navigator.onLine);
 const recognizer = useRef<BrowserRecognizer|null>(null);
 const speaker = useRef<BrowserSpeaker|null>(null);
 const transcriptBottom = useRef<HTMLDivElement>(null);
 const editor = useRef<HTMLTextAreaElement>(null);
 const dialog = useRef<HTMLDialogElement>(null);
 const modalOpen = settings || help || editing !== null;
 const prefs = saved.preferences;
 const patchPrefs = (patch: Partial<typeof prefs>)=>setSaved(s=>({...s,preferences:{...s.preferences,...patch}}));
 function commitPartial() {
  if(partialRef.current.final) setTurns(t=>[...t,{id:crypto.randomUUID(),speaker:'them',text:partialRef.current.final,time:time()}]);
  partialRef.current = {final:'',interim:''}; setPartial(partialRef.current);
 }
 useEffect(()=>{
  const output = new BrowserSpeaker(window.speechSynthesis); speaker.current = output;
  const refresh = ()=>setVoices(output.voices()); refresh();
  window.speechSynthesis?.addEventListener('voiceschanged',refresh);
  const input = new BrowserRecognizer(recognitionFactory(),{
   transcript:(final,interim)=>{
    if(!final && !interim) {commitPartial(); return;}
    partialRef.current = {final,interim}; setPartial(partialRef.current);
   }, status:setStatus,error:setError
  }); recognizer.current = input;
  const hidden = ()=>{if(document.hidden) {input.stop();output.cancel();setSpeaking(false);commitPartial();}};
  const connection = ()=>setOnline(navigator.onLine);
  const beforeInstall = (event: Event)=>{event.preventDefault();setInstall(event as InstallEvent);};
  document.addEventListener('visibilitychange',hidden);
  window.addEventListener('online',connection);window.addEventListener('offline',connection);
  window.addEventListener('beforeinstallprompt',beforeInstall);
  return ()=>{input.dispose();output.cancel();window.speechSynthesis?.removeEventListener('voiceschanged',refresh);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('online',connection);window.removeEventListener('offline',connection);window.removeEventListener('beforeinstallprompt',beforeInstall);};
 },[]);
 useEffect(()=>{try{setStorageError(!persist(localStorage,saved));}catch{setStorageError(true);}},[saved]);
 useEffect(()=>{transcriptBottom.current?.scrollIntoView({block:'nearest'});},[turns,partial]);
 useEffect(()=>{if(modalOpen) dialog.current?.showModal();else dialog.current?.close();},[modalOpen]);
 function closeModal(){setSettings(false);setHelp(false);setEditing(null);}
 function stopSpeaking(){speaker.current?.cancel();setSpeaking(false);if(!document.hidden)recognizer.current?.resume();}
 function speak(text: string, preview = false) {
  if(!text.trim()) return;
  setError(''); commitPartial(); recognizer.current?.pause(); setSpeaking(true);
  if(!preview) setTurns(t=>[...t,{id:crypto.randomUUID(),speaker:'you',text,time:time()}]);
  speaker.current?.speak(text,prefs.voice,prefs.language,prefs.rate,(message)=>{setSpeaking(false);if(message)setError(message);if(!document.hidden)recognizer.current?.resume();});
 }
 function toggleListening(){setError('');if(recognizer.current?.wanted){recognizer.current.stop();commitPartial();}else{speaker.current?.cancel();setSpeaking(false);commitPartial();recognizer.current?.start(prefs.language);}}
 function movePhrase(id: string, direction: number){setSaved(s=>{const phrases=[...s.phrases];const i=phrases.findIndex(p=>p.id===id);if(i+direction<0||i+direction>=phrases.length)return s;[phrases[i],phrases[i+direction]]=[phrases[i+direction],phrases[i]];return {...s,phrases};});}
 const active = ['listening','starting','reconnecting','paused'].includes(status);
 const categories=['All phrases','Everyday','Help','Out & about'];
 return <div className="app" style={{'--text-scale':prefs.textSize} as React.CSSProperties}>
  <header className="topbar"><a className="brand" href="/" aria-label="Comfety home"><span className="brand-icon"><AudioLines size={24}/></span>comfety<span className="brand-dot">.</span></a><div className="header-right"><span className="mode-badge"><span/> Conversation mode</span><button className="icon-button" aria-label="Help and installation" onClick={()=>setHelp(true)}><CircleHelp size={21}/></button><button className="icon-button" aria-label="Settings" onClick={()=>setSettings(true)}><Settings size={21}/></button></div></header>
  <main><section className="intro"><div><p className="eyebrow">YOUR WORDS. YOUR WAY.</p><h1>A little help being heard<span>.</span></h1><p className="subtitle">Listen, type, and keep the conversation going.</p></div><div className="intro-note"><Heart size={18}/><span>A space for every voice.</span></div></section>
  {!online && <p className="notice" role="status">You’re offline. Saved phrases are available; speech features may need an internet connection.</p>}
  {storageError && <p className="notice" role="status">Your browser couldn’t save changes. Keep this page open to retain your phrases and preferences.</p>}
  {error && <div className="notice error" role="alert"><span>{error}</span><button className="icon-button" aria-label="Dismiss error" onClick={()=>setError('')}><X size={18}/></button></div>}
  <div className="workspace"><div className="conversation-column">
   <section className="card conversation"><div className="card-header"><div className="section-title"><MessageCircle size={19}/><h2>The conversation</h2></div><button className="text-button" disabled={!turns.length&&!partial.final&&!partial.interim} onClick={()=>{recognizer.current?.stop();speaker.current?.cancel();setSpeaking(false);setTurns([]);partialRef.current={final:'',interim:''};setPartial(partialRef.current);}}> <Trash2 size={15}/>Clear</button></div>
    <div className="transcript" role="log" aria-label="Conversation transcript" aria-live="polite" aria-relevant="additions text">
     {!turns.length&&!partial.final&&!partial.interim ? <div className="empty-state"><div className={'listening-art '+(status==='listening'?'animated':'')}><span/><span/><span/><span/><span/><span/><span/></div><h3>{status==='listening'?'I’m listening…':'Every conversation starts here.'}</h3><p>{status==='listening'?'The other person’s words will appear as they speak.':'Tap “Start listening” to see the other person’s words appear here.'}</p><span className="language-note">English & اردو</span></div> : <><div className="session-divider"><span/>THIS CONVERSATION<span/></div>{turns.map(turn=><article className={'turn '+turn.speaker} key={turn.id}><div className="turn-label">{turn.speaker==='you'?'YOU · SPOKEN REPLY':'OTHER PERSON'}<time>{turn.time}</time></div><p dir="auto">{turn.text}</p></article>)}{(partial.final||partial.interim)&&<article className="turn them"><div className="turn-label">OTHER PERSON · LIVE</div><p dir="auto">{partial.final} <span className="interim">{partial.interim}</span></p></article>}</>}
     <div ref={transcriptBottom}/>
    </div>
    <div className="listen-bar"><div className="language-picker"><label htmlFor="recognition-language">Listening language</label><div><select id="recognition-language" value={prefs.language} onChange={e=>{const language=e.target.value;patchPrefs({language});commitPartial();if(recognizer.current?.wanted){recognizer.current.start(language);if(speaking)recognizer.current.pause();}}}><option value="en-US">English</option><option value="ur-PK">اردو · Urdu</option></select><ChevronDown size={14}/></div></div><button className={'button '+(active?'listening-button':'primary')} onClick={toggleListening}>{active?<MicOff size={18}/>:<Mic size={18}/>} {active?'Stop listening':'Start listening'}</button></div>
   </section>
   <section className="card compose"><div className="card-header"><div className="section-title"><Pencil size={18}/><h2>Your reply</h2></div><span className="quiet-label">Type it. We’ll say it.</span></div><label className="sr-only" htmlFor="reply">Type your reply</label><textarea id="reply" ref={editor} dir="auto" value={reply} onChange={e=>setReply(e.target.value)} placeholder="What would you like to say?"/><div className="compose-bottom"><button className="voice-shortcut" onClick={()=>setSettings(true)}><Volume2 size={16}/><span>{voices.find(v=>v.voiceURI===prefs.voice)?.name||'Device voice'}</span><ChevronDown size={13}/></button><button className="button primary" disabled={!speaking&&!reply.trim()} onClick={()=>speaking?stopSpeaking():speak(reply)}>{speaking?<Square size={17}/>:<Volume2 size={18}/>} {speaking?'Stop speaking':'Speak reply'}</button></div></section>
   <p className="privacy-note"><ShieldCheck size={15}/>Your conversation stays on this page. No history is saved.</p>
  </div>
  <aside className="card quick-replies"><div className="card-header"><div className="section-title"><Sparkles size={19}/><h2>A few words, ready.</h2></div><button className="icon-button" aria-label="Add saved phrase" onClick={()=>setEditing({id:crypto.randomUUID(),text:'',category:'Everyday'})}><Plus size={21}/></button></div><p className="aside-description">Little shortcuts for everyday moments.</p><div className="tabs" aria-label="Phrase category">{categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)} aria-pressed={category===c}>{c}</button>)}</div><div className="phrase-list">{saved.phrases.filter(p=>category==='All phrases'||category===p.category).map(p=><div className="phrase-item" key={p.id}><button className="phrase" dir="auto" onClick={()=>{setReply(p.text);editor.current?.focus();}}>{p.text}<span aria-hidden="true">↗</span></button>{managing&&<div className="phrase-tools"><button aria-label={'Move up: '+p.text} onClick={()=>movePhrase(p.id,-1)} disabled={saved.phrases[0]?.id===p.id}><ArrowUp size={16}/></button><button aria-label={'Move down: '+p.text} onClick={()=>movePhrase(p.id,1)} disabled={saved.phrases.at(-1)?.id===p.id}><ArrowDown size={16}/></button><button aria-label={'Edit: '+p.text} onClick={()=>setEditing(p)}><Pencil size={16}/></button><button aria-label={'Delete: '+p.text} onClick={()=>setSaved(s=>({...s,phrases:s.phrases.filter(v=>v.id!==p.id)}))}><Trash2 size={16}/></button></div>}</div>)}{!saved.phrases.some(p=>category==='All phrases'||category===p.category)&&<p className="no-phrases">No phrases yet. Add a phrase to make it yours.</p>}</div><button className="add-phrase" onClick={()=>setEditing({id:crypto.randomUUID(),text:reply,category:category==='All phrases'?'Everyday':category})}><Plus size={16}/>Add your own phrase</button><button className="text-button manage" onClick={()=>setManaging(!managing)}>{managing?<Check size={15}/>:<Settings size={15}/>} {managing?'Done managing':'Manage phrases'}</button><div className="phrase-tip"><span className="tip-icon"><MessageCircle size={19}/></span><p>A familiar phrase can go a long way.<br/><strong>Make these your own.</strong></p></div></aside>
  </div><footer><span><span className={'status-dot '+(status==='listening'?'live':'')}/>{speaking?'Speaking your words':status==='listening'?'Listening to the other person':status==='starting'?'Starting microphone…':status==='reconnecting'?'Reconnecting microphone…':status==='paused'?'Listening paused':'Ready when you are'}</span><span>Made for connection <Heart size={12}/></span></footer>
  </main>
  <dialog ref={dialog} onCancel={closeModal} onClick={e=>{if(e.target===dialog.current)closeModal();}}><div className="modal-header"><h2>{settings?'Make yourself comfortable':help?'A little guidance':'Your everyday words'}</h2><button className="icon-button" aria-label="Close dialog" onClick={closeModal}><X size={21}/></button></div>
   {settings&&<div className="modal-content"><label htmlFor="voice">Your speaking voice</label><select id="voice" value={prefs.voice} onChange={e=>patchPrefs({voice:e.target.value})}><option value="">Device default</option>{voices.map((v,i)=><option key={v.voiceURI+i} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select><p className="field-note">{voices.length} device voices available. Voice quality and Urdu pronunciation depend on your device. {voices.length<4?'This device currently provides fewer than the four voices requested in the brief.':''}</p>{prefs.voice&&!voices.some(v=>v.voiceURI===prefs.voice)&&<p className="field-note">Your saved voice is unavailable. Playback will use a matching language voice or device default.</p>}<button className="button secondary" onClick={()=>speaking?stopSpeaking():speak(prefs.language==='ur-PK'?'السلام علیکم۔ آپ سے مل کر خوشی ہوئی۔':'Hello. It’s nice to meet you.',true)}>{speaking?<Square size={17}/>:<Volume2 size={17}/>} {speaking?'Stop preview':'Preview voice'}</button><label htmlFor="rate">Speaking speed <span>{prefs.rate.toFixed(1)}×</span></label><input id="rate" type="range" min="0.6" max="1.4" step="0.1" value={prefs.rate} onChange={e=>patchPrefs({rate:Number(e.target.value)})}/><label htmlFor="text-size">Conversation text size</label><select id="text-size" value={prefs.textSize} onChange={e=>patchPrefs({textSize:Number(e.target.value)})}><option value="1">Comfortable</option><option value="1.15">Large</option><option value="1.3">Extra large</option></select><p className="field-note">Preferences and saved phrases are stored only in this browser.</p></div>}
   {help&&<div className="modal-content help"><p><strong>1. Listen.</strong> Choose English or Urdu and tap Start listening. Keep your phone close to the other person, especially in a noisy place.</p><p><strong>2. Reply.</strong> Type your words or choose a saved phrase. Tap Speak reply to say them aloud. Listening pauses during playback.</p><p><strong>3. Make it yours.</strong> Choose a device voice in Settings and save your everyday phrases.</p><h3>Browser speech, with a few limits</h3><p>Try Android Chrome first. Recognition, mixed Urdu/English speech, accuracy in noise, and natural voices vary by browser and device. Speech may be processed by your browser’s speech provider and may require internet. We do not record or store audio or transcripts.</p><h3>Keep Comfety close</h3><p>Install from your browser menu. On iPhone, use Share → Add to Home Screen. The app shell and saved phrases work offline; speech is not guaranteed offline.</p>{install&&<button className="button primary" onClick={async()=>{await install.prompt();setInstall(null);}}><Download size={18}/>Install Comfety</button>}</div>}
   {editing&&<form className="modal-content" onSubmit={e=>{e.preventDefault();if(!editing.text.trim())return;setSaved(s=>({...s,phrases:s.phrases.some(p=>p.id===editing.id)?s.phrases.map(p=>p.id===editing.id?editing:p):[...s.phrases,editing]}));setEditing(null);}}><label htmlFor="phrase-text">Your phrase</label><textarea id="phrase-text" autoFocus required dir="auto" value={editing.text} onChange={e=>setEditing({...editing,text:e.target.value})} placeholder="Words you use often…"/><label htmlFor="phrase-category">Category</label><select id="phrase-category" value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select><button className="button primary" disabled={!editing.text.trim()} type="submit"><Check size={17}/>Save phrase</button></form>}
  </dialog>
 </div>;
}
