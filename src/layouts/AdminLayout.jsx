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
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

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
              ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(var(--primary),0.15)]" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {isActive && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          )}
          <Icon className={cn(
            "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
            isActive ? "text-primary-foreground" : "text-muted-foreground"
          )} />
          <span className="flex-1 font-medium">{item.name}</span>
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
    <div className="flex min-h-screen w-full mesh-gradient text-foreground selection:bg-primary/20">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col glass border-r-0 sm:flex m-4 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex h-20 items-center px-6 border-b border-border/10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:rotate-12">
              <Bike size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tighter text-foreground">Rental<span className="text-primary">Pro</span></span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-semibold">Enterprise Edition</span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-auto py-6">
          <div className="px-6 mb-4">
             <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-4">Navigation</p>
             <NavLinks items={visibleNavItems} activePath={location.pathname} />
          </div>
        </div>

        {/* User Profile in Sidebar */}
        <div className="p-4 mx-4 mb-6 rounded-3xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold shadow-lg">
              {profile?.email?.[0].toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-foreground truncate uppercase tracking-tight">{profile?.email?.split('@')[0]}</span>
              <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider opacity-50">{profile?.role}</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col sm:pl-80 w-full min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 px-4 sm:px-8 bg-background/80 backdrop-blur-xl border-b border-border/50">
          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden text-foreground hover:bg-accent rounded-xl">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass border-border p-0 w-80 text-foreground">
               <SheetHeader className="p-6 border-b border-border/50 space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                      <Bike size={22} strokeWidth={2.5} />
                    </div>
                    <SheetTitle className="text-lg font-bold text-foreground">RentalPro</SheetTitle>
                  </div>
                  <SheetDescription className="sr-only">
                    Menu navigasi utama untuk manajemen rental sepeda.
                  </SheetDescription>
               </SheetHeader>
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
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="w-full bg-muted/40 border border-border rounded-2xl py-2.5 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted transition-all"
            />
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl relative">
               <Bell className="h-5 w-5" />
               <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full border-2 border-background" />
            </Button>
            <div className="h-10 w-px bg-border mx-2 hidden sm:block" />
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-sm font-semibold text-foreground">Welcome back</span>
               <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Active System</span>
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
