# DnS øveapp — Conventions

> Read this before adding any feature. These rules keep the codebase consistent and prevent the recurring bugs from the vanilla-JS era.

---

## Project overview

Next.js 15 App Router · TypeScript strict · Zustand · CSS Modules  
Deployed as a **static export** (`output: 'export'`) to GitHub Pages.

---

## File structure rules

| Rule | Rationale |
|---|---|
| One component per file | Easy to find, easy to test |
| If a component has sub-components → use a folder with `index.tsx` re-export | Keeps imports clean |
| All audio/canvas side-effects go in `src/hooks/` — never inside components | Components stay pure JSX |
| All `localStorage` access goes through `src/lib/storage.ts` — never call it directly | Single place to audit, version-gate and mock |
| All asset paths go through `assetUrl()` from `src/lib/assetUrl.ts` | Required for GitHub Pages `basePath` to work |
| New data shapes → update `src/lib/types.ts` first | Types are the source of truth |

---

## Asset paths — CRITICAL

```ts
// ✅ Correct
import { assetUrl } from '@/lib/assetUrl'
audio.src = assetUrl(`/${song.folder}/${part.file}`)

// ❌ Wrong — breaks on GitHub Pages because basePath is missing
audio.src = `/${song.folder}/${part.file}`
```

This applies to: `audio.src`, `pdfjsLib.getDocument()`, `fetch()` for songs.json and lyrics.

---

## PDF rendering — iframe is BANNED

```ts
// ❌ Never — shows only one page on iPad, broken on mobile
<iframe src={pdfUrl} />

// ✅ Always — use the usePdf hook (PDF.js canvas, all pages, all devices)
import { usePdf } from '@/hooks/usePdf'
const { containerRef, loading, render } = usePdf()
```

---

## Audio singleton pattern

The `HTMLAudioElement` and `AudioContext` / `GainNode` are **module-level singletons** in `useAudio.ts` and `useWebAudio.ts`. This survives React StrictMode double-mount.

```ts
// Module level — outside the hook function:
let _audio: HTMLAudioElement | null = null
const getAudio = () => {
  if (!_audio && typeof window !== 'undefined') _audio = new Audio()
  return _audio!
}
```

**Never** create `new Audio()` or `new AudioContext()` inside a component or `useEffect`.

---

## AudioContext must be created from a user gesture

```ts
// ✅ Called directly from onClick — iOS allows it
<button onClick={() => { ensureAudioGraph(); togglePlay() }}>Play</button>

// ❌ Called from useEffect — iOS blocks it
useEffect(() => { ensureAudioGraph() }, [])
```

---

## Zustand store (`src/store/playerStore.ts`)

Used for **cross-cutting** state that multiple components need:
- `currentSong`, `currentPart`, `activeLoop`, `viewMode`, `isPlaying`

**Not** used for:
- `currentTime`, `duration` — these update at 60fps; keep them in local state via `useAudio`'s `onTimeUpdate` callback
- Anything only one component cares about

---

## CSS — Modules only

```ts
// ✅ CSS Module
import styles from './MyComponent.module.css'
<div className={styles.wrapper}>

// ❌ No inline styles (except CSS custom properties set dynamically)
<div style={{ color: 'red' }}>

// ✅ Exception: setting CSS custom properties dynamically is fine
<div style={{ '--audio-panel-height': `${pct}%` } as React.CSSProperties}>
```

CSS variables (colors, sizes) belong in `src/app/globals.css` → `:root {}`.  
Component-specific styles belong in the component's `.module.css` file.

---

## Static export checklist

Every dynamic route **must** have `generateStaticParams`:

```ts
export async function generateStaticParams() {
  const songs = await getSongs()
  return songs.map((s) => ({ slug: encodeURIComponent(s.folder) }))
}
```

After adding pages: `npm run build` → check the route table shows `●` (SSG).

---

## localStorage versioning

- Bump `APP_VERSION` in `src/lib/storage.ts` to wipe all non-section prefs on next user visit (voice pref, speed, etc.)
- Bump `CACHE_VERSION` in `public/sw.js` to force the service worker to re-fetch all cached files

---

## songs.json is the source of truth

Never hardcode song names, folder paths, or file names in code.  
All songs come from `public/songs.json` via `getSongs()`.

---

## Commit checklist

1. `npm run build` — zero TypeScript errors, zero ESLint errors
2. `npx serve out` — verify full app works from `out/` (catches `assetUrl` / basePath issues)
3. Check that any new asset path uses `assetUrl()`
4. If localStorage schema changed → bump `APP_VERSION`
