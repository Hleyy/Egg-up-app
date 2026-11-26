import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ArScreen } from './screens/ArScreen'
import { BagScreen } from './screens/BagScreen'
import { BoardScreen } from './screens/BoardScreen'
import { EndScreen } from './screens/EndScreen'
import { FixScreen } from './screens/FixScreen'
import { GameScreen } from './screens/GameScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { PauseScreen } from './screens/PauseScreen'
import { RulesScreen } from './screens/RulesScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { SetupScreen } from './screens/SetupScreen'
import { ShareScreen } from './screens/ShareScreen'
import { WhoStartsScreen } from './screens/WhoStartsScreen'

export default function App() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="screen-in">
      <Routes location={location}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/setup" element={<SetupScreen />} />
        <Route path="/starts" element={<WhoStartsScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/board" element={<BoardScreen />} />
        <Route path="/bag/:team" element={<BagScreen />} />
        <Route path="/pause" element={<PauseScreen />} />
        <Route path="/fix" element={<FixScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/rules" element={<RulesScreen />} />
        <Route path="/end" element={<EndScreen />} />
        <Route path="/share" element={<ShareScreen />} />
        <Route path="/ar" element={<ArScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
