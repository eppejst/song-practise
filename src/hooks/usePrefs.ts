'use client'

import { useCallback } from 'react'
import type { Song, VoicePart, SongPrefs } from '@/lib/types'
import { savePrefs, loadPrefs, saveGlobalVoicePref, loadGlobalVoicePref } from '@/lib/storage'
import { parseVoiceParts } from '@/lib/parseVoiceParts'

export function usePrefs() {
  const getInitialPart = useCallback((song: Song): VoicePart | null => {
    const parts = parseVoiceParts(song.files)
    if (parts.length === 0) return null

    const prefs = loadPrefs(song.name)
    const globalVoice = loadGlobalVoicePref()

    // Priority: per-song saved preference → global voice preference → first part
    if (prefs?.voicePart) {
      const match = parts.find((p) => p.label === prefs.voicePart)
      if (match) return match
    }
    if (globalVoice) {
      const match = parts.find((p) => p.label === globalVoice)
      if (match) return match
    }
    return parts[0]
  }, [])

  const saveSongPrefs = useCallback((song: Song, prefs: SongPrefs) => {
    savePrefs(song.name, prefs)
    if (prefs.voicePart) saveGlobalVoicePref(prefs.voicePart)
  }, [])

  const loadSongPrefs = useCallback((song: Song): SongPrefs | null => {
    return loadPrefs(song.name)
  }, [])

  return { getInitialPart, saveSongPrefs, loadSongPrefs }
}
