import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LanguagePickerView from '../views/LanguagePickerView.vue'
import CategoryView from '../views/CategoryView.vue'
import ExerciseView from '../views/ExerciseView.vue'
import FlashcardsView from '../views/FlashcardsView.vue'
import ExerciseDashboard from '@/views/ExerciseDashboard.vue'
import PlacementView from '@/views/PlacementView.vue'
import StudyPlanView from '@/views/StudyPlanView.vue'
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
    path: '/learn/:langId/:deckId',
    name: 'ExerciseHub',
    component: ExerciseView,
  },
  {
    path: '/learn/:langId/:deckId/flashcards',
    name: 'Flashcards',
    component: FlashcardsView,
  },
  {
    path: '/learn/:langId/:deckId/exercises',
    name: 'Exercises',
    component: ExerciseDashboard,
  },
  {
    path: '/placement/:langId',
    name: 'Placement',
    component: PlacementView,
  },
  {
    path: '/plan/:langId',
    name: 'StudyPlan',
    component: StudyPlanView,
  },
]


const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
