import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

// Pages
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/admin/Dashboard'
import Fleet from '@/pages/admin/Fleet'
import Rentals from '@/pages/admin/Rentals'
import Users from '@/pages/admin/Users'
import Settings from '@/pages/admin/Settings'

// Layouts & Guards
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <>
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
              <Route path="fleet" element={<Fleet />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>

      
      {/* Global Toaster for notifications */}
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
