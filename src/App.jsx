import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/hooks/useAuth'

// Pages
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/admin/Dashboard'
import Fleet from '@/pages/admin/Fleet'
import Rentals from '@/pages/admin/Rentals'
import Users from '@/pages/admin/Users'
import Settings from '@/pages/admin/Settings'
import Cashbook from '@/pages/admin/Cashbook'

// Layouts & Guards
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="rentals" element={<Rentals />} />
              <Route path="cashbook" element={<Cashbook />} />
              <Route path="fleet" element={<ProtectedRoute roles={['admin', 'staff']}><Fleet /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute roles={['admin']}><Settings /></ProtectedRoute>} />
            </Route>
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>

      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}

export default App
