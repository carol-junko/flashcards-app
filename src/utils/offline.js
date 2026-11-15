// "Download all decks for offline": fetching each deck file once while online
// is enough, because the service worker keeps a copy of every /data/ file it
// serves (see public/sw.js). Remembers per language that it was done.
import { deckDataPath } from './deckPaths.js'

const key = (langId) => `flashcards:offline:${langId}`

export function isLanguageDownloaded(langId) {
  try {
    return localStorage.getItem(key(langId)) === 'done'
  } catch {
    return false
  }
}

export async function downloadLanguage(langId, decks, onProgress = () => {}) {
  const files = decks
    .filter((d) => !d.comingSoon)
    .flatMap((d) => {
      const folder = deckDataPath(langId, d.id)
      return [`${folder}/flashcards.json`, `${folder}/exercises.json`]
    })
  let done = 0
  // A few at a time, to stay gentle on slow mobile connections
  for (let i = 0; i < files.length; i += 6) {
    await Promise.all(files.slice(i, i + 6).map((f) => fetch(f).catch(() => null)))
    done = Math.min(files.length, i + 6)
    onProgress(Math.round((done / files.length) * 100))
  }
  try {
    localStorage.setItem(key(langId), 'done')
  } catch {
    // not remembered, but the files are cached
  }
}

export const OFFLINE_DECK_MESSAGE =
  "You're offline and this deck hasn't been downloaded yet. Connect once to open it, " +
  "or use \"Download for offline\" on the deck list."
