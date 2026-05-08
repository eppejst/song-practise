import { readFile } from 'fs/promises'
import path from 'path'
import type { Song } from '@/lib/types'
import SongList from '@/components/SongList/SongList'

async function getSongs(): Promise<Song[]> {
  // During `next build` (static export) we read directly from the filesystem
  const filePath = path.join(process.cwd(), 'public', 'songs.json')
  const raw = await readFile(filePath, 'utf-8')
  return (JSON.parse(raw) as { songs: Song[] }).songs
}

export default async function HomePage() {
  const songs = await getSongs()
  return <SongList songs={songs} />
}
