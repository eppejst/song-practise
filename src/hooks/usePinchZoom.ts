'use client'

import { useEffect, useRef } from 'react'

function dist(t1: Touch, t2: Touch): number {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function mid(t1: Touch, t2: Touch): { x: number; y: number } {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
}

// Miro-style free canvas: pinch to zoom, drag to pan.
// Content is positioned via CSS transform on an inner wrapper.
// The container has overflow:hidden and touch-action:none so the
// browser never interferes with gestures.
export function usePinchZoom(
  viewportRef: React.RefObject<HTMLDivElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>,
) {
  const state = useRef({ x: 0, y: 0, scale: 1 })

  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const s = state.current

    function apply() {
      content!.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`
      content!.style.transformOrigin = '0 0'
    }

    function clamp() {
      const vw = viewport!.clientWidth
      const vh = viewport!.clientHeight
      const cw = content!.scrollWidth * s.scale
      const ch = content!.scrollHeight * s.scale

      // Allow panning so you can see blank space on sides (Miro-style),
      // but don't let the content disappear entirely off-screen.
      const margin = 100
      s.x = Math.max(-(cw - margin), Math.min(vw - margin, s.x))
      s.y = Math.max(-(ch - margin), Math.min(vh - margin, s.y))
    }

    // Fit content to viewport width on first mount
    function fitToWidth() {
      const vw = viewport!.clientWidth
      const cw = content!.scrollWidth
      if (cw > 0) {
        s.scale = vw / cw
        s.x = 0
        s.y = 0
      }
    }

    // --- Touch: pinch + drag ---
    let startDist = 0
    let startScale = 1
    let startMid = { x: 0, y: 0 }
    let startX = 0
    let startY = 0
    let isPinching = false
    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0
    let dragPanStartX = 0
    let dragPanStartY = 0

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true
        isDragging = false
        startDist = dist(e.touches[0], e.touches[1])
        startScale = s.scale
        startMid = mid(e.touches[0], e.touches[1])
        startX = s.x
        startY = s.y
        e.preventDefault()
      } else if (e.touches.length === 1) {
        isDragging = true
        isPinching = false
        dragStartX = e.touches[0].clientX
        dragStartY = e.touches[0].clientY
        dragPanStartX = s.x
        dragPanStartY = s.y
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (isPinching && e.touches.length === 2) {
        const d = dist(e.touches[0], e.touches[1])
        const newScale = Math.max(0.5, Math.min(5, startScale * (d / startDist)))
        const m = mid(e.touches[0], e.touches[1])

        // Zoom toward the midpoint of the two fingers
        s.x = m.x - (startMid.x - startX) * (newScale / startScale) + (m.x - startMid.x)
        s.y = m.y - (startMid.y - startY) * (newScale / startScale) + (m.y - startMid.y)
        s.scale = newScale
        clamp()
        apply()
        e.preventDefault()
      } else if (isDragging && e.touches.length === 1) {
        s.x = dragPanStartX + (e.touches[0].clientX - dragStartX)
        s.y = dragPanStartY + (e.touches[0].clientY - dragStartY)
        clamp()
        apply()
        e.preventDefault()
      }
    }

    const onTouchEnd = () => {
      isPinching = false
      isDragging = false
    }

    // Double-tap to toggle between fit-to-width and 2.5×
    let lastTap = 0
    const onDoubleTap = (e: TouchEvent) => {
      if (e.touches.length > 0) return
      const now = Date.now()
      if (now - lastTap < 300) {
        if (s.scale > 1.05) {
          fitToWidth()
        } else {
          s.scale = 2.5
          s.x = 0
          s.y = 0
          clamp()
        }
        apply()
      }
      lastTap = now
    }

    // --- Mouse/trackpad: wheel to scroll, ctrl+wheel or pinch-on-trackpad to zoom ---
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom on trackpad fires as ctrl+wheel in Chromium
        e.preventDefault()
        const rect = viewport!.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top

        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
        const newScale = Math.max(0.5, Math.min(5, s.scale * factor))

        // Zoom toward cursor position
        s.x = mx - (mx - s.x) * (newScale / s.scale)
        s.y = my - (my - s.y) * (newScale / s.scale)
        s.scale = newScale
        clamp()
        apply()
      } else {
        // Regular scroll → pan
        e.preventDefault()
        s.x -= e.deltaX
        s.y -= e.deltaY
        clamp()
        apply()
      }
    }

    // --- Mouse drag to pan ---
    let mouseDragging = false
    let mouseStartX = 0
    let mouseStartY = 0
    let mousePanStartX = 0
    let mousePanStartY = 0

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      mouseDragging = true
      mouseStartX = e.clientX
      mouseStartY = e.clientY
      mousePanStartX = s.x
      mousePanStartY = s.y
      viewport!.style.cursor = 'grabbing'
      e.preventDefault()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDragging) return
      s.x = mousePanStartX + (e.clientX - mouseStartX)
      s.y = mousePanStartY + (e.clientY - mouseStartY)
      clamp()
      apply()
    }

    const onMouseUp = () => {
      if (mouseDragging) {
        mouseDragging = false
        viewport!.style.cursor = 'grab'
      }
    }

    // Init: fit PDF to viewport width
    fitToWidth()
    apply()
    viewport.style.cursor = 'grab'

    viewport.addEventListener('touchstart', onTouchStart, { passive: false })
    viewport.addEventListener('touchmove', onTouchMove, { passive: false })
    viewport.addEventListener('touchend', onTouchEnd)
    viewport.addEventListener('touchend', onDoubleTap)
    viewport.addEventListener('wheel', onWheel, { passive: false })
    viewport.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      viewport.removeEventListener('touchstart', onTouchStart)
      viewport.removeEventListener('touchmove', onTouchMove)
      viewport.removeEventListener('touchend', onTouchEnd)
      viewport.removeEventListener('touchend', onDoubleTap)
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [viewportRef, contentRef])
}
