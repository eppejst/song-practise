'use client'

import { useEffect } from 'react'
import { getAudio } from './useAudio'

export function useMediaSession(songName: string, partDisplayName: string) {
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const audio = getAudio()

    navigator.mediaSession.metadata = new MediaMetadata({
      title: partDisplayName,
      artist: songName,
      album: 'DnS øveapp',
    })

    navigator.mediaSession.setActionHandler('play', () => audio.play().catch(console.error))
    navigator.mediaSession.setActionHandler('pause', () => audio.pause())
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10)
    })
    navigator.mediaSession.setActionHandler('seekforward', () => {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10)
    })
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) audio.currentTime = details.seekTime
    })
  }, [songName, partDisplayName])
}
