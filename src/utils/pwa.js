// Installable app support: registers the service worker and exposes the
// browser's "install" prompt so the UI can show an "Install app" button.
import { ref } from 'vue'

// The browser fires 'beforeinstallprompt' when the app can be installed
// (Chrome, Edge, Android). Safari on iPhone doesn't: there, users install
// from the Share menu → "Add to Home Screen".
const installEvent = ref(null)
export const canInstall = ref(false)

export function registerServiceWorker() {
  // Only in production builds: in `npm run dev` a service worker would
  // fight with Vite's hot reload.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}

export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault() // show our own button instead of the browser's mini-bar
    installEvent.value = event
    canInstall.value = true
  })
  window.addEventListener('appinstalled', () => {
    installEvent.value = null
    canInstall.value = false
  })
}

export async function promptInstall() {
  if (!installEvent.value) return false
  installEvent.value.prompt()
  const { outcome } = await installEvent.value.userChoice
  installEvent.value = null
  canInstall.value = false
  return outcome === 'accepted'
}
