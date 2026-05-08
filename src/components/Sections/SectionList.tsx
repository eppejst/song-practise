import type { Section } from '@/lib/types'
import { SECTION_COLORS } from '@/hooks/useSections'
import styles from './Sections.module.css'

function formatTime(sec: number): string {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

interface Props {
  sections: Section[]
  activeLoopIndex: number | null
  onPlay: (index: number) => void
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onAddAfter: (index: number) => void
}

export default function SectionList({ sections, activeLoopIndex, onPlay, onEdit, onDelete, onAddAfter }: Props) {
  if (sections.length === 0) {
    return <p className={styles.empty}>Ingen seksjoner enda. Trykk &ldquo;Mark Start&rdquo; under avspilling.</p>
  }

  return (
    <ul className={styles.list}>
      {sections.map((sec, i) => (
        <>
          <li
            key={`sec-${i}`}
            className={`${styles.item} ${activeLoopIndex === i ? styles.activeLoop : ''}`}
            onClick={() => onPlay(i)}
          >
            <div
              className={styles.colorDot}
              style={{ background: SECTION_COLORS[i % SECTION_COLORS.length] }}
            />
            <div className={styles.info}>
              <div className={styles.name}>{sec.name}</div>
              <div className={styles.times}>{formatTime(sec.start)} – {formatTime(sec.end)}</div>
            </div>
            <div className={styles.badge}>
              {sec.repeatMode === 'none' ? '1×' : sec.repeatMode === 'infinite' ? '∞' : `${sec.repeatCount}×`}
            </div>
            <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
              <button className={styles.actionBtn} onClick={() => onEdit(i)} aria-label="Edit">✎</button>
              <button className={styles.actionBtn} onClick={() => onDelete(i)} aria-label="Delete">✕</button>
            </div>
          </li>
          <div
            key={`add-${i}`}
            className={styles.addNext}
            onClick={() => onAddAfter(i)}
          >
            <span className={styles.plus}>+</span> Legg til neste seksjon
          </div>
        </>
      ))}
    </ul>
  )
}
