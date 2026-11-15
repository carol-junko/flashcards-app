
<script setup>
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { loadSavedPlan } from '@/utils/planStore'
import { canInstall, promptInstall } from '@/utils/pwa'

const route = useRoute()
// localStorage isn't reactive, so re-read the saved plan on every navigation
// (the "My plan" link then appears as soon as a plan is saved).
const planLang = ref(null)
watch(() => route.fullPath, () => { planLang.value = loadSavedPlan()?.langId || null }, { immediate: true })
</script>

<template>
  <header class="app-navigation-header">
    <nav class="app-nav-container">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/languages">Language</RouterLink>
      <RouterLink v-if="planLang" :to="`/plan/${planLang}`">My plan</RouterLink>
      <button v-if="canInstall" class="install-app-btn" @click="promptInstall">📲 Install app</button>
    </nav>
  </header>

  <RouterView />
</template>