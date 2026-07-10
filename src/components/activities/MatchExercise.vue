<template>
  <div class="match-exercise-container">
    <div class="exercise-instruction-block">
      <h3 class="game-instruction">{{ data?.instruction }}</h3>
      <p class="game-translation"><em>Combine os pares corretos.</em></p>
    </div>

    <div class="match-columns-grid">
      <!-- Left Column: Source Items -->
      <div class="match-items-column">
        <button
          v-for="item in sourceList"
          :key="item.id"
          class="match-card-btn"
          :class="{
            'is-selected': selectedLeft === item.id,
            'is-paired': permanentPairs[item.id]
          }"
          :disabled="!!permanentPairs[item.id]"
          @click="selectLeftItem(item.id)"
        >
          {{ item.text }}
        </button>
      </div>

      <!-- Right Column: Target Items -->
      <div class="match-items-column">
        <button
          v-for="item in targetList"
          :key="item.id"
          class="match-card-btn"
          :class="{
            'is-selected': selectedRight === item.id,
            'is-paired': Object.values(permanentPairs).includes(item.id)
          }"
          :disabled="Object.values(permanentPairs).includes(item.id)"
          @click="selectRightItem(item.id)"
        >
          {{ item.text }}
        </button>
      </div>
    </div>

    <div class="exercise-action-panel">
      <button 
        class="btn btn-primary action-submit-btn" 
        :disabled="!hasCompletedAllMatches" 
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

const sourceList = ref([])
const targetList = ref([])
const selectedLeft = ref(null)
const selectedRight = ref(null)
const permanentPairs = ref({}) // Format: { leftId: rightId }

const hasCompletedAllMatches = computed(() => {
  return Object.keys(permanentPairs.value).length === sourceList.value.length
})

const shuffleInPlace = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const initializeMatchDeck = () => {
  selectedLeft.value = null
  selectedRight.value = null
  permanentPairs.value = {}

  if (props.data?.sources && props.data?.targets) {
    sourceList.value = shuffleInPlace(JSON.parse(JSON.stringify(props.data.sources)))
    targetList.value = shuffleInPlace(JSON.parse(JSON.stringify(props.data.targets)))
  }
}

const selectLeftItem = (id) => { selectedLeft.value = id; checkForPairingMatch() }
const selectRightItem = (id) => { selectedRight.value = id; checkForPairingMatch() }

const checkForPairingMatch = () => {
  if (selectedLeft.value !== null && selectedRight.value !== null) {
    permanentPairs.value[selectedLeft.value] = selectedRight.value
    selectedLeft.value = null
    selectedRight.value = null
  }
}

const evaluateSubmission = () => {
  let isCorrect = true
  const mistakes = []
  const expectedMap = props.data?.truthMap || {} // Structure: { leftId: expectedRightId }

  Object.keys(permanentPairs.value).forEach(leftId => {
    const providedRightId = permanentPairs.value[leftId]
    const expectedRightId = expectedMap[leftId]

    if (String(providedRightId) !== String(expectedRightId)) {
      isCorrect = false
      mistakes.push({ leftId, providedRightId, expectedRightId })
    }
  })

  emit('answered', { exerciseId: props.data.id, isCorrect, mistakes })
}

watch(() => props.data, initializeMatchDeck, { deep: true })
onMounted(initializeMatchDeck)
</script>