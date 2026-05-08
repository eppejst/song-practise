import styles from './SongList.module.css'

interface Props {
  tags: string[]
  activeTag: string | null
  onChange: (tag: string | null) => void
}

export default function TagFilter({ tags, activeTag, onChange }: Props) {
  if (tags.length === 0) return null
  return (
    <div className={styles.tagFilter}>
      <button
        className={`${styles.tagBtn} ${activeTag === null ? styles.tagBtnActive : ''}`}
        onClick={() => onChange(null)}
      >
        Alle
      </button>
      {tags.map((t) => (
        <button
          key={t}
          className={`${styles.tagBtn} ${activeTag === t ? styles.tagBtnActive : ''}`}
          onClick={() => onChange(activeTag === t ? null : t)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
