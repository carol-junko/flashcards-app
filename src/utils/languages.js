// Loads public/data/languages.json once and answers questions about a language,
// so no view has to hard-code "Portuguese" or "pt-BR".
let languagesPromise = null

export function loadLanguages() {
  if (!languagesPromise) {
    languagesPromise = fetch('/data/languages.json').then((response) => {
      if (!response.ok) throw new Error(`Failed to load languages (${response.status})`)
      return response.json()
    })
    // Allow a retry after a network error instead of caching the failure forever
    languagesPromise.catch(() => { languagesPromise = null })
  }
  return languagesPromise
}

export async function getLanguage(langId) {
  const languages = await loadLanguages()
  const language = languages.find((l) => l.id === langId)
  if (!language) throw new Error(`Unknown language "${langId}"`)
  return language
}

// Picks the best installed text-to-speech voices for a language:
// exact locale first (pt-BR), then same language (pt-PT), preferred voice on top.
export function pickVoices(allVoices, speechLang, preferredVoice) {
  const base = speechLang.split('-')[0].toLowerCase()
  const exact = speechLang.toLowerCase()
  const matching = allVoices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(base))
  const score = (v) =>
    (v.name.toLowerCase().includes((preferredVoice || '\u0000').toLowerCase()) ? 2 : 0) +
    (v.lang.toLowerCase().replace('_', '-') === exact ? 1 : 0)
  return [...matching].sort((a, b) => score(b) - score(a))
}
