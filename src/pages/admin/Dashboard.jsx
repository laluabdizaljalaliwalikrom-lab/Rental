import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bike, DollarSign, Users, Activity, Clock, CheckCircle2, Loader2, Zap, ArrowUpRight, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/Badge"
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_revenue: 0,
    active_rentals: 0,
    total_rentals: 0,
    available_bikes: 0,
    total_bikes: 0
  })
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, transData] = await Promise.all([
          apiFetch('/api/rentals/stats'),
          apiFetch('/api/rentals/')
        ])

        setStats(statsData)
        setTransactions(transData.slice(0, 5))
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])


  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-8 sm:p-10">
        <div className="absolute top-0 right-0 p-8 opacity-20 hidden md:block">
           <Zap size={120} className="text-white animate-pulse" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 hover:bg-white/20">System Live</Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Hello, Control Center.
          </h1>
          <p className="text-lg text-white/50 leading-relaxed">
            Sistem rental sepeda beroperasi secara optimal. Periksa statistik terbaru dan kelola armada Anda dengan efisiensi maksimal hari ini.
          </p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white/40">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <DollarSign size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">Rp {stats.total_revenue.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-green-500">
              <ArrowUpRight size={14} />
              <span>{stats.total_rentals} Transaksi Berhasil</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white/40">Active Rentals</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Activity size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.active_rentals}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-500">
              <Clock size={14} />
              <span>Sedang Dipinjam</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white/40">Available Fleet</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Bike size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.available_bikes}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-500">
              <CheckCircle2 size={14} />
              <span>Unit Siap Jalan</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-white/40">Total Customers</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total_rentals}</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-500">
              <Users size={14} />
              <span>Riwayat Pelanggan</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detail Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 glass-card border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-xl font-bold text-white">Recent Transactions</CardTitle>
            <CardDescription className="text-white/40">Lima aktivitas penyewaan terbaru.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t.id} className="group flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${t.status === 'Active' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                        {t.status === 'Active' ? <Clock size={22} /> : <CheckCircle2 size={22} />}
                      </div>
                      <div>
                        <p className="font-bold text-white">{t.customer_name}</p>
                        <p className="text-xs text-white/40 font-medium">
                          {t.rental_type} &bull; {t.duration} {t.rental_type === 'Short' ? 'Jam' : 'Hari'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-lg">Rp {t.total_price.toLocaleString()}</p>
                      <Badge variant={t.status === 'Active' ? 'default' : 'secondary'} className={cn(
                        "text-[10px] uppercase tracking-wider font-bold h-6",
                        t.status === 'Active' ? "bg-blue-500 text-white" : "bg-white/10 text-white/60"
                      )}>
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/5 rounded-3xl text-white/30 space-y-2">
                <Activity size={32} />
                <p className="text-sm italic">Belum ada data transaksi yang tersedia.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="glass-card border-white/5">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-xl font-bold text-white">System Pulse</CardTitle>
            <CardDescription className="text-white/40">Status integrasi real-time.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
             <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shadow-inner">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">Cloud Infrastructure</p>
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">Supabase database cluster is active and healthy.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
                    <Activity size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">API Gateway</p>
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">FastAPI server responding in optimized latency.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-inner">
                    <Users size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">Security Layer</p>
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">JWT authentication & RLS policy active.</p>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
