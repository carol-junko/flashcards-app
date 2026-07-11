<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const languages = ref([])
const isLoading = ref(true)
const fetchError = ref(null)

onMounted(async () => {
  try {
    const response = await fetch('/data/languages.json')
    if (!response.ok) {
      throw new Error(`Failed to load language configurations: ${response.status}`)
    }
    languages.value = await response.json()
  } catch (error) {
    console.error("Error retrieving languages catalogue:", error)
    fetchError.value = "Unable to load language programs. Please check your data directory structure."
  } finally {
    isLoading.value = false
  }
})

function selectLanguage(langId) {
  router.push(`/category/${langId}`)
}
</script>

<template>
  <div class="picker-wrapper">
    <div class="picker-header">
      <h2>What language would you like to practice?</h2>
      <p class="subtitle">Select a language to browse its structural training modules</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="status-box message-loading">
      <div class="spinner"></div>
      <p>Loading available target language tracks...</p>
    </div>

    <!-- Error Fallback State -->
    <div v-else-if="fetchError" class="status-box message-error">
      <span>⚠️</span>
      <p>{{ fetchError }}</p>
    </div>

    <!-- Main Languages Interactive Grid -->
    <div v-else class="languages-grid">
      <div 
        v-for="lang in languages" 
        :key="lang.id" 
        class="lang-card"
        @click="selectLanguage(lang.id)"
      >
        <span class="flag-icon" role="img" :aria-label="lang.name + ' flag'">
          {{ lang.flag }}
        </span>
        <div class="lang-details">
          <h3>{{ lang.name }}</h3>
        </div>
        <span class="arrow-indicator">→</span>
      </div>
    </div>
  </div>
</template>


