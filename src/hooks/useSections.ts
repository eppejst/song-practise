'use client'

import { useState, useCallback, useRef } from 'react'
import type { Section, ActiveLoop } from '@/lib/types'
import { saveSections, loadSections } from '@/lib/storage'
import { usePlayerStore } from '@/store/playerStore'
import { getAudio } from './useAudio'

export const SECTION_COLORS = [
  '#4a6cf7', '#16a34a', '#ea580c', '#e11d48', '#7c3aed',
  '#0284c7', '#dc2626', '#ca8a04', '#059669', '#ea580c',
]

export function useSections(songName: string, partLabel: string) {
  const [sections, setSections] = useState<Section[]>([])
  const [markStart, setMarkStart] = useState<number | null>(null)
  const pendingAddAfterIndex = useRef<number | null>(null)

  const setActiveLoop = usePlayerStore((s) => s.setActiveLoop)
  const activeLoop = usePlayerStore((s) => s.activeLoop)

  const load = useCallback(() => {
    setSections(loadSections(songName, partLabel))
  }, [songName, partLabel])

  const save = useCallback((newSections: Section[]) => {
    saveSections(songName, partLabel, newSections)
    setSections(newSections)
  }, [songName, partLabel])

  const updateSection = useCallback((index: number, patch: Partial<Section>) => {
    setSections((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      saveSections(songName, partLabel, next)
      return next
    })
  }, [songName, partLabel])

  const deleteSection = useCallback((index: number) => {
    setSections((prev) => {
      const next = prev.filter((_, i) => i !== index)
      saveSections(songName, partLabel, next)
      return next
    })
    setActiveLoop(null)
  }, [songName, partLabel, setActiveLoop])

  const onMarkStart = useCallback(() => {
    if (markStart !== null) {
      setMarkStart(null)
      pendingAddAfterIndex.current = null
      return
    }
    setMarkStart(getAudio().currentTime)
  }, [markStart])

  const onMarkEnd = useCallback(() => {
    if (markStart === null) return
    let start = markStart
    let end = getAudio().currentTime
    if (end < start) [start, end] = [end, start]
    if (end - start < 0.5) return

    const insertIndex =
      pendingAddAfterIndex.current !== null
        ? pendingAddAfterIndex.current + 1
        : sections.length

    setMarkStart(null)
    pendingAddAfterIndex.current = null

    const newSection: Section = {
      name: `Section ${sections.length + 1}`,
      start: Math.round(start * 100) / 100,
      end: Math.round(end * 100) / 100,
      repeatMode: 'none',
      repeatCount: 3,
    }

    setSections((prev) => {
      const next = [...prev]
      next.splice(insertIndex, 0, newSection)
      saveSections(songName, partLabel, next)
      return next
    })

    return insertIndex // caller can open modal
  }, [markStart, sections.length, songName, partLabel])

  const addSectionAfter = useCallback((index: number) => {
    const audio = getAudio()
    const prevSection = sections[index]
    pendingAddAfterIndex.current = index
    setMarkStart(prevSection.end)
    audio.currentTime = prevSection.end
    audio.play().catch(console.error)
  }, [sections])

  const playSectionOrLoop = useCallback((index: number) => {
    const audio = getAudio()
    const sec = sections[index]
    if (!sec) return

    let loop: ActiveLoop
    if (sec.repeatMode === 'none') {
      loop = { sectionIndex: index, remaining: 1, total: 1 }
    } else if (sec.repeatMode === 'infinite') {
      loop = { sectionIndex: index, remaining: Infinity, total: Infinity }
    } else {
      loop = { sectionIndex: index, remaining: sec.repeatCount, total: sec.repeatCount }
    }
    setActiveLoop(loop)
    audio.currentTime = sec.start
    audio.play().catch(console.error)
  }, [sections, setActiveLoop])

  const stopLoop = useCallback(() => {
    setActiveLoop(null)
  }, [setActiveLoop])

  /** Call on timeupdate — handles loop boundary */
  const checkLoop = useCallback(() => {
    if (!activeLoop) return
    const audio = getAudio()
    const sec = sections[activeLoop.sectionIndex]
    if (!sec) { setActiveLoop(null); return }

    if (audio.currentTime >= sec.end) {
      const remaining = activeLoop.remaining - 1
      if (remaining <= 0) {
        audio.pause()
        setActiveLoop(null)
        return
      }
      setActiveLoop({ ...activeLoop, remaining })
      audio.currentTime = sec.start
    }
  }, [activeLoop, sections, setActiveLoop])

  return {
    sections,
    markStart,
    load,
    save,
    updateSection,
    deleteSection,
    onMarkStart,
    onMarkEnd,
    addSectionAfter,
    playSectionOrLoop,
    stopLoop,
    checkLoop,
  }
}
