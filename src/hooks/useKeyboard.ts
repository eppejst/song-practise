'use client'

import { useEffect } from 'react'

interface KeyboardHandlers {
  onPlayPause: () => void
  onSeekBack: () => void
  onSeekForward: () => void
  onSeekStart: () => void
}

export function useKeyboard({ onPlayPause, onSeekBack, onSeekForward, onSeekStart }: KeyboardHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when focus is on an input/select
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          onPlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onSeekBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          onSeekForward()
          break
        case 'Home':
          e.preventDefault()
          onSeekStart()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onPlayPause, onSeekBack, onSeekForward, onSeekStart])
}
