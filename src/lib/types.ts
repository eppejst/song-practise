export interface VoicePart {
  label: string        // e.g. 'T1', 'B2_1'
  displayName: string  // e.g. 'Tenor 1', 'Bass 2 (1)'
  file: string         // filename relative to song.folder
}

export interface Song {
  name: string
  folder: string       // e.g. 'songs/Backstreet medley'
  files: string[]
  pdf?: string
  lyrics?: string
  tags?: string[]
}

export type RepeatMode = 'none' | 'infinite' | 'count'

export interface Section {
  name: string
  start: number        // seconds
  end: number          // seconds
  repeatMode: RepeatMode
  repeatCount: number
}

export interface SongPrefs {
  voicePart?: string
  speed?: number
  channelL?: number
  channelR?: number
}

export type ViewMode = 'audio' | 'sheet'

export interface ActiveLoop {
  sectionIndex: number
  remaining: number    // Infinity for infinite mode
  total: number
}
