import type { VoicePart } from './types'

// Direct port of parseVoiceParts() from app.js lines 148-170
export function parseVoiceParts(files: string[]): VoicePart[] {
  const partMap = new Map<string, VoicePart>()
  // Matches: " B1", " T2.1", " B1.2", "-T1", "_B2", also "T2.1_1.2"
  const pattern = /[_\-\s](B1|B2|T1|T2)(?:[._](\d+))?(?:[_.][\d.]+)?\.mp3$/i
  for (const file of files) {
    const match = file.match(pattern)
    if (!match) continue
    const base = match[1].toUpperCase()
    const sub = match[2] || null
    const label = sub ? base + '_' + sub : base
    const names: Record<string, string> = { B1: 'Bass 1', B2: 'Bass 2', T1: 'Tenor 1', T2: 'Tenor 2' }
    const displayName = sub ? names[base] + ' (' + sub + ')' : names[base]
    partMap.set(label, { label, displayName, file })
  }
  const order = ['T1', 'T2', 'B1', 'B2']
  return [...partMap.values()].sort((a, b) => {
    const ai = order.indexOf(a.label.split('_')[0])
    const bi = order.indexOf(b.label.split('_')[0])
    if (ai !== bi) return ai - bi
    return a.label.localeCompare(b.label)
  })
}
