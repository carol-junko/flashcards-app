// Builds practice exercises from a deck's own flashcards, so every deck has
// activities even without a hand-written exercises.json, and the practice
// always reuses the words the learner just studied.
//
// Pure function (no fetch, no Vue): pass `random` to make it deterministic in tests.

const words = (text) => text.trim().split(/\s+/)
// Cards like "Um / Uma" list alternatives: fine to match, not to type or reorder
const hasAlternatives = (text) => /\s\/\s/.test(text)

export function stripAccents(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function shuffle(list, random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Takes cards from a shuffled pool, never reusing one across exercises
function takeFrom(pool, used, count, accept) {
  const picked = []
  for (const card of pool) {
    if (picked.length === count) break
    if (!used.has(card.id) && accept(card)) {
      picked.push(card)
      used.add(card.id)
    }
  }
  return picked
}

function matchExercise(cards, n) {
  const sources = cards.map((c, i) => ({ id: `s${i + 1}`, text: c.front }))
  const targets = cards.map((c, i) => ({ id: `t${i + 1}`, text: c.back }))
  const truthMap = Object.fromEntries(cards.map((_, i) => [`s${i + 1}`, `t${i + 1}`]))
  return {
    id: `gen-match-${n}`,
    type: 'match',
    payload: { instruction: 'Match each phrase with its meaning.', sources, targets, truthMap },
  }
}

// Find a word worth blanking: the longest token with 4+ letters
// (3+ for a one-word card such as "dez", where the blank is the whole answer)
const TOKEN = /^([^\p{L}]*)([\p{L}][\p{L}'-]*)([^\p{L}]*)$/u
function blankableIndex(tokens) {
  const minLetters = tokens.length === 1 ? 3 : 4
  let best = -1
  tokens.forEach((token, i) => {
    const m = TOKEN.exec(token)
    if (m && m[2].length >= minLetters && (best === -1 || m[2].length > TOKEN.exec(tokens[best])[2].length)) best = i
  })
  return best
}

function clozeExercise(card, n) {
  const tokens = words(card.front)
  const i = blankableIndex(tokens)
  // "Eu moro em São Paulo." with "Paulo." chosen → before "Eu moro em São ", word "Paulo", after "."
  const [, lead, word, trail] = TOKEN.exec(tokens[i])
  const before = (i > 0 ? tokens.slice(0, i).join(' ') + ' ' : '') + lead
  const after = trail + (i < tokens.length - 1 ? ' ' + tokens.slice(i + 1).join(' ') : '')
  return {
    id: `gen-cloze-${n}`,
    type: 'cloze',
    payload: {
      instruction: `Fill in the blank. Meaning: “${card.back}”`,
      chunks: [
        { type: 'text', value: before },
        { type: 'blank', blankId: 'b1', expectedLength: word.length },
        { type: 'text', value: after },
      ],
      truthMap: { b1: word },
    },
  }
}

function scrambleExercise(card, n, random) {
  return {
    id: `gen-scramble-${n}`,
    type: 'scramble',
    payload: {
      instruction: `Build the sentence that means: “${card.back}”`,
      wordsPool: shuffle(words(card.front), random),
      correctSentence: card.front.trim(),
    },
  }
}

function listeningExercise(card, n) {
  const plain = stripAccents(card.front)
  return {
    id: `gen-listening-${n}`,
    type: 'listening',
    payload: {
      instruction: 'Listen and type what you hear.',
      transcript: card.front.trim(),
      // Typing without accents still counts (dictation tests listening, not spelling)
      acceptedVariations: plain !== card.front ? [plain] : [],
    },
  }
}

export function generateExercises(cards, { random = Math.random } = {}) {
  const pool = shuffle(cards.filter((c) => c && c.front && c.back), random)
  const used = new Set()
  const count = (c) => words(c.front).filter((w) => /\p{L}/u.test(w)).length
  const exercises = []

  // Matching works best with short items: use the deck's shortest cards
  // (sort is stable, so equally short cards keep their random order)
  const shortestFirst = [...pool].sort((a, b) => count(a) - count(b))
  const backs = new Set()
  const matchCards = takeFrom(shortestFirst, used, 5, (c) => {
    const ok = count(c) <= 10 && !backs.has(c.back)
    if (ok) backs.add(c.back)
    return ok
  })
  if (matchCards.length >= 3) exercises.push(matchExercise(matchCards, 1))

  // Limits scale from A1 single words up to B2 sentences of ~15 words
  const typeable = (c) => !hasAlternatives(c.front)
  const cloze = takeFrom(pool, used, 2, (c) => typeable(c) && blankableIndex(words(c.front)) !== -1)
  const scramble = takeFrom(pool, used, 2, (c) => typeable(c) && count(c) >= 3 && count(c) <= 14)
  const listening = takeFrom(pool, used, 2, (c) => typeable(c) && count(c) <= 18)

  // Interleave the types so the session alternates skills
  for (let i = 0; i < 2; i++) {
    if (cloze[i]) exercises.push(clozeExercise(cloze[i], i + 1))
    if (scramble[i]) exercises.push(scrambleExercise(scramble[i], i + 1, random))
    if (listening[i]) exercises.push(listeningExercise(listening[i], i + 1))
  }
  return exercises
}
