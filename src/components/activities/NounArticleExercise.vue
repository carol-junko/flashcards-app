<template>
  <div class="noun-article-exercise-container">
    <div class="exercise-instruction-block">
      <h3 class="game-instruction">{{ data?.instruction }}</h3>
      <p class="game-translation"><em>Sort each noun by its gender.</em></p>
    </div>

    <div class="noun-card-stack-zone">
      <div v-if="currentNoun" class="active-noun-card" draggable="true" @dragstart="onDragStart">
        <span class="noun-text-display">{{ currentNoun }}</span>
        <span class="hint-tap-instruction">Drag it or tap a column below</span>
      </div>
      <div v-else class="stack-depleted-msg">
        🎉 All nouns sorted!
      </div>
    </div>

    <div class="article-columns-workspace">
      <div 
        v-for="category in ['masculine', 'feminine']" 
        :key="category"
        class="article-drop-column"
        :class="[`${category}-target`, { 'is-dragover': activeDragOver === category }]"
        @dragover.prevent="activeDragOver = category"
        @dragleave="activeDragOver = null"
        @drop="onDrop(category)"
        @click="assignViaClick(category)"
      >
        <div class="column-title-header">
          <!-- Article hints (e.g. "o / um") come from the data, so this works for any language -->
          {{ category === 'masculine' ? 'Masculine' : 'Feminine' }}
          <span v-if="data?.labels?.[category]" class="column-article-hint">({{ data.labels[category] }})</span>
        </div>
        <div class="allocated-tags-list">
          <span v-for="(noun, idx) in allocatedLists[category]" :key="idx" class="sorted-noun-tag">
            {{ noun }} 
            <button class="pop-tag-btn" @click.stop="removeAllocatedNoun(noun, category)">×</button>
          </span>
        </div>
      </div>
    </div>

    <div class="exercise-action-panel">
      <button 
        class="btn btn-primary action-submit-btn" 
        :disabled="unallocatedNouns.length > 0" 
        @click="evaluateSubmission"
      >
        Check answer
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

const unallocatedNouns = ref([])
const allocatedLists = ref({ masculine: [], feminine: [] })
const activeDragOver = ref(null)

const currentNoun = computed(() => unallocatedNouns.value[0] || null)

// Fisher-Yates high-reliability execution shuffle algorithm
const shuffleArrayInPlace = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const initializeSortingDeck = () => {
  allocatedLists.value = { masculine: [], feminine: [] }
  activeDragOver.value = null
  
  if (props.data?.nounsList) {
    // Deep structural copy protection
    const cleanClone = JSON.parse(JSON.stringify(props.data.nounsList))
    unallocatedNouns.value = shuffleArrayInPlace(cleanClone)
  }
}

const onDragStart = (event) => {
  if (!currentNoun.value) return
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', currentNoun.value)
}

const onDrop = (category) => {
  activeDragOver.value = null
  if (currentNoun.value) allocateNoun(currentNoun.value, category)
}

const assignViaClick = (category) => {
  if (currentNoun.value) allocateNoun(currentNoun.value, category)
}

const allocateNoun = (noun, category) => {
  allocatedLists.value[category].push(noun)
  unallocatedNouns.value.shift()
}

const removeAllocatedNoun = (noun, category) => {
  allocatedLists.value[category] = allocatedLists.value[category].filter(n => n !== noun)
  unallocatedNouns.value.unshift(noun)
}

const evaluateSubmission = () => {
  let isCorrect = true
  const mistakes = []
  const expectedMap = props.data?.truthMap || {}
  // Name the array instead of starting a line with "[": without semicolons,
  // JavaScript would glue that line onto the previous one ({}[...].forEach).
  const categories = ['masculine', 'feminine']

  categories.forEach(category => {
    allocatedLists.value[category].forEach(noun => {
      if (expectedMap[noun] !== category) {
        isCorrect = false
        mistakes.push({ noun, expected: expectedMap[noun], provided: category })
      }
    })
  })

  emit('answered', { exerciseId: props.data.id, isCorrect, mistakes })
}

watch(() => props.data, initializeSortingDeck, { deep: true })
onMounted(initializeSortingDeck)
</script>