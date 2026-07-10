<template>
  <div class="conjugation-exercise-container">
    <div class="exercise-instruction-block">
      <h3 class="game-instruction">{{ data?.instruction }}</h3>
      <p class="game-translation"><em>Conjugue o verbo entre parênteses no tempo correto.</em></p>
    </div>

    <!-- Active Grid Table Interface -->
    <div class="conjugation-matrix-card">
      <div class="conjugation-verb-banner">
        Verbo: <span class="highlight-verb-text">{{ data?.verbTarget }}</span>
      </div>
      
      <div class="conjugation-input-table-grid">
        <div 
          v-for="(row, idx) in conjugationRows" 
          :key="idx" 
          class="conjugation-table-row"
        >
          <label :for="`pronoun-${idx}`" class="pronoun-prefix-cell">{{ row.pronoun }}</label>
          <div class="input-cell-wrapper">
            <input
              :id="`pronoun-${idx}`"
              v-model="userConjugations[row.rowId]"
              type="text"
              class="form-control conjugation-field"
              placeholder="Digite a conjugação..."
              autocomplete="off"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="exercise-action-panel">
      <button 
        class="btn btn-primary action-submit-btn" 
        :disabled="!isMatrixFormComplete" 
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

const userConjugations = ref({})
const conjugationRows = ref([])

const isMatrixFormComplete = computed(() => {
  if (conjugationRows.value.length === 0) return false
  return conjugationRows.value.every(row => userConjugations.value[row.rowId]?.trim().length > 0)
})

const initializeMatrixGrid = () => {
  userConjugations.value = {}
  if (props.data?.rows) {
    conjugationRows.value = JSON.parse(JSON.stringify(props.data.rows))
    conjugationRows.value.forEach(row => {
      userConjugations.value[row.rowId] = ''
    })
  }
}

const evaluateSubmission = () => {
  let isCorrect = true
  const mistakes = []
  const expectedMap = props.data?.truthMap || {}

  Object.keys(userConjugations.value).forEach(rowId => {
    const provided = userConjugations.value[rowId].trim().toLowerCase()
    const expected = expectedMap[rowId]?.trim().toLowerCase()

    if (provided !== expected) {
      isCorrect = false
      mistakes.push({ rowId, provided, expected: expectedMap[rowId] })
    }
  })

  emit('answered', { exerciseId: props.data.id, isCorrect, mistakes })
}

watch(() => props.data, initializeMatrixGrid, { deep: true })
onMounted(initializeMatrixGrid)
</script>