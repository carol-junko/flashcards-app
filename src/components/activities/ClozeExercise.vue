<template>
  <div class="cloze-exercise-container">
    <div class="exercise-instruction-block">
      <h3 class="game-instruction">{{ data?.instruction }}</h3>
      <p class="game-translation"><em>Preencha as lacunas com as palavras corretas.</em></p>
    </div>

    <!-- Sentence with Inline Inputs -->
    <div class="cloze-sentence-card">
      <template v-for="(chunk, idx) in sentenceChunks" :key="idx">
        <span v-if="chunk.type === 'text'" class="sentence-text-segment">
          {{ chunk.value }}
        </span>
        <input
          v-else
          v-model="userInputs[chunk.blankId]"
          type="text"
          class="cloze-inline-input"
          :style="{ width: calculateInputWidth(chunk.expectedLength) }"
          placeholder="..."
          autocomplete="off"
        />
      </template>
    </div>

    <div class="exercise-action-panel">
      <button 
        class="btn btn-primary action-submit-btn" 
        :disabled="!hasEnteredAllBlanks" 
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

const userInputs = ref({})
const sentenceChunks = ref([])

const hasEnteredAllBlanks = computed(() => {
  const blanks = sentenceChunks.value.filter(c => c.type === 'blank')
  if (blanks.length === 0) return false
  return blanks.every(b => userInputs.value[b.blankId]?.trim().length > 0)
})

const calculateInputWidth = (charLength) => {
  const baseWidth = Math.max(charLength, 3)
  return `${baseWidth * 12 + 24}px`
}

const initializeClozeWorkspace = () => {
  userInputs.value = {}
  if (props.data?.chunks) {
    // Deep operational separation
    sentenceChunks.value = JSON.parse(JSON.stringify(props.data.chunks))
    
    // Seed inputs map keys cleanly
    sentenceChunks.value.forEach(chunk => {
      if (chunk.type === 'blank') {
        userInputs.value[chunk.blankId] = ''
      }
    })
  }
}

const evaluateSubmission = () => {
  let isCorrect = true
  const mistakes = []
  const expectedMap = props.data?.truthMap || {}

  Object.keys(userInputs.value).forEach(blankId => {
    const provided = userInputs.value[blankId].trim().toLowerCase()
    const expected = expectedMap[blankId]?.trim().toLowerCase()

    if (provided !== expected) {
      isCorrect = false
      mistakes.push({ blankId, provided, expected: expectedMap[blankId] })
    }
  })

  emit('answered', { exerciseId: props.data.id, isCorrect, mistakes })
}

watch(() => props.data, initializeClozeWorkspace, { deep: true })
onMounted(initializeClozeWorkspace)
</script>