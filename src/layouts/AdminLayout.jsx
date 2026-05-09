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
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils'
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

const NavLinks = ({ items, activePath, isCollapsed, onItemClick = () => {} }) => (
  <nav className={cn("grid items-start px-2 text-sm font-medium gap-1", !isCollapsed && "lg:px-4")}>
    {items.map((item) => {
      const Icon = item.icon
      const isActive = activePath === item.path
      return (
        <Link
          key={item.name}
          to={item.path}
          onClick={onItemClick}
          className={cn(
            "group flex items-center rounded-xl px-3 py-2.5 transition-all duration-300 relative overflow-hidden",
            isCollapsed ? "justify-center" : "gap-3",
            isActive 
              ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(var(--primary),0.15)]" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {isActive && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          )}
          <Icon className={cn(
            "h-4 w-4 transition-transform duration-300 group-hover:scale-110 shrink-0",
            isActive ? "text-primary-foreground" : "text-muted-foreground"
          )} />
          {!isCollapsed && <span className="flex-1 font-medium truncate">{item.name}</span>}
          {isActive && !isCollapsed && <ChevronRight className="h-3 w-3 opacity-50" />}
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Poll for notifications (Simple implementation)
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const [rentals, cash] = await Promise.all([
          apiFetch('/api/rentals/'),
          apiFetch('/api/cashbook/')
        ])
        
        const newNotifs = []
        
        // Take latest 3 rentals
        rentals.slice(0, 3).forEach(r => {
          newNotifs.push({
            id: `r-${r.id}`,
            title: 'Penyewaan Baru',
            desc: `${r.customer_name} menyewa ${r.bike_id.split('-')[0]}...`,
            time: r.start_time,
            type: 'rental'
          })
        })

        // Take latest 3 cash activities
        cash.slice(0, 3).forEach(c => {
          newNotifs.push({
            id: `c-${c.id}`,
            title: c.type === 'debit' ? 'Pemasukan Baru' : 'Pengeluaran Baru',
            desc: c.description,
            time: c.created_at,
            type: 'cash'
          })
        })

        setNotifications(newNotifs.sort((a, b) => new Date(b.time) - new Date(a.time)))
      } catch (e) { console.error(e) }
    }

    fetchActivities()
    const interval = setInterval(fetchActivities, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

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
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 hidden flex-col glass border-r border-border/50 sm:flex transition-all duration-500 ease-in-out",
        isCollapsed ? "w-20" : "w-72"
      )}>
        {/* Collapse Toggle Button - Floating on Edge */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 z-50 h-6 w-6 rounded-full bg-primary text-primary-foreground shadow-xl border border-background flex items-center justify-center hover:scale-110 transition-all"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div className={cn("flex h-20 items-center border-b border-border/10", isCollapsed ? "justify-center" : "px-6")}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:rotate-12 shrink-0">
              <Bike size={22} strokeWidth={2.5} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tighter text-foreground">Rental<span className="text-primary">Pro</span></span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-semibold">Enterprise Edition</span>
              </div>
            )}
          </Link>
        </div>
        
        <div className="flex-1 overflow-auto py-6 custom-scrollbar">
          <div className={cn("mb-4", isCollapsed ? "px-2" : "px-6")}>
             {!isCollapsed && <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-4 px-2">Navigation</p>}
             <NavLinks items={visibleNavItems} activePath={location.pathname} isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* User Profile in Sidebar */}
        <div className={cn("p-4 mb-6 rounded-3xl bg-primary/5 border border-primary/10 transition-all", isCollapsed ? "mx-2" : "mx-4")}>
          <div className={cn("flex items-center gap-3", !isCollapsed && "mb-4")}>
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold shadow-lg shrink-0">
              {profile?.email?.[0].toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-foreground truncate uppercase tracking-tight">{profile?.email?.split('@')[0]}</span>
                <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider opacity-50">{profile?.role}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Sign Out</span>
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-col w-full min-h-screen transition-all duration-500 ease-in-out",
        isCollapsed ? "sm:pl-20" : "sm:pl-72"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center gap-4 px-4 sm:px-8 bg-background/60 backdrop-blur-2xl border-b border-border/50">
          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="sm:hidden text-foreground hover:bg-accent rounded-xl"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetContent side="left" className="glass border-border p-0 w-80 text-foreground flex flex-col">
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
               <div className="py-6 flex-1 overflow-auto custom-scrollbar">
                  <NavLinks 
                    items={visibleNavItems} 
                    activePath={location.pathname} 
                    isCollapsed={false}
                    onItemClick={() => setIsMobileMenuOpen(false)} 
                  />
               </div>
               {/* Mobile Sidebar Footer */}
               <div className="p-4 border-t border-border/50">
                  <div className="flex items-center gap-3 mb-4 px-2">
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
                    className="w-full justify-start gap-3 h-12 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all" 
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Sign Out</span>
                  </Button>
               </div>
            </SheetContent>
          </Sheet>

          {/* Search Bar - Aesthetic Only for now */}
          <div className="hidden sm:flex items-center flex-1 max-w-md relative group">
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search analytics, rentals, users..." 
              className="w-full bg-muted/30 border border-border/50 rounded-2xl py-2.5 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
            />
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10 hidden lg:flex">
               <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-bold text-primary/80 uppercase tracking-tight">System Live</span>
            </div>
            <ThemeToggle />
            
            {/* Notification Dropdown */}
            <Popover open={isNotifOpen} onOpenChange={setIsNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 glass border-border shadow-2xl rounded-2xl overflow-hidden mt-2" align="end">
                <div className="p-4 border-b border-border/50 bg-primary/5">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center justify-between">
                    Notifikasi Terkini
                    <Badge variant="outline" className="text-[9px] h-4">{notifications.length}</Badge>
                  </h3>
                </div>
                <div className="max-h-[400px] overflow-auto custom-scrollbar divide-y divide-border/50">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div key={notif.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                            notif.type === 'rental' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                          )}>
                            {notif.type === 'rental' ? <CreditCard size={14} /> : <Wallet size={14} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs font-bold group-hover:text-primary transition-colors">{notif.title}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{notif.desc}</p>
                            <p className="text-[8px] text-muted-foreground/40 font-bold uppercase">
                              {new Date(notif.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground italic text-xs">
                      Tidak ada aktivitas baru
                    </div>
                  )}
                </div>
                <div className="p-3 bg-muted/30 border-t border-border/50 text-center">
                  <button className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline">Lihat Semua Aktivitas</button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-10 w-px bg-border/50 mx-2 hidden sm:block" />
            <div className="hidden sm:flex flex-col items-end">
               <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">{profile?.email?.split('@')[0]}</span>
               <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold opacity-60">ADMINISTRATOR</span>
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
