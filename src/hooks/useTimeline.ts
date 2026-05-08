'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { Section } from '@/lib/types'
import { SECTION_COLORS } from './useSections'
import { getAudio } from './useAudio'

export function useTimeline(sections: Section[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    if (!rect.width) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    const w = rect.width
    const h = rect.height
    const audio = getAudio()
    const dur = audio.duration || 1

    ctx.clearRect(0, 0, w, h)

    // Section regions
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i]
      const x1 = (sec.start / dur) * w
      const x2 = (sec.end / dur) * w
      ctx.fillStyle = SECTION_COLORS[i % SECTION_COLORS.length] + '28'
      ctx.fillRect(x1, 0, x2 - x1, h)
      ctx.fillStyle = SECTION_COLORS[i % SECTION_COLORS.length] + '88'
      ctx.fillRect(x1, 0, 2, h)
      ctx.fillRect(x2 - 2, 0, 2, h)
    }

    // Decorative bars
    ctx.fillStyle = '#00000010'
    const bars = 100
    const barW = w / bars
    for (let i = 0; i < bars; i++) {
      const barH = 10 + Math.sin(i * 0.4) * 8 + Math.sin(i * 1.3) * 10 + Math.cos(i * 0.7) * 6
      const y = (h - barH) / 2
      ctx.fillRect(i * barW + 1, y, barW - 2, barH)
    }

    // Progress fill
    if (audio.duration) {
      const progress = audio.currentTime / audio.duration
      ctx.fillStyle = '#4a6cf718'
      ctx.fillRect(0, 0, progress * w, h)
    }
  }, [sections])

  // Redraw when sections change or on resize
  useEffect(() => {
    draw()
    const obs = new ResizeObserver(draw)
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [draw])

  return { canvasRef, containerRef, draw }
}
