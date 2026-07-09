<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function startLearning() {
  router.push('/languages')
}
</script>

<template>
  <div class="home-wrapper">
    <div class="hero-card">
      <div class="hero-logo">📇</div>
      <h1>Welcome to Flashcards</h1>
      <p class="tagline">
        This is a place where for you to learn other language on your own pace, throught the repeatition method and grammar exercises. 
      </p>
      
      <button @click="startLearning" class="cta-button">
        Start Learning Now →
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-wrapper {
  max-width: 600px;
  margin: 5rem auto;
  padding: 0 1rem;
}

.hero-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  padding: 3.5rem 2rem;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
}

.hero-logo {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h1 {
  font-size: 2.25rem;
  color: #1e293b;
  margin: 0 0 1rem 0;
  font-weight: 800;
}

.tagline {
  color: #64748b;
  font-size: 1.15rem;
  line-height: 1.6;
  margin: 0 0 2.5rem 0;
}

.cta-button {
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.cta-button:hover {
  background-color: #4338ca;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.3);
}
</style>