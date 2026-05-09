const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function assetUrl(path: string): string {
  // NFC-normalize and percent-encode each segment so Norwegian/special-character
  // filenames resolve correctly on GitHub Pages (CDN expects NFC, macOS stores NFD).
  const encoded = path
    .split('/')
    .map((seg) => (seg ? encodeURIComponent(seg.normalize('NFC')) : seg))
    .join('/')
  return `${base}${encoded}`
}
