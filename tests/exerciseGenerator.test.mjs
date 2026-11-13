import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { generateExercises, stripAccents } from '../src/utils/exerciseGenerator.js'

// Small deterministic random generator so test runs are repeatable
function seeded(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
}

const deck = JSON.parse(readFileSync('public/data/br/beginner/br-a1-deck1/flashcards.json', 'utf8'))

test('generates match, cloze, scramble and listening exercises', () => {
  const types = generateExercises(deck, { random: seeded(1) }).map((e) => e.type)
  assert.deepEqual([...new Set(types)].sort(), ['cloze', 'listening', 'match', 'scramble'])
})

test('every generated exercise is solvable with its own answer key', () => {
  for (const ex of generateExercises(deck, { random: seeded(7) })) {
    const p = ex.payload
    if (ex.type === 'cloze') {
      const sentence = p.chunks.map((c) => (c.type === 'blank' ? p.truthMap[c.blankId] : c.value)).join('')
      assert.ok(deck.some((card) => card.front.trim() === sentence), `cloze rebuilds a real card: "${sentence}"`)
    }
    if (ex.type === 'scramble') {
      assert.deepEqual([...p.wordsPool].sort(), p.correctSentence.split(/\s+/).sort())
    }
    if (ex.type === 'match') {
      assert.equal(Object.keys(p.truthMap).length, p.sources.length)
      assert.equal(new Set(p.targets.map((t) => t.text)).size, p.targets.length, 'no duplicate meanings')
    }
    if (ex.type === 'listening') assert.ok(p.transcript.length > 0)
  }
})

test('no card is used by two exercises', () => {
  const fronts = generateExercises(deck, { random: seeded(3) }).flatMap((ex) =>
    ex.type === 'match' ? ex.payload.sources.map((s) => s.text)
      : ex.type === 'scramble' ? [ex.payload.correctSentence]
      : ex.type === 'listening' ? [ex.payload.transcript]
      : [ex.payload.chunks.map((c) => (c.type === 'blank' ? ex.payload.truthMap.b1 : c.value)).join('')])
  assert.equal(new Set(fronts).size, fronts.length)
})

test('cards listing alternatives ("Um / Uma") are only used for matching', () => {
  const cards = [
    { id: 'a', front: 'Um / Uma', back: 'One' },
    { id: 'b', front: 'Dois / Duas', back: 'Two' },
    { id: 'c', front: 'Eu moro em São Paulo.', back: 'I live in São Paulo.' },
  ]
  for (let seed = 1; seed < 20; seed++) {
    for (const ex of generateExercises(cards, { random: seeded(seed) })) {
      if (ex.type !== 'match') assert.doesNotMatch(JSON.stringify(ex.payload), / \/ /)
    }
  }
})

test('stripAccents', () => {
  assert.equal(stripAccents('Você está ótimo, não?'), 'Voce esta otimo, nao?')
})

test('every published deck gets at least 5 generated exercises', () => {
  const CEFR = { a1: 'beginner', a2: 'elementary', b1: 'intermediate', b2: 'upper-intermediate', c1: 'advanced' }
  for (const manifest of readdirSync('public/data/manifests')) {
    const lang = manifest.replace('-manifest.json', '')
    for (const d of JSON.parse(readFileSync(join('public/data/manifests', manifest), 'utf8'))) {
      if (d.comingSoon) continue
      const file = join('public/data', lang, CEFR[/-(a1|a2|b1|b2|c1)-/.exec(d.id)[1]], d.id, 'flashcards.json')
      if (!existsSync(file)) continue
      const n = generateExercises(JSON.parse(readFileSync(file, 'utf8')), { random: seeded(11) }).length
      assert.ok(n >= 5, `${d.id} only got ${n} exercises`)
    }
  }
})
