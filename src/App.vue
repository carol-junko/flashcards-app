<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/languages">Language</RouterLink>
    </nav>
  </header>

  <!-- This is where Vue Router swaps out HomeView, DeckView, etc. -->
  <RouterView />
</template>

<style scoped>
header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

nav {
  display: flex;
  gap: 1rem;
}

nav a {
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
}

/* This class is automatically applied by Vue Router to the active page link */
nav a.router-link-exact-active {
  color: #4f46e5;
  border-bottom: 2px solid #4f46e5;
}
</style>