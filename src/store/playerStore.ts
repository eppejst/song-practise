import { create } from 'zustand'
import type { Song, VoicePart, ActiveLoop, ViewMode } from '@/lib/types'

interface PlayerState {
  currentSong: Song | null
  currentPart: VoicePart | null
  activeLoop: ActiveLoop | null
  viewMode: ViewMode
  isPlaying: boolean

  setCurrentSong: (song: Song | null) => void
  setCurrentPart: (part: VoicePart | null) => void
  setActiveLoop: (loop: ActiveLoop | null) => void
  setViewMode: (mode: ViewMode) => void
  setIsPlaying: (playing: boolean) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: null,
  currentPart: null,
  activeLoop: null,
  viewMode: 'audio',
  isPlaying: false,

  setCurrentSong: (song) => set({ currentSong: song }),
  setCurrentPart: (part) => set({ currentPart: part }),
  setActiveLoop: (loop) => set({ activeLoop: loop }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}))
