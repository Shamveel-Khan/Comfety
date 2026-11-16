# Comfety · Conversation

A phone-first, installable web app for Part A of the Comfety assessment: see the other person’s words, type a reply, and speak it aloud. Built with React, TypeScript, Vite, and the browser Web Speech APIs. No account, backend, API key, or paid speech service is required.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open the printed localhost URL. Microphone access requires a secure context: localhost on the same device or an HTTPS deployment. A phone accessing a computer’s plain HTTP LAN address usually cannot use the microphone.

```sh
npm test
npm run build
npm run preview
```

Deploy **only `dist/`** to a static HTTPS host with an index.html navigation fallback. The assessment PDF is outside the public folder and is not included in the build. Sites deployment configuration is in `.openai/hosting.json`.

## Use

1. Choose English or Urdu and tap **Start listening**. Allow microphone access.
2. Read live captions. Keep the microphone near the other speaker in noisy environments.
3. Type a reply, or tap a saved phrase to put it into the editor, then tap **Speak reply**.
4. Choose a voice, preview it, adjust speed, or enlarge text in Settings.
5. Add phrases with the plus button; use Manage phrases to edit, delete, and reorder them.

Playback temporarily pauses listening. Stop speaking resumes listening only if it was active. Hiding the page stops speech and listening; return and explicitly start again. Clearing the conversation stops both and removes its text. Replies are passed to the speech engine exactly as entered, without translation or rewriting.

Install from Chrome’s menu or, on iPhone, Share → Add to Home Screen. After the first successful online load, the application shell and saved phrases are available offline. Speech may still need a connection. Refresh after an app update to use the latest version.

## Browser limits and requirement gaps

Android Chrome is the primary target; iPhone Safari is secondary. Actual microphone, voice, and install support must be checked on a real phone. Recognition is feature-detected, with a useful error when unsupported. Type-to-speech depends on the browser exposing speech synthesis.

- English (`en-US`) and Urdu (`ur-PK`) are selectable recognition locales, not a guarantee that a device’s service supports either. Mixed sentences are best effort; there is no guaranteed automatic code-switching mode.
- Voices come from the device. The app offers all returned real voices, with previews, and reports when fewer than four are present. It cannot guarantee four voices, human-like delivery, Urdu pronunciation, or mixed-language pronunciation. Speed variants are not presented as separate voices.
- Noise resistance depends on the device’s recognition service. No custom noise filtering or unsupported accuracy claim is made.
- This is the agreed free-browser Part A demo, not full compliance with the PDF. Part B Guide Mode is not implemented.

## Privacy and storage

The application has no analytics, application server, audio recording, or transcript persistence. Conversation text lives in page memory. Browser/OS speech services may send audio or typed text to their own providers; “no app storage” does not mean speech processing is necessarily on-device. Web fonts are fetched from Google Fonts with system-font fallbacks.

Phrases and preferences are versioned in `localStorage` under `comfety.v1`. Malformed data falls back to defaults; denied/quota-exceeded storage displays a warning. Clearing browser site data removes saved phrases. Cached resources include the shell and assets only.

## Verification

`npm test` covers transcript merging, recognition stop/pause/resume and bounded retries, exact text playback and canceled callbacks, malformed settings recovery, and storage failures. `npm run build` checks strict TypeScript and creates the production output.

Real-device checks still needed before assessment submission:

- English, Urdu, and mixed sentences in quiet and noisy settings; record actual accuracy rather than promising it.
- Permission allow/deny, network loss, repeated session endings, and background/foreground transitions.
- Speaker playback is not transcribed; stop playback and recognition controls behave correctly.
- Voice previews, four distinct voices where present, long mixed-direction replies, enlarged text, and the on-screen keyboard.
- Install on Android/iPhone and reopen offline; microphone use from the deployed HTTPS origin.

## Part A demo script (about 2 minutes)

Show the app on a phone. Allow the microphone, demonstrate English then Urdu captions, type and speak a reply, choose a saved phrase, add a custom phrase, switch and preview a device voice, enlarge text, and reload to demonstrate saved preferences. State the device-dependent speech limitations. A full assessment demo would also need Part B; do not present this as that complete submission.
