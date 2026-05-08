import { readFile } from 'fs/promises'
import path from 'path'
import { notFound } from 'next/navigation'
import type { Song } from '@/lib/types'
import { slugify } from '@/lib/slugify'
import Player from '@/components/Player/Player'

async function getSongs(): Promise<Song[]> {
  const filePath = path.join(process.cwd(), 'public', 'songs.json')
  const raw = await readFile(filePath, 'utf-8')
  return (JSON.parse(raw) as { songs: Song[] }).songs
}

export async function generateStaticParams() {
  const songs = await getSongs()
  return songs.map((s) => ({ slug: slugify(s.name) }))
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const songs = await getSongs()
  const song = songs.find((s) => slugify(s.name) === slug)
  if (!song) notFound()
  return <Player song={song} />
}
