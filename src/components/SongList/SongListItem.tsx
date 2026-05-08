import Link from 'next/link'
import type { Song } from '@/lib/types'
import { slugify } from '@/lib/slugify'
import styles from './SongList.module.css'

interface Props {
  song: Song
}

export default function SongListItem({ song }: Props) {
  const href = `/song/${slugify(song.name)}`
  return (
    <li className={styles.item}>
      <Link href={href} className={styles.itemLink}>
        <span className={styles.itemName}>{song.name}</span>
        {song.tags && song.tags.length > 0 && (
          <span className={styles.itemTags}>
            {song.tags.map((t) => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </span>
        )}
      </Link>
    </li>
  )
}
