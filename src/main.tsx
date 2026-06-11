import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { useStore } from './store'
import { applyTheme } from './lib/settings'

useStore.persist.onFinishHydration((state) => {
  applyTheme(state.settings.theme)
})
useStore.persist.rehydrate()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
