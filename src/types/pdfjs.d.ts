// TypeScript shim for PDF.js loaded via CDN <Script>
// Matches pdf.js v3.11.174

declare global {
  interface Window {
    pdfjsLib: PdfjsLib
  }
  const pdfjsLib: PdfjsLib
}

interface PdfjsLib {
  GlobalWorkerOptions: {
    workerSrc: string
  }
  getDocument(src: string | { url: string }): PDFDocumentLoadingTask
  version: string
}

interface PDFDocumentLoadingTask {
  promise: Promise<PDFDocumentProxy>
  destroy(): void
}

interface PDFDocumentProxy {
  numPages: number
  getPage(pageNum: number): Promise<PDFPageProxy>
  destroy(): void
}

interface PDFPageProxy {
  getViewport(params: { scale: number }): PDFPageViewport
  render(params: PDFRenderParams): PDFRenderTask
  cleanup(): void
}

interface PDFPageViewport {
  width: number
  height: number
}

interface PDFRenderParams {
  canvasContext: CanvasRenderingContext2D
  viewport: PDFPageViewport
}

interface PDFRenderTask {
  promise: Promise<void>
  cancel(): void
}

export {}
