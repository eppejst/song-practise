import type { Section, SongPrefs } from './types'

const APP_VERSION = '1'
const VERSION_KEY = 'choir_app_version'

function storageKey(songName: string, partLabel: string, suffix: string): string {
  const s = songName.replace(/\s+/g, '_')
  const p = partLabel.replace(/\s+/g, '_')
  return `choir_app_${s}_${p}_${suffix}`
}

function songPrefsKey(songName: string): string {
  return `choir_app_${songName.replace(/\s+/g, '_')}_prefs`
}

/** Call once on app startup. Wipes all non-section prefs if APP_VERSION changed. */
export function initStorage(): void {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem(VERSION_KEY)
  if (stored !== APP_VERSION) {
    // Remove all keys except section data (which we preserve across version bumps)
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!
      if (key.startsWith('choir_app_') && !key.endsWith('_sections')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    localStorage.setItem(VERSION_KEY, APP_VERSION)
  }
}

export function saveSections(songName: string, partLabel: string, sections: Section[]): void {
  if (typeof window === 'undefined') return
  const key = storageKey(songName, partLabel, 'sections')
  localStorage.setItem(key, JSON.stringify(sections))
}

export function loadSections(songName: string, partLabel: string): Section[] {
  if (typeof window === 'undefined') return []
  const key = storageKey(songName, partLabel, 'sections')
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? []
  } catch {
    return []
  }
}

export function savePrefs(songName: string, prefs: SongPrefs): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(songPrefsKey(songName), JSON.stringify(prefs))
}

export function loadPrefs(songName: string): SongPrefs | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(songPrefsKey(songName)) ?? 'null')
  } catch {
    return null
  }
}

export function saveGlobalVoicePref(label: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('choir_app_global_voice', label)
}

export function loadGlobalVoicePref(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('choir_app_global_voice')
}

export function savePanelSplit(pct: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('choir_app_panel_split', String(pct))
}

export function loadPanelSplit(): number {
  if (typeof window === 'undefined') return 35
  const v = parseFloat(localStorage.getItem('choir_app_panel_split') ?? 'NaN')
  return isNaN(v) ? 35 : Math.min(60, Math.max(15, v))
}
