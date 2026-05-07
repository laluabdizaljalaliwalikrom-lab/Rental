import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Bike, 
  Users, 
  Settings, 
  LogOut, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  User,
  Menu,
  Bell,
  Search,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from '@/components/ui/sheet'
import { useState } from 'react'

const NavLinks = ({ items, activePath, onItemClick = () => {} }) => (
  <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
    {items.map((item) => {
      const Icon = item.icon
      const isActive = activePath === item.path
      return (
        <Link
          key={item.name}
          to={item.path}
          onClick={onItemClick}
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 relative overflow-hidden",
            isActive 
              ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10" 
              : "text-muted-foreground hover:text-white hover:bg-white/5"
          )}
        >
          {isActive && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          )}
          <Icon className={cn(
            "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
            isActive ? "text-white" : "text-muted-foreground"
          )} />
          <span className="flex-1">{item.name}</span>
          {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
        </Link>
      )
    })}
  </nav>
)

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, hasRole } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['admin', 'staff', 'viewer'] },
    { name: 'Penyewaan', path: '/admin/rentals', icon: CreditCard, roles: ['admin', 'staff', 'viewer'] },
    { name: 'Buku Kas', path: '/admin/cashbook', icon: Wallet, roles: ['admin', 'staff', 'viewer'] },
    { name: 'Laporan Kas', path: '/admin/reports', icon: BarChart3, roles: ['admin'] },
    { name: 'Investor', path: '/admin/investors', icon: Users, roles: ['admin'] },
    { name: 'Armada Sepeda', path: '/admin/fleet', icon: Bike, roles: ['admin', 'staff'] },
    { name: 'Pengguna', path: '/admin/users', icon: Users, roles: ['admin'] },
    { name: 'Pengaturan', path: '/admin/settings', icon: Settings, roles: ['admin'] },
    { name: 'Profil', path: '/admin/profile', icon: User, roles: ['admin', 'staff', 'viewer'] },
  ]

  const visibleNavItems = navItems.filter((item) => hasRole(item.roles))

  return (
    <div className="flex min-h-screen w-full mesh-gradient text-foreground selection:bg-white/20">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col glass border-r-0 sm:flex m-4 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex h-20 items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform group-hover:rotate-12">
              <Bike size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">Rental<span className="text-white/60">Pro</span></span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Enterprise</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-auto py-6">
          <div className="px-6 mb-4">
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Navigation</p>
             <NavLinks items={visibleNavItems} activePath={location.pathname} />
          </div>
        </div>

        {/* User Profile in Sidebar */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              {profile?.email?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate">{profile?.email?.split('@')[0]}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{profile?.role}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-10 text-white/60 hover:text-white hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs font-semibold">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col sm:pl-80 w-full min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 px-4 sm:px-8 bg-transparent">
          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden text-white hover:bg-white/10 rounded-xl">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass border-white/10 p-0 w-80 text-white">
               <div className="flex h-20 items-center px-6 border-b border-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black">
                    <Bike size={22} strokeWidth={2.5} />
                  </div>
                  <span className="ml-3 text-lg font-bold">RentalPro</span>
               </div>
               <div className="py-6">
                  <NavLinks 
                    items={visibleNavItems} 
                    activePath={location.pathname} 
                    onItemClick={() => setIsMobileMenuOpen(false)} 
                  />
               </div>
            </SheetContent>
          </Sheet>

          {/* Search Bar - Aesthetic Only for now */}
          <div className="hidden sm:flex items-center flex-1 max-w-md relative group">
            <Search className="absolute left-4 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/[0.08] transition-all"
            />
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl relative">
               <Bell className="h-5 w-5" />
               <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full border-2 border-background" />
            </Button>
            <div className="h-10 w-px bg-white/10 mx-2 hidden sm:block" />
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-sm font-bold text-white">Welcome back</span>
               <span className="text-[10px] text-white/40 uppercase tracking-widest">Active System</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 pt-2">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
