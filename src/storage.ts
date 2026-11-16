export type Phrase = { id: string; text: string; category: string };
export type Preferences = { language: string; voice: string; rate: number; textSize: number };
export type Saved = { version: 1; phrases: Phrase[]; preferences: Preferences };
export const defaults: Saved = { version: 1, preferences: { language: 'en-US', voice: '', rate: 1, textSize: 1 }, phrases: [
 {id:'1',text:'Hello! It’s nice to meet you.',category:'Everyday'},
 {id:'2',text:'Please give me a moment to type.',category:'Everyday'},
 {id:'3',text:'Could you please repeat that?',category:'Everyday'},
 {id:'4',text:'Thank you for your patience.',category:'Everyday'},
 {id:'5',text:'مجھے مدد کی ضرورت ہے۔',category:'Help'},
 {id:'6',text:'براہ کرم آہستہ بولیں۔',category:'Everyday'},
 {id:'7',text:'I need to see a doctor, please.',category:'Help'},
 {id:'8',text:'How much does this cost?',category:'Out & about'}
] };
export const storageKey = 'comfety.v1';
export function load(storage: Pick<Storage,'getItem'>): Saved {
 try {
 const value = JSON.parse(storage.getItem(storageKey) || 'null');
 if (value?.version !== 1 || !Array.isArray(value.phrases)) return structuredClone(defaults);
 const p = value.preferences;
 if (!p || !['en-US','ur-PK'].includes(p.language) || typeof p.voice !== 'string' || !Number.isFinite(p.rate) || p.rate < .6 || p.rate > 1.4 || ![1,1.15,1.3].includes(p.textSize)) return structuredClone(defaults);
 if (!value.phrases.every((v: Phrase) => v && typeof v.id === 'string' && typeof v.text === 'string' && v.text.trim() && typeof v.category === 'string') || new Set(value.phrases.map((v: Phrase) => v.id)).size !== value.phrases.length) return structuredClone(defaults);
 return value;
 } catch { return structuredClone(defaults); }
}
export function persist(storage: Pick<Storage,'setItem'>, value: Saved): boolean {
 try { storage.setItem(storageKey, JSON.stringify(value)); return true; } catch { return false; }
}
