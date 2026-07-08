<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// You can add more target learning options to this array down the road!
const targetLanguages = ref([
  { id: 'pt', name: 'Portuguese', flag: '🇧🇷', native: 'Português' },
  { id: 'en', name: 'English', flag: '🇺🇸', native: 'English' }
])

function selectLanguage(langId) {
  // Pushes the selection straight into the category custom path setup
  router.push(`/setup/${langId}`)
}
</script>

<template>
  <div class="picker-container">
    <h2>What language do you want to learn?</h2>
    <p class="prompt-desc">Pick an active course block to load your data modules:</p>

    <div class="languages-grid">
      <div 
        v-for="lang in targetLanguages" 
        :key="lang.id" 
        class="lang-card"
        @click="selectLanguage(lang.id)"
      >
        <span class="flag-emoji">{{ lang.flag }}</span>
        <h3>{{ lang.name }}</h3>
        <small class="native-label">{{ lang.native }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-container {
  text-align: center;
  max-width: 600px;
  margin: 3rem auto 0 auto;
}

h2 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.prompt-desc {
  color: #64748b;
  margin-bottom: 2.5rem;
}

.languages-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.lang-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 1.25rem;
  padding: 2rem 1rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.lang-card:hover {
  border-color: #4f46e5;
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.15);
}

.flag-emoji {
  font-size: 3.5rem;
  display: block;
  margin-bottom: 0.75rem;
}

h3 {
  font-size: 1.25rem;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.native-label {
  color: #94a3b8;
  font-weight: 500;
}
</style>