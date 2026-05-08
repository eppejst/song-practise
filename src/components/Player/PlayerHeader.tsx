'use client'

import Link from 'next/link'
import type { Song, VoicePart } from '@/lib/types'
import { usePlayerStore } from '@/store/playerStore'
import styles from './Player.module.css'

interface Props {
  song: Song
  parts: VoicePart[]
  currentPart: VoicePart | null
  onPartChange: (label: string) => void
  hasPdf: boolean
}

export default function PlayerHeader({ song, parts, currentPart, onPartChange, hasPdf }: Props) {
  const { viewMode, setViewMode } = usePlayerStore()

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.backBtn} aria-label="Back">
        ←
      </Link>
      <h2 className={styles.title}>{song.name}</h2>

      {parts.length > 0 && (
        <select
          value={currentPart?.label ?? ''}
          onChange={(e) => onPartChange(e.target.value)}
          className={styles.voiceSelect}
        >
          {parts.map((p) => (
            <option key={p.label} value={p.label}>
              {p.displayName}
            </option>
          ))}
        </select>
      )}

      {hasPdf && (
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${viewMode === 'audio' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('audio')}
          >
            ♪ Audio
          </button>
          <button
            className={`${styles.modeBtn} ${viewMode === 'sheet' ? styles.modeBtnActive : ''}`}
            onClick={() => setViewMode('sheet')}
          >
            📄 Noter
          </button>
        </div>
      )}
    </header>
  )
}
