import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { GameProvider } from './game/GameProvider'
import { SettingsProvider } from './settings/SettingsProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
