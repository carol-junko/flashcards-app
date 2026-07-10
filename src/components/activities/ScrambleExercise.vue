<template>
  <div class="scramble-exercise-container">
    <div class="exercise-instruction-block">
      <h3 class="game-instruction">{{ data?.instruction }}</h3>
      <p class="game-translation"><em>Ordene as palavras para formar a frase correta.</em></p>
    </div>

    <!-- Target Assembly Area Grid -->
    <div class="scramble-assembly-board">
      <div v-if="assembledWords.length === 0" class="assembly-placeholder">
        Toque nos blocos de palavras para construir a frase...
      </div>
      <button 
        v-for="(word, idx) in assembledWords" 
        :key="`assembled-${idx}`"
        class="word-token-chip active-placed"
        @click="returnWordToPool(idx)"
      >
        {{ word }}
      </button>
    </div>

    <!-- Source Pool Section -->
    <div class="scramble-source-pool">
      <button
        v-for="(word, idx) in poolWords"
        :key="`pool-${idx}`"
        class="word-token-chip"
        :disabled="word.isUsed"
        @click="addWordToAssembly(idx)"
      >
        {{ word.text }}
      </button>
    </div>

    <div class="exercise-action-panel">
      <button 
        class="btn btn-primary action-submit-btn" 
        :disabled="hasRemainingPoolWords" 
        @click="evaluateSubmission"
      >
        Verificar Resposta
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  data: { type: Object, required: true }
})
const emit = defineEmits(['answered'])

const poolWords = ref([])
const assembledWords = ref([])

const hasRemainingPoolWords = computed(() => poolWords.value.some(w => !w.isUsed))

const shuffleInPlace = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const initializeScrambleGame = () => {
  assembledWords.value = []
  if (props.data?.wordsPool) {
    const freshClone = JSON.parse(JSON.stringify(props.data.wordsPool))
    const randomized = shuffleInPlace(freshClone)
    poolWords.value = randomized.map(word => ({ text: word, isUsed: false }))
  }
}

const addWordToAssembly = (idx) => {
  if (poolWords.value[idx].isUsed) return
  poolWords.value[idx].isUsed = true
  assembledWords.value.push(poolWords.value[idx].text)
}

const returnWordToPool = (assembledIdx) => {
  const wordText = assembledWords.value[assembledIdx]
  // Restore state to original wrapper matching index
  const originalPoolItem = poolWords.value.find(w => w.text === wordText && w.isUsed)
  if (originalPoolItem) {
    originalPoolItem.isUsed = false
  }
  assembledWords.value.splice(assembledIdx, 1)
}

const evaluateSubmission = () => {
  const rawProvided = assembledWords.value.join(' ')
  const rawExpected = props.data?.correctSentence || ''
  
  const isCorrect = rawProvided.trim().toLowerCase() === rawExpected.trim().toLowerCase()

  emit('answered', {
    exerciseId: props.data.id,
    isCorrect,
    provided: rawProvided,
    expected: rawExpected
  })
}

watch(() => props.data, initializeScrambleGame, { deep: true })
onMounted(initializeScrambleGame)
</script>