'use client'

import { useState, useMemo } from 'react'
import type { Song } from '@/lib/types'
import SongListItem from './SongListItem'
import TagFilter from './TagFilter'
import SearchBar from './SearchBar'
import styles from './SongList.module.css'
import Image from 'next/image'

interface Props {
  songs: Song[]
}

export default function SongList({ songs }: Props) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    songs.forEach((s) => s.tags?.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [songs])

  const filtered = useMemo(() => {
    return songs.filter((s) => {
      if (activeTag && !s.tags?.includes(activeTag)) return false
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [songs, activeTag, searchQuery])

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Image src="/logo.png" alt="DnS" width={44} height={44} className={styles.logo} />
        <div className={styles.titles}>
          <h1>DnS øveapp</h1>
          <p className={styles.subtitle}>Den norske Studentersangforening</p>
        </div>
        <a
          href="https://forms.gle/HFV82ALoTUnqc4d5A"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.feedbackBtn}
        >
          Send feedback / ideer
        </a>
      </header>

      <TagFilter tags={allTags} activeTag={activeTag} onChange={setActiveTag} />
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {filtered.length === 0 ? (
        <p className={styles.empty}>Ingen sanger funnet.</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((song) => (
            <SongListItem key={song.folder} song={song} />
          ))}
        </ul>
      )}
    </div>
  )
}
