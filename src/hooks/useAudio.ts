'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/store/playerStore'
import { assetUrl } from '@/lib/assetUrl'
import type { VoicePart } from '@/lib/types'

// Module-level singleton — survives React StrictMode double-mount
let _audio: HTMLAudioElement | null = null
function getAudio(): HTMLAudioElement {
  if (!_audio && typeof window !== 'undefined') {
    _audio = new Audio()
    _audio.preload = 'auto'
  }
  return _audio!
}

export function useAudio(onTimeUpdate?: () => void) {
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying)
  const isPlayingRef = useRef(false)

  useEffect(() => {
    const audio = getAudio()

    const handlePlay = () => {
      isPlayingRef.current = true
      setIsPlaying(true)
    }
    const handlePause = () => {
      isPlayingRef.current = false
      setIsPlaying(false)
    }
    const handleTimeUpdate = () => {
      onTimeUpdate?.()
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    if (onTimeUpdate) audio.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      if (onTimeUpdate) audio.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [onTimeUpdate, setIsPlaying])

  const loadPart = useCallback((part: VoicePart, songFolder: string) => {
    const audio = getAudio()
    const url = assetUrl(`/${songFolder}/${part.file}`)
    if (audio.src !== url) {
      audio.src = url
      audio.load()
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = getAudio()
    if (!audio.src) return
    if (audio.paused) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [])

  const seekTo = useCallback((time: number) => {
    const audio = getAudio()
    if (isFinite(audio.duration)) audio.currentTime = time
  }, [])

  const seekBySeconds = useCallback((delta: number) => {
    const audio = getAudio()
    if (!isFinite(audio.duration)) return
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta))
  }, [])

  const setSpeed = useCallback((speed: number) => {
    getAudio().playbackRate = speed
  }, [])

  const getTime = useCallback(() => getAudio().currentTime, [])
  const getDuration = useCallback(() => getAudio().duration || 0, [])
  const isPaused = useCallback(() => getAudio().paused, [])

  return { loadPart, togglePlay, seekTo, seekBySeconds, setSpeed, getTime, getDuration, isPaused }
}

export { getAudio }
