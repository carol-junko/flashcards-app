// Maps the CEFR code inside a deck id (e.g. "br-a2-deck12") to the folder
// that holds its files under public/data/<lang>/<folder>/<deckId>/.
const CEFR_FOLDERS = {
  a1: 'beginner',
  a2: 'elementary',
  b1: 'intermediate',
  b2: 'upper-intermediate',
  c1: 'advanced',
}

export function deckDataPath(langId, deckId) {
  const match = /-(a1|a2|b1|b2|c1)-/i.exec(deckId || '')
  if (!langId || !match) {
    throw new Error(`Cannot work out the data folder for deck "${deckId}" (language "${langId}")`)
  }
  const folder = CEFR_FOLDERS[match[1].toLowerCase()]
  return `/data/${langId}/${folder}/${deckId}`
}
