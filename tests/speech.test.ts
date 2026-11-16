import { describe, it, expect, vi, afterEach } from 'vitest';
import { BrowserRecognizer, BrowserSpeaker, mergeResults, type RecognitionEngine } from '../src/speech';
import { defaults, load, persist } from '../src/storage';
function setup() {
 const engines: RecognitionEngine[] = [];
 const callbacks = { transcript:vi.fn(),status:vi.fn(),error:vi.fn() };
 const factory=()=>{const e: RecognitionEngine={lang:'',continuous:false,interimResults:false,onresult:null,onstart:null,onend:null,onerror:null,start:vi.fn(),abort:vi.fn()};engines.push(e);return e;};
 return {engines,callbacks,input:new BrowserRecognizer(factory,callbacks)};
}
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
describe('recognition lifecycle',()=>{
 it('replaces interim results without appending duplicate finalized text',()=>{
 const results = [{isFinal:true,0:{transcript:'Hello'}},{isFinal:false,0:{transcript:'how'}}];
 expect(mergeResults(results)).toEqual({final:'Hello',interim:'how'});
 results[1]={isFinal:true,0:{transcript:'how are you'}};
 expect(mergeResults(results)).toEqual({final:'Hello how are you',interim:''});
 });
 it('pauses for speech, resumes only when wanted, and detaches old events',()=>{
 const {input,engines}=setup();input.start('ur-PK');expect(engines[0].lang).toBe('ur-PK');input.pause();expect(engines[0].abort).toHaveBeenCalled();expect(engines[0].onend).toBeNull();input.resume();expect(engines).toHaveLength(2);input.stop();input.resume();expect(engines).toHaveLength(2);
 });
 it('stops retrying after repeated empty sessions',()=>{
 vi.useFakeTimers();const {input,engines,callbacks}=setup();input.start('en-US');for(let i=0;i<3;i++){engines[i].onend?.();vi.runAllTimers();}expect(engines).toHaveLength(3);expect(input.wanted).toBe(false);expect(callbacks.error).toHaveBeenCalled();
 });
 it('does not restart after permission or network failures',()=>{
 vi.useFakeTimers();const {input,engines,callbacks}=setup();input.start('en-US');engines[0].onerror?.({error:'not-allowed'});vi.runAllTimers();expect(input.wanted).toBe(false);expect(engines).toHaveLength(1);expect(callbacks.error).toHaveBeenCalledWith(expect.stringContaining('permission'));
 });
 it('cancels a pending restart when the user stops',()=>{
 vi.useFakeTimers();const {input,engines}=setup();input.start('en-US');engines[0].onend?.();input.stop();vi.runAllTimers();expect(engines).toHaveLength(1);
 });
});
describe('speech output',()=>{
 it('passes exact text and selected voice, and ignores canceled completion',()=>{
 class Utterance {text:string;constructor(text:string){this.text=text;}}
 vi.stubGlobal('SpeechSynthesisUtterance',Utterance);
 const voice={voiceURI:'voice-1',lang:'ur-PK'} as SpeechSynthesisVoice;
 const synth={getVoices:()=>[voice],cancel:vi.fn(),speak:vi.fn()} as unknown as SpeechSynthesis;
 const output=new BrowserSpeaker(synth);const done=vi.fn();
 output.speak('  السلام علیکم! hello  ','voice-1','en-US',.9,done);
 const utterance=vi.mocked(synth.speak).mock.calls[0][0];
 expect(utterance.text).toBe('  السلام علیکم! hello  ');expect(utterance.voice).toBe(voice);expect(utterance.rate).toBe(.9);
 output.cancel();utterance.onend?.({} as SpeechSynthesisEvent);expect(done).not.toHaveBeenCalled();
 });
});
describe('local preferences',()=>{
 it('recovers from malformed or inaccessible storage',()=>{
 expect(load({getItem:()=>'{bad'})).toEqual(defaults);expect(load({getItem:()=>{throw Error();}})).toEqual(defaults);
 expect(load({getItem:()=>JSON.stringify({...defaults,preferences:{...defaults.preferences,rate:99}})})).toEqual(defaults);
 });
 it('round-trips edited phrases and reports quota errors',()=>{
 let json='';const state={...defaults,phrases:[{id:'x',text:'میرا نام',category:'Everyday'}]};
 expect(persist({setItem:(_,v)=>{json=v;}},state)).toBe(true);expect(load({getItem:()=>json})).toEqual(state);
 expect(persist({setItem:()=>{throw Error();}},state)).toBe(false);
 });
});
