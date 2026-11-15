import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildLevelQuestions } from '../src/utils/placement.js'

const cards = JSON.parse(readFileSync('public/data/br/elementary/br-a2-deck11/flashcards.json', 'utf8'))

test('builds 5 questions, each with the right answer among 4 different options', () => {
  const questions = buildLevelQuestions(cards)
  assert.equal(questions.length, 5)
  for (const q of questions) {
    assert.equal(q.options.length, 4)
    assert.equal(new Set(q.options).size, 4)
    assert.ok(q.options.includes(q.answer))
    assert.equal(cards.find((c) => c.front === q.prompt).back, q.answer)
  }
})

test('never asks the same phrase twice in a level', () => {
  const prompts = buildLevelQuestions(cards).map((q) => q.prompt)
  assert.equal(new Set(prompts).size, prompts.length)
})

test('returns no questions when there are too few distinct meanings', () => {
  assert.deepEqual(buildLevelQuestions([{ front: 'a', back: 'x' }, { front: 'b', back: 'x' }]), [])
})

test('a phrase that appears twice with different translations is only used once', () => {
  const dupes = [
    { front: 'Com licença', back: 'Excuse me' },
    { front: 'Com licença', back: 'Excuse me / Pardon me' },
    { front: 'Obrigado', back: 'Thank you' },
    { front: 'Tchau', back: 'Bye' },
    { front: 'Oi', back: 'Hi' },
  ]
  for (let i = 0; i < 25; i++) {
    for (const q of buildLevelQuestions(dupes, { count: 4 })) {
      const both = q.options.filter((o) => o.startsWith('Excuse me'))
      assert.ok(both.length <= 1, 'both translations of "Com licença" offered as options')
    }
  }
})
