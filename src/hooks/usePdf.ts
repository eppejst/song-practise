'use client'

import { useRef, useCallback, useState } from 'react'

export function usePdf() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const lastRenderedUrl = useRef<string | null>(null)

  const render = useCallback(async (url: string) => {
    if (!containerRef.current) return
    if (lastRenderedUrl.current === url) return // Already rendered

    const lib = typeof window !== 'undefined' ? window.pdfjsLib : null
    if (!lib) return

    setLoading(true)
    setError(false)
    lastRenderedUrl.current = url

    const container = containerRef.current
    container.innerHTML = ''

    try {
      lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

      const pdf = await lib.getDocument(url).promise
      const containerWidth = container.clientWidth || window.innerWidth

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const unscaled = page.getViewport({ scale: 1 })
        const dpr = window.devicePixelRatio || 1
        const scale = (containerWidth / unscaled.width) * dpr
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = '100%'
        canvas.style.display = 'block'
        canvas.style.borderBottom = '1px solid var(--color-border)'

        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport }).promise
        container.appendChild(canvas)
      }
    } catch (e) {
      console.error('PDF render error:', e)
      setError(true)
      lastRenderedUrl.current = null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    lastRenderedUrl.current = null
    if (containerRef.current) containerRef.current.innerHTML = ''
  }, [])

  return { containerRef, loading, error, render, reset }
}
