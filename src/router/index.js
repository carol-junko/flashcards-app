import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LanguagePickerView from '@/views/LanguagePickerView.vue'
import CategoryView from '@/views/CategoryView.vue'
import ActivityHubView from '@/views/ActivityHubView.vue'
import DeckView from '@/views/DeckView.vue'


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
    { 
      path: '/setup/:langId', 
      name: 'setup', 
      component: CategoryView 
    },
    { 
      path: '/hub/:deckId', 
      name: 'hub', 
      component: ActivityHubView 
    },
  ],
})

export default router
