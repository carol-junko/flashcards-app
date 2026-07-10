<template>
  <div class="dialogue-exercise-container">
    <div class="exercise-instruction-block">
      <h3 class="game-instruction">{{ data?.instruction }}</h3>
      <p class="game-translation"><em>Complete a conversa escolhendo a resposta mais adequada.</em></p>
    </div>

    <div class="dialogue-chat-thread">
      <div 
        v-for="(message, idx) in data?.history" 
        :key="idx" 
        class="chat-bubble-row"
        :class="message.role === 'left' ? 'role-left' : 'role-right'"
      >
        <div class="character-avatar-badge">{{ message.character?.[0] }}</div>
        <div class="chat-bubble-content">
          <span class="character-name-label">{{ message.character }}</span>
          <p class="character-text-phrase">{{ message.text }}</p>
          <span v-if="message.translation" class="character-text-translation">
            {{ message.translation }}
          </span>
        </div>
      </div>

      <!-- The Dynamic User Target Option Slot -->
      <div class="chat-bubble-row role-right user-target-slot">
        <div class="character-avatar-badge user-avatar">Você</div>
        <div class="chat-bubble-content user-bubble">
          <span class="character-name-label">Sua Resposta</span>
          <p class="character-text-phrase" :class="{ 'pending-selection-text': !selectedOptionText }">
            {{ selectedOptionText || 'Selecione uma opção abaixo...' }}
          </p>
        </div>
      </div>
    </div>

    <div class="dialogue-options-selector">
      <button 
        v-for="(option, idx) in data?.options" 
        :key="idx"
        class="dialogue-option-card"
        :class="{ 'is-active': selectedIndex === idx }"
        @click="selectedIndex = idx"
      >
        <span class="option-index-marker">{{ String.fromCharCode(65 + idx) }}</span>
        <div class="option-text-group">
          <p class="option-text-main">{{ option.text }}</p>
          <span v-if="option.translation" class="option-text-sub"><em>{{ option.translation }}</em></span>
        </div>
      </button>
    </div>

    <div class="exercise-action-panel">
      <button 
        class="btn btn-primary action-submit-btn" 
        :disabled="selectedIndex === null" 
        @click="evaluateSubmission"
      >
        Verificar Resposta
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: { type: Object, required: true }
})
const emit = defineEmits(['answered'])

const selectedIndex = ref(null)

const selectedOptionText = computed(() => {
  if (selectedIndex.value === null) return ''
  return props.data?.options?.[selectedIndex.value]?.text || ''
})

const evaluateSubmission = () => {
  if (selectedIndex.value === null) return

  const selectedOption = props.data?.options?.[selectedIndex.value]
  const isCorrect = selectedOption?.isCorrect === true

  emit('answered', {
    exerciseId: props.data.id,
    isCorrect,
    provided: selectedOption?.text,
    expected: props.data?.options?.find(o => o.isCorrect)?.text
  })
}

watch(() => props.data, () => { selectedIndex.value = null }, { deep: true })
</script>