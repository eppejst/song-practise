'use client'

import { useEffect, useRef } from 'react'
import { usePdf } from '@/hooks/usePdf'
import { usePinchZoom } from '@/hooks/usePinchZoom'
import styles from './Player.module.css'

interface Props {
  url: string
  enabled: boolean
}

export default function PdfPanel({ url, enabled }: Props) {
  const { containerRef, loading, error, render } = usePdf()
  const viewportRef = useRef<HTMLDivElement>(null)
  usePinchZoom(viewportRef, containerRef)

  useEffect(() => {
    if (enabled && url) {
      requestAnimationFrame(() => render(url))
    }
  }, [enabled, url, render])

  return (
    <div ref={viewportRef} className={styles.pdfPanel}>
      {loading && <div className={styles.pdfLoading}>Laster PDF…</div>}
      {error && <div className={styles.pdfError}>Kunne ikke laste PDF.</div>}
      <div
        ref={containerRef}
        className={styles.pdfCanvas}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  )
}
