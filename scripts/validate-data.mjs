// Checks that every deck listed in public/data/manifests/*.json has a real,
// non-empty flashcards.json and that its cardCount matches the file.
// Decks marked "comingSoon": true are skipped (they are shown but locked).
// Run with: npm run validate:data
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DATA = 'public/data'
const CEFR_FOLDERS = { a1: 'beginner', a2: 'elementary', b1: 'intermediate', b2: 'upper-intermediate', c1: 'advanced' }
const problems = []

function readJson(file) {
  const text = readFileSync(file, 'utf8')
  if (!text.trim()) throw new Error('file is empty')
  return JSON.parse(text)
}

for (const name of readdirSync(join(DATA, 'manifests'))) {
  const lang = name.replace('-manifest.json', '')
  const decks = readJson(join(DATA, 'manifests', name))

  for (const deck of decks) {
    const where = `${name} → ${deck.id}`
    if (deck.languageId !== lang) problems.push(`${where}: languageId "${deck.languageId}" should be "${lang}"`)
    if (deck.comingSoon) continue

    const cefr = /-(a1|a2|b1|b2|c1)-/i.exec(deck.id)?.[1]?.toLowerCase()
    if (!cefr) { problems.push(`${where}: id has no CEFR code (a1…c1)`); continue }

    const file = join(DATA, lang, CEFR_FOLDERS[cefr], deck.id, 'flashcards.json')
    if (!existsSync(file)) { problems.push(`${where}: missing ${file}`); continue }

    try {
      const cards = readJson(file)
      if (!Array.isArray(cards) || cards.length === 0) problems.push(`${where}: no cards in ${file}`)
      else if (cards.length !== deck.cardCount) problems.push(`${where}: cardCount is ${deck.cardCount} but file has ${cards.length}`)
    } catch (err) {
      problems.push(`${where}: ${file} is invalid (${err.message})`)
    }
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} data problem(s):\n  ` + problems.join('\n  '))
  process.exit(1)
}
console.log('✓ All deck data is consistent')
