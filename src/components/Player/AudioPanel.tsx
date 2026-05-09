'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Song, VoicePart } from '@/lib/types'
import { useAudio } from '@/hooks/useAudio'
import { useWebAudio } from '@/hooks/useWebAudio'
import { useSections } from '@/hooks/useSections'
import { usePrefs } from '@/hooks/usePrefs'
import { useTimeline } from '@/hooks/useTimeline'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useMediaSession } from '@/hooks/useMediaSession'
import { usePlayerStore } from '@/store/playerStore'
import { assetUrl } from '@/lib/assetUrl'
import SectionList from '@/components/Sections/SectionList'
import SectionModal from '@/components/Sections/SectionModal'
import styles from './AudioPanel.module.css'

const SPEEDS = [0.75, 1, 1.25, 1.5]

function formatTime(sec: number): string {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

interface Props {
  song: Song
  currentPart: VoicePart
}

export default function AudioPanel({ song, currentPart }: Props) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeedState] = useState(1)
  const [gainL, setGainL] = useState(1)
  const [gainR, setGainR] = useState(1)
  const [showStereoPopover, setShowStereoPopover] = useState(false)
  const [editingModalIndex, setEditingModalIndex] = useState<number | null>(null)
  const stereoRef = useRef<HTMLDivElement>(null)

  const { activeLoop } = usePlayerStore()
  const isPlaying = usePlayerStore((s) => s.isPlaying)

  const {
    sections,
    markStart,
    load: loadSections,
    updateSection,
    deleteSection,
    onMarkStart,
    onMarkEnd,
    addSectionAfter,
    playSectionOrLoop,
    stopLoop,
    checkLoop,
  } = useSections(song.name, currentPart.label)

  const { canvasRef, containerRef: timelineContainerRef, draw: drawTimeline } = useTimeline(sections)

  const onTimeUpdate = useCallback(() => {
    checkLoop()
    drawTimeline()
    setCurrentTime(getTime())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkLoop, drawTimeline])

  const { loadPart, togglePlay, seekTo, seekBySeconds, setSpeed, getTime, getDuration } =
    useAudio(onTimeUpdate)
  const { ensureAudioGraph, resumeCtx, setChannelGain } = useWebAudio()
  const { saveSongPrefs, loadSongPrefs } = usePrefs()

  useMediaSession(song.name, currentPart.displayName)

  // Load audio + prefs when part changes
  useEffect(() => {
    loadPart(currentPart, song.folder)
    loadSections()

    const prefs = loadSongPrefs(song)
    if (prefs?.speed) {
      setSpeedState(prefs.speed)
      setSpeed(prefs.speed)
    }
    const gl = prefs?.channelL ?? 1
    const gr = prefs?.channelR ?? 1
    setGainL(gl)
    setGainR(gr)
    setChannelGain('L', gl)
    setChannelGain('R', gr)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPart, song])

  // Close stereo popover on click-outside
  useEffect(() => {
    if (!showStereoPopover) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (stereoRef.current && !stereoRef.current.contains(e.target as Node)) {
        setShowStereoPopover(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [showStereoPopover])

  // Track duration
  useEffect(() => {
    const interval = setInterval(() => {
      const d = getDuration()
      if (d && d !== duration) setDuration(d)
    }, 500)
    return () => clearInterval(interval)
  }, [duration, getDuration])

  const handlePlay = useCallback(() => {
    ensureAudioGraph()
    resumeCtx()
    togglePlay()
  }, [ensureAudioGraph, resumeCtx, togglePlay])

  const handleSpeed = useCallback((s: number) => {
    setSpeedState(s)
    setSpeed(s)
    saveSongPrefs(song, { voicePart: currentPart.label, speed: s, channelL: gainL, channelR: gainR })
  }, [setSpeed, saveSongPrefs, song, currentPart, gainL, gainR])

  const handleGainL = useCallback((v: number) => {
    setGainL(v)
    setChannelGain('L', v)
    saveSongPrefs(song, { voicePart: currentPart.label, speed, channelL: v, channelR: gainR })
  }, [setChannelGain, saveSongPrefs, song, currentPart, speed, gainR])

  const handleGainR = useCallback((v: number) => {
    setGainR(v)
    setChannelGain('R', v)
    saveSongPrefs(song, { voicePart: currentPart.label, speed, channelL: gainL, channelR: v })
  }, [setChannelGain, saveSongPrefs, song, currentPart, speed, gainL])

  // Timeline click to seek
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    seekTo(frac * getDuration())
  }, [seekTo, getDuration])

  useKeyboard({
    onPlayPause: handlePlay,
    onSeekBack: () => seekBySeconds(-5),
    onSeekForward: () => seekBySeconds(5),
    onSeekStart: () => seekTo(0),
  })

  const loopSec = activeLoop ? sections[activeLoop.sectionIndex] : null

  return (
    <div className={styles.panel}>
      {/* Timeline */}
      <div
        ref={timelineContainerRef}
        className={styles.timelineContainer}
        onClick={handleTimelineClick}
      >
        <canvas ref={canvasRef} className={styles.timelineCanvas} />
        <div
          className={styles.cursor}
          style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
      </div>

      <div className={styles.timeDisplay}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Nav controls */}
      <div className={styles.navControls}>
        <button className={styles.navBtn} onClick={() => seekTo(0)} title="Til start (Home)">⏮</button>
        <button className={styles.navBtn} onClick={() => seekBySeconds(-5)} title="5 sek tilbake">−5s</button>
        <button className={styles.playBtn} onClick={handlePlay} aria-label="Play/Pause">
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="40" height="40">
              <rect x="5" y="3" width="4" height="18" fill="currentColor" />
              <rect x="15" y="3" width="4" height="18" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="40" height="40">
              <polygon points="6,3 20,12 6,21" fill="currentColor" />
            </svg>
          )}
        </button>
        <button className={styles.navBtn} onClick={() => seekBySeconds(5)} title="5 sek frem">+5s</button>
        <button className={styles.navBtn} onClick={() => seekTo(getDuration())} title="Til slutt">⏭</button>
      </div>

      {/* Speed + Stereo */}
      <div className={styles.controlsRow}>
        <div className={styles.speedButtons}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`${styles.speedBtn} ${speed === s ? styles.speedBtnActive : ''}`}
              onClick={() => handleSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className={styles.stereoWrapper} ref={stereoRef}>
          <button
            className={`${styles.stereoBtn} ${(gainL !== 1 || gainR !== 1) ? styles.stereoBtnActive : ''}`}
            onClick={() => setShowStereoPopover((v) => !v)}
            aria-label="Stereo mix"
          >
            🎚 Mix
          </button>
          {showStereoPopover && (
            <div className={styles.stereoPopover}>
              <div className={styles.stereoPopoverTitle}>Stereo mix</div>
              <div className={styles.channelCtrl}>
                <span className={styles.channelLabel}>L</span>
                <input
                  type="range" min="0" max="1" step="0.02"
                  value={gainL}
                  onChange={(e) => handleGainL(Number(e.target.value))}
                  className={styles.channelSlider}
                />
                <span className={styles.channelValue}>{Math.round(gainL * 100)}%</span>
              </div>
              <div className={styles.channelCtrl}>
                <span className={styles.channelLabel}>R</span>
                <input
                  type="range" min="0" max="1" step="0.02"
                  value={gainR}
                  onChange={(e) => handleGainR(Number(e.target.value))}
                  className={styles.channelSlider}
                />
                <span className={styles.channelValue}>{Math.round(gainR * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section marking */}
      <div className={styles.sectionControls}>
        <button
          className={`${styles.markBtn} ${markStart !== null ? styles.marking : ''}`}
          onClick={onMarkStart}
        >
          {markStart !== null ? `Start: ${formatTime(markStart)}` : 'Mark Start'}
        </button>
        <button
          className={styles.markBtn}
          onClick={() => {
            const idx = onMarkEnd()
            if (idx !== undefined) setEditingModalIndex(idx)
          }}
          disabled={markStart === null}
        >
          Mark End
        </button>
      </div>

      {/* Loop indicator */}
      {activeLoop && loopSec && (
        <div className={styles.loopIndicator}>
          <span>
            {activeLoop.total === Infinity
              ? `Looping "${loopSec.name}"`
              : `"${loopSec.name}" — ${activeLoop.total - activeLoop.remaining + 1} of ${activeLoop.total}`}
          </span>
          <button className={styles.stopLoopBtn} onClick={stopLoop}>Stop</button>
        </div>
      )}

      {/* Sections */}
      <SectionList
        sections={sections}
        activeLoopIndex={activeLoop?.sectionIndex ?? null}
        onPlay={playSectionOrLoop}
        onEdit={(i) => setEditingModalIndex(i)}
        onDelete={deleteSection}
        onAddAfter={addSectionAfter}
      />

      {/* Lyrics */}
      {song.lyrics && <LyricsPanel lyricsPath={assetUrl(`/${song.folder}/${song.lyrics}`)} />}

      {/* Section edit modal */}
      {editingModalIndex !== null && (
        <SectionModal
          section={sections[editingModalIndex]}
          onSave={(patch) => {
            updateSection(editingModalIndex, patch)
            setEditingModalIndex(null)
          }}
          onClose={() => setEditingModalIndex(null)}
        />
      )}
    </div>
  )
}

function LyricsPanel({ lyricsPath }: { lyricsPath: string }) {
  const [lyrics, setLyrics] = useState('')
  useEffect(() => {
    fetch(lyricsPath).then((r) => r.text()).then(setLyrics).catch(() => {})
  }, [lyricsPath])
  if (!lyrics) return null
  return (
    <div className={styles.lyricsPanel}>
      <h3>Tekst</h3>
      <pre className={styles.lyricsContent}>{lyrics}</pre>
    </div>
  )
}
