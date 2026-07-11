
<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="app-navigation-header">
    <nav class="app-nav-container">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/languages">Language</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>