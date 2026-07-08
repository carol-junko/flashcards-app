<template>
  <div class="home-container">
    <!-- Welcome Hero Section -->
    <section class="hero">
      <h1>Welcome to Flashcards</h1>
      <p class="subtitle">Master grammar and vocabulary through reactive practice.</p>
      
      <!-- Navigates directly to our next step -->
      <RouterLink to="/languages" class="cta-btn">Start Learning Now →</RouterLink>
    </section>

    <hr class="divider" />

    <!-- Explainer Sections -->
    <div class="info-grid">
      <section class="info-card">
        <h3>About the Platform</h3>
        <p>Flashcards is an interactive learning experience designed to bridge the gap between simple vocabulary memorization and active contextual grammar structures.</p>
      </section>

      <section class="info-card">
        <h3>How to Use</h3>
        <p>Select your target language, filter your desired tier level and category, and toggle freely between focused flashcard retention decks or immersive text puzzles.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.hero {
  text-align: center;
  padding: 3rem 1rem;
  background: linear-gradient(135deg, #fefefe 0%, #f1f5f9 100%);
  border-radius: 1.5rem;
  border: 1px solid #e2e8f0;
}

h1 {
  font-size: 2.75rem;
  color: #4f46e5;
  margin-bottom: 1rem;
  font-weight: 800;
}

.subtitle {
  font-size: 1.25rem;
  color: #475569;
  margin-bottom: 2rem;
}

.cta-btn {
  display: inline-block;
  background-color: #4f46e5;
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  font-weight: 600;
  border-radius: 0.75rem;
  transition: transform 0.2s, background-color 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.cta-btn:hover {
  background-color: #4338ca;
  transform: translateY(-2px);
}

.divider {
  margin: 3rem 0;
  border: 0;
  height: 1px;
  background-color: #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: white;
  padding: 1.75rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.info-card h3 {
  color: #1e293b;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

.info-card p {
  color: #64748b;
}
</style>