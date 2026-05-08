const TRANSLITERATIONS: [RegExp, string][] = [
  [/æ/g, 'ae'], [/ø/g, 'oe'], [/å/g, 'aa'],
  [/ä/g, 'ae'], [/ö/g, 'oe'], [/ü/g, 'ue'],
  [/é|è|ê|ë/g, 'e'], [/à|â/g, 'a'], [/î|ï/g, 'i'],
  [/ô/g, 'o'], [/û/g, 'u'], [/ç/g, 'c'],
]

export function slugify(name: string): string {
  let s = name.normalize('NFC').toLowerCase()
  for (const [pattern, replacement] of TRANSLITERATIONS) {
    s = s.replace(pattern, replacement)
  }
  return s
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
