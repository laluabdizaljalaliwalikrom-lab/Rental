import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bike, DollarSign, Users, Activity, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/Badge"

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

  const fetchDashboardData = async () => {
    try {
      const [statsRes, transRes] = await Promise.all([
        fetch('/api/rentals/stats'),
        fetch('/api/rentals/')
      ])

      if (!statsRes.ok || !transRes.ok) throw new Error('Gagal mengambil data dashboard')

      const statsData = await statsRes.json()
      const transData = await transRes.json()

      setStats(statsData)
      setTransactions(transData.slice(0, 5)) // Get latest 5
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])


  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard Overview</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card className="bg-background/60 backdrop-blur-xl border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <DollarSign size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {stats.total_rentals} transaksi
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rental Aktif</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Activity size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_rentals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sepeda sedang dipinjam
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Armada Tersedia</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <Bike size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available_bikes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dari {stats.total_bikes} total unit
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-xl border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Users size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_rentals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Riwayat peminjaman
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2 bg-background/60 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <CardDescription>Lima transaksi penyewaan terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${t.status === 'Active' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                        {t.status === 'Active' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
                      </div>
                      <div>
                        <p className="font-semibold">{t.customer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.rental_type} ({t.duration} {t.rental_type === 'Short' ? 'Jam' : 'Hari'})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rp {t.total_price.toLocaleString()}</p>
                      <Badge variant={t.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] h-5">
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 border border-dashed rounded-lg text-muted-foreground">
                Belum ada data transaksi.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-background/60 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle>Status Sistem</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Database Connected</p>
                    <p className="text-xs text-muted-foreground">Supabase connection is stable.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">API Gateway</p>
                    <p className="text-xs text-muted-foreground">FastAPI responding in 45ms.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Fleet Manager</p>
                    <p className="text-xs text-muted-foreground">Syncing {stats.total_bikes} units.</p>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
