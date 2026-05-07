import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Bike, Users, Settings, LogOut, CreditCard, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, hasRole } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin', 'staff', 'viewer'] },
    { name: 'Penyewaan', path: '/admin/rentals', icon: CreditCard, roles: ['admin', 'staff', 'viewer'] },
    { name: 'Buku Kas', path: '/admin/cashbook', icon: Wallet, roles: ['admin', 'staff', 'viewer'] },
    { name: 'Armada Sepeda', path: '/admin/fleet', icon: Bike, roles: ['admin', 'staff'] },
    { name: 'Pengguna', path: '/admin/users', icon: Users, roles: ['admin'] },
    { name: 'Pengaturan', path: '/admin/settings', icon: Settings, roles: ['admin'] },
  ]

  const visibleNavItems = navItems.filter((item) => hasRole(item.roles))

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bike size={18} />
            </div>
            <span className="">Rental Sepeda</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
                    isActive 
                      ? "bg-muted text-primary font-semibold" 
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <div className="mb-2 px-3 text-xs text-muted-foreground">
            {profile?.email}
            <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {profile?.role}
            </span>
          </div>
          <Button variant="outline" className="w-full flex justify-start gap-3" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
        {/* Header (Mobile) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="sm:hidden flex items-center gap-2 font-semibold">
             <Bike className="h-5 w-5 text-primary" />
             <span>Rental Sepeda</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 items-start p-4 sm:px-6 sm:py-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
