'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Section, RepeatMode } from '@/lib/types'
import styles from './Sections.module.css'

function toMmSs(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

function fromMmSs(value: string): number | null {
  const match = value.match(/^(\d+):([0-5]\d)$/)
  if (!match) return null
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
}

interface Props {
  section: Section
  onSave: (patch: Partial<Section>) => void
  onClose: () => void
}

export default function SectionModal({ section, onSave, onClose }: Props) {
  const [name, setName] = useState(section.name)
  const [startStr, setStartStr] = useState(toMmSs(section.start))
  const [endStr, setEndStr] = useState(toMmSs(section.end))
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(section.repeatMode)
  const [repeatCount, setRepeatCount] = useState(section.repeatCount)

  useEffect(() => {
    setName(section.name)
    setStartStr(toMmSs(section.start))
    setEndStr(toMmSs(section.end))
    setRepeatMode(section.repeatMode)
    setRepeatCount(section.repeatCount)
  }, [section])

  const handleSave = () => {
    const start = fromMmSs(startStr) ?? section.start
    const end = fromMmSs(endStr) ?? section.end
    onSave({
      name: name.trim() || section.name,
      start,
      end: Math.max(start + 0.1, end),
      repeatMode,
      repeatCount: Math.max(1, repeatCount),
    })
  }

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Rediger seksjon</h3>

        <label className={styles.label}>
          Navn
          <input
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>

        <div className={styles.timeRow}>
          <label className={styles.label}>
            Start (m:ss)
            <input
              className={`${styles.input} ${fromMmSs(startStr) === null ? styles.inputError : ''}`}
              type="text"
              value={startStr}
              onChange={(e) => setStartStr(e.target.value)}
              placeholder="0:00"
            />
          </label>
          <label className={styles.label}>
            Slutt (m:ss)
            <input
              className={`${styles.input} ${fromMmSs(endStr) === null ? styles.inputError : ''}`}
              type="text"
              value={endStr}
              onChange={(e) => setEndStr(e.target.value)}
              placeholder="0:00"
            />
          </label>
        </div>

        <label className={styles.label}>
          Repetisjonstype
          <select
            className={styles.select}
            value={repeatMode}
            onChange={(e) => setRepeatMode(e.target.value as RepeatMode)}
          >
            <option value="none">Spill én gang</option>
            <option value="infinite">Loop for alltid</option>
            <option value="count">Loop N ganger</option>
          </select>
        </label>

        {repeatMode === 'count' && (
          <label className={styles.label}>
            Antall repetisjoner
            <input
              className={styles.input}
              type="number"
              min={1}
              max={100}
              value={repeatCount}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
            />
          </label>
        )}

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Avbryt</button>
          <button className={styles.saveBtn} onClick={handleSave}>Lagre</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
