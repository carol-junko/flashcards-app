import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LanguagePickerView from '../views/LanguagePickerView.vue'
import CategoryView from '../views/CategoryView.vue'
import ExerciseView from '../views/ExerciseView.vue'
import FlashcardsView from '../views/FlashcardsView.vue'
import ExerciseDashboard from '@/views/ExerciseDashboard.vue'
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/languages',
    name: 'LanguagePicker',
    component: LanguagePickerView,
  },
  {
    path: '/category/:langId',
    name: 'Category',
    component: CategoryView,
  },
  {
    path: '/hub/:deckId',
    name: 'ExerciseHub',
    component: ExerciseView,
  },
  {
    path: '/hub/:deckId/flashcards',
    name: 'Flashcards',
    component: FlashcardsView,
  },
  {
    path: '/exercises/:deckId/exercises',
    name: 'Exercises',
    component: ExerciseDashboard,
  },
]


const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
