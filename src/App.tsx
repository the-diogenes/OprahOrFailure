import { RaceProvider, useRace } from './context/RaceContext'
import LandingPage from './components/LandingPage'
import RaceSetup from './components/RaceSetup'
import RaceDashboard from './components/RaceDashboard'
import ResultsPage from './components/ResultsPage'

function AppContent() {
  const { screen } = useRace()
  return (
    <>
      {screen === 'landing' && <LandingPage />}
      {screen === 'setup' && <RaceSetup />}
      {screen === 'race' && <RaceDashboard />}
      {screen === 'results' && <ResultsPage />}
    </>
  )
}

export default function App() {
  return (
    <RaceProvider>
      <AppContent />
    </RaceProvider>
  )
}
