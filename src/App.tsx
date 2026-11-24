import { Navigate, Route, Routes } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { SetupScreen } from './screens/SetupScreen'
import { GameScreen } from './screens/GameScreen'
import { PauseScreen } from './screens/PauseScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { EndScreen } from './screens/EndScreen'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/setup" element={<SetupScreen />} />
      <Route path="/game" element={<GameScreen />} />
      <Route path="/pause" element={<PauseScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/end" element={<EndScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
