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
