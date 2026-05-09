'use client'

import { useCallback } from 'react'
import type { Song, VoicePart, SongPrefs } from '@/lib/types'
import { savePrefs, loadPrefs, saveGlobalVoicePref, loadGlobalVoicePref } from '@/lib/storage'
import { parseVoiceParts } from '@/lib/parseVoiceParts'

// "T1_1" → "T1", "B2" → "B2"
function baseVoice(label: string): string {
  return label.split('_')[0]
}

function findBestPart(parts: VoicePart[], label: string): VoicePart | undefined {
  // Exact match first
  const exact = parts.find((p) => p.label === label)
  if (exact) return exact
  // Base match: global "T1" matches "T1_1", global "T1_1" matches "T1"
  const base = baseVoice(label)
  return parts.find((p) => baseVoice(p.label) === base)
}

export function usePrefs() {
  const getInitialPart = useCallback((song: Song): VoicePart | null => {
    const parts = parseVoiceParts(song.files)
    if (parts.length === 0) return null

    const prefs = loadPrefs(song.name)
    const globalVoice = loadGlobalVoicePref()

    // Priority: per-song saved preference → global voice preference → first part
    if (prefs?.voicePart) {
      const match = findBestPart(parts, prefs.voicePart)
      if (match) return match
    }
    if (globalVoice) {
      const match = findBestPart(parts, globalVoice)
      if (match) return match
    }
    return parts[0]
  }, [])

  // Called when the user explicitly picks a voice — saves both per-song and global
  const saveVoicePref = useCallback((song: Song, label: string) => {
    const existing = loadPrefs(song.name) ?? {}
    savePrefs(song.name, { ...existing, voicePart: label })
    saveGlobalVoicePref(label)
  }, [])

  const saveSongPrefs = useCallback((song: Song, prefs: SongPrefs) => {
    savePrefs(song.name, prefs)
    if (prefs.voicePart) saveGlobalVoicePref(prefs.voicePart)
  }, [])

  const loadSongPrefs = useCallback((song: Song): SongPrefs | null => {
    return loadPrefs(song.name)
  }, [])

  return { getInitialPart, saveVoicePref, saveSongPrefs, loadSongPrefs }
}
