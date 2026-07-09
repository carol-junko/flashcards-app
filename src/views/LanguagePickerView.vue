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

<style scoped>
.picker-wrapper {
  max-width: 700px;
  margin: 3rem auto;
  padding: 0 1rem;
}

.picker-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

h2 {
  font-size: 1.85rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

.languages-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lang-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.lang-card:hover {
  border-color: #4f46e5;
  background-color: #fcfcff;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.05);
}

.flag-icon {
  font-size: 2.5rem;
  margin-right: 1.5rem;
  user-select: none;
}

.lang-details {
  flex-grow: 1;
}

.lang-details h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.lang-details p {
  font-size: 0.95rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.arrow-indicator {
  font-size: 1.25rem;
  color: #94a3b8;
  font-weight: 700;
  transition: all 0.2s ease;
}

.lang-card:hover .arrow-indicator {
  color: #4f46e5;
  transform: translateX(2px);
}

/* Status States Box Layout */
.status-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  text-align: center;
  gap: 1rem;
}

.message-loading p {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

.message-error p {
  color: #ef4444;
  font-weight: 500;
  margin: 0;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>