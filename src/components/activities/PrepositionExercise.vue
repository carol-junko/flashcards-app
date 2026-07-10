<template>
  <div class="preposition-exercise-container">
    <div class="exercise-instruction-block">
      <h3 class="game-instruction">{{ data?.instruction }}</h3>
      <p class="game-translation"><em>Combine a preposição e o artigo para formar a contração correta.</em></p>
    </div>

    <div class="sentence-preview-box">
      <span class="text-before-gap">{{ data?.sentenceBefore }}</span>
      <span class="contraction-gap-display" :class="{ 'has-value': currentContraction }">
        {{ currentContraction || '___' }}
      </span>
      <span class="text-after-gap">{{ data?.sentenceAfter }}</span>
    </div>

    <div class="contraction-forge-workspace">
      <!-- Left Element: Base Prepositions -->
      <div class="forge-selector-group">
        <span class="selector-group-label">Preposição</span>
        <div class="forge-options-grid">
          <button 
            v-for="prep in localPrepositions" 
            :key="prep"
            class="btn btn-outline forge-option-btn"
            :class="{ 'is-selected': selectedPrep === prep }"
            @click="selectedPrep = prep"
          >
            {{ prep }}
          </button>
        </div>
      </div>

      <div class="forge-math-sign">+</div>

      <!-- Right Element: Target Articles / Pronouns -->
      <div class="forge-selector-group">
        <span class="selector-group-label">Artigo / Pronome</span>
        <div class="forge-options-grid">
          <button 
            v-for="art in localArticles" 
            :key="art"
            class="btn btn-outline forge-option-btn"
            :class="{ 'is-selected': selectedArticle === art }"
            @click="selectedArticle = art"
          >
            {{ art }}
          </button>
        </div>
      </div>
    </div>

    <div class="exercise-action-panel">
      <button 
        class="btn btn-primary action-submit-btn" 
        :disabled="!selectedPrep || !selectedArticle" 
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

const selectedPrep = ref(null)
const selectedArticle = ref(null)
const localPrepositions = ref([])
const localArticles = ref([])

const currentContraction = computed(() => {
  if (!selectedPrep.value || !selectedArticle.value) return ''
  const combinationKey = `${selectedPrep.value}+${selectedArticle.value}`
  return props.data?.combinationsMap?.[combinationKey] || '???'
})

const shuffleInPlace = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const resetForgeWorkspace = () => {
  selectedPrep.value = null
  selectedArticle.value = null
  
  if (props.data) {
    localPrepositions.value = shuffleInPlace(JSON.parse(JSON.stringify(props.data.prepositions || [])))
    localArticles.value = shuffleInPlace(JSON.parse(JSON.stringify(props.data.articles || [])))
  }
}

const evaluateSubmission = () => {
  const correctContraction = props.data?.correctContraction || ''
  const isCorrect = currentContraction.value.toLowerCase() === correctContraction.toLowerCase()

  emit('answered', {
    exerciseId: props.data.id,
    isCorrect,
    provided: {
      preposition: selectedPrep.value,
      article: selectedArticle.value,
      contraction: currentContraction.value
    },
    expected: { contraction: correctContraction }
  })
}

watch(() => props.data, resetForgeWorkspace, { deep: true })
onMounted(resetForgeWorkspace)
</script>