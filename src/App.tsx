import { HashRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { Rankings } from './pages/Rankings'
import { PlayerDetail } from './pages/PlayerDetail'
import { Simulator } from './pages/Simulator'
import { AdminLogin } from './pages/admin/Login'
import { AdminGuard } from './components/admin/AdminGuard'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminPlayers } from './pages/admin/AdminPlayers'
import { AdminPlayerForm } from './pages/admin/AdminPlayerForm'
import { AdminMatches } from './pages/admin/AdminMatches'
import { AdminImport } from './pages/admin/AdminImport'
import { AdminEvaluation } from './pages/admin/AdminEvaluation'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="rankings" element={<Rankings />} />
            <Route path="joueurs/:id" element={<PlayerDetail />} />
            <Route path="simulateur" element={<Simulator />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={<AdminGuard />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="joueurs" element={<AdminPlayers />} />
                <Route path="joueurs/nouveau" element={<AdminPlayerForm />} />
                <Route path="joueurs/:id/modifier" element={<AdminPlayerForm />} />
                <Route path="matchs" element={<AdminMatches />} />
                <Route path="import" element={<AdminImport />} />
                <Route path="evaluation" element={<AdminEvaluation />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
