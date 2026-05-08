import styles from './SongList.module.css'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className={styles.searchBar}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Søk etter sang…"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={styles.searchInput}
      />
    </div>
  )
}
