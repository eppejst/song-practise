'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Song, VoicePart } from '@/lib/types'
import { usePlayerStore } from '@/store/playerStore'
import { usePrefs } from '@/hooks/usePrefs'
import { parseVoiceParts } from '@/lib/parseVoiceParts'
import { loadPanelSplit, savePanelSplit } from '@/lib/storage'
import { initStorage } from '@/lib/storage'
import { assetUrl } from '@/lib/assetUrl'
import PlayerHeader from './PlayerHeader'
import PdfPanel from './PdfPanel'
import AudioPanel from './AudioPanel'
import styles from './Player.module.css'

interface Props {
  song: Song
}

export default function Player({ song }: Props) {
  const { setCurrentSong, setCurrentPart, setViewMode, viewMode } = usePlayerStore()
  const { getInitialPart } = usePrefs()

  const [parts, setParts] = useState<VoicePart[]>([])
  const [currentPart, setLocalPart] = useState<VoicePart | null>(null)
  const [panelHeight, setPanelHeight] = useState(35) // percent for audio panel in sheet mode
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initStorage()
    const parsed = parseVoiceParts(song.files)
    setParts(parsed)
    const initial = getInitialPart(song)
    setLocalPart(initial)
    setCurrentSong(song)
    setCurrentPart(initial)

    // Default view mode: sheet music if PDF exists, else audio
    setViewMode(song.pdf ? 'sheet' : 'audio')

    // Load persisted panel split
    setPanelHeight(loadPanelSplit())
  }, [song, getInitialPart, setCurrentSong, setCurrentPart, setViewMode])

  const handlePartChange = useCallback((label: string) => {
    const part = parts.find((p) => p.label === label) ?? null
    setLocalPart(part)
    setCurrentPart(part)
  }, [parts, setCurrentPart])

  // Drag handle for resizing audio panel in sheet mode
  const dragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  const onDragStart = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    dragStartY.current = e.clientY
    dragStartHeight.current = panelHeight
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [panelHeight])

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return
    const totalH = containerRef.current.clientHeight
    const deltaY = dragStartY.current - e.clientY
    const deltaPct = (deltaY / totalH) * 100
    const newH = Math.min(60, Math.max(15, dragStartHeight.current + deltaPct))
    setPanelHeight(newH)
  }, [])

  const onDragEnd = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    savePanelSplit(panelHeight)
  }, [panelHeight])

  if (!currentPart && parts.length === 0) {
    return <div className={styles.loading}>Laster…</div>
  }

  const pdfUrl = song.pdf ? assetUrl(`/${song.folder}/${song.pdf}`) : undefined

  return (
    <div className={styles.screen}>
      <PlayerHeader
        song={song}
        parts={parts}
        currentPart={currentPart}
        onPartChange={handlePartChange}
        hasPdf={!!song.pdf}
      />

      <div
        ref={containerRef}
        className={`${styles.layout} ${viewMode === 'sheet' ? styles.sheetMode : styles.audioMode}`}
        style={{ '--audio-panel-height': `${panelHeight}%` } as React.CSSProperties}
      >
        {viewMode === 'sheet' && pdfUrl && (
          <>
            <PdfPanel url={pdfUrl} enabled={viewMode === 'sheet'} />
            <div
              className={styles.dragHandle}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
            />
          </>
        )}

        <div className={styles.audioPanelWrapper}>
          {currentPart && (
            <AudioPanel
              song={song}
              currentPart={currentPart}
            />
          )}
        </div>
      </div>
    </div>
  )
}
