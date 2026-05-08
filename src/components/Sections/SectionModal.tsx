'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Section, RepeatMode } from '@/lib/types'
import styles from './Sections.module.css'

interface Props {
  section: Section
  onSave: (patch: Partial<Section>) => void
  onClose: () => void
}

export default function SectionModal({ section, onSave, onClose }: Props) {
  const [name, setName] = useState(section.name)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(section.repeatMode)
  const [repeatCount, setRepeatCount] = useState(section.repeatCount)

  useEffect(() => {
    setName(section.name)
    setRepeatMode(section.repeatMode)
    setRepeatCount(section.repeatCount)
  }, [section])

  const handleSave = () => {
    onSave({
      name: name.trim() || section.name,
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
