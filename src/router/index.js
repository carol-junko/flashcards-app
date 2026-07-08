import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DeckView from '@/views/DeckView.vue'
import LanguagePickerView from '@/views/LanguagePickerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/deck/:deckID',
      name: 'deck',
      component: DeckView,
    },
    {
      path: '/languages',
      name: 'languages',
      component: LanguagePickerView,
    },
  ],
})

export default router
