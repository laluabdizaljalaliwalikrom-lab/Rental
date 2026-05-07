import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart as PieChartIcon,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from "@/components/ui/Badge"
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'


export default function Reports() {
  const [period, setPeriod] = useState('monthly')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadReport = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const res = await apiFetch(`/api/financial/report?period=${period}&t=${Date.now()}`)
      setData(res)
    } catch (error) {
      toast.error("Gagal memuat laporan: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    
    const fetchInitial = async () => {
      try {
        const res = await apiFetch(`/api/financial/report?period=${period}&t=${Date.now()}`)
        if (active) {
          setData(res)
          setLoading(false)
        }
      } catch (error) {
        if (active) {
          toast.error("Gagal memuat laporan: " + error.message)
          setLoading(false)
        }
      }
    }

    fetchInitial()
    return () => { active = false }
  }, [period])

  if (loading && !data) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Menyiapkan laporan keuangan...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl">
        <p className="text-muted-foreground">Gagal memuat data laporan.</p>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    )
  }

  const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6']

  const pieData = [
    { name: 'Pendapatan', value: data?.summary.total_income || 0 },
    { name: 'Pengeluaran', value: data?.summary.total_expense || 0 },
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <BarChart3 size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h2>
            <p className="text-sm text-muted-foreground">Analisis mendalam arus kas dan performa bisnis.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background border border-white/10 rounded-lg p-1">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                className={`capitalize text-xs h-8 ${period === p ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''}`}
                onClick={() => {
                  setPeriod(p)
                  setLoading(true)
                }}
              >
                {p === 'daily' ? 'Hari Ini' : p === 'weekly' ? 'Minggu Ini' : p === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'}
              </Button>
            ))}
          </div>
          <Button variant="outline" className="flex items-center gap-2 border-white/10">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} className="text-green-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-white/40">Total Pendapatan</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-500">Rp {data?.summary.total_income.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 py-0">
                <ArrowUpRight size={10} className="mr-1" /> Arus Masuk
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={48} className="text-red-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-white/40">Total Pengeluaran</CardDescription>
            <CardTitle className="text-2xl font-bold text-red-500">Rp {data?.summary.total_expense.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 py-0">
                <ArrowDownRight size={10} className="mr-1" /> Arus Keluar
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={48} className="text-blue-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-white/40">Laba Bersih</CardDescription>
            <CardTitle className={`text-2xl font-bold ${data?.summary.net_profit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              Rp {data?.summary.net_profit.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
              Periode {period}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={48} className="text-purple-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-white/40">Saldo Kas Akhir</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-500">Rp {data?.summary.cash_on_hand.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              Dana Tersedia (Liquid)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Trend Chart */}
        <Card className="md:col-span-4 glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tren Arus Kas
            </CardTitle>
            <CardDescription>Grafik pendapatan vs pengeluaran harian.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] min-h-[300px] mt-4 overflow-hidden">
            {data?.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}}
                    tickFormatter={(str) => {
                      const d = new Date(str)
                      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}}
                    tickFormatter={(val) => `Rp ${val / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ marginBottom: '4px', color: '#71717a' }}
                  />
                  <Area type="monotone" dataKey="income" name="Pendapatan" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                Data tidak cukup untuk menampilkan grafik tren.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ratio Chart */}
        <Card className="md:col-span-3 glass-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Rasio Laba Rugi
            </CardTitle>
            <CardDescription>Persentase pendapatan terhadap biaya.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col items-center justify-center mt-4 overflow-hidden">
             {data?.summary.total_income > 0 || data?.summary.total_expense > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                     itemStyle={{ fontSize: '12px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                  Belum ada data.
                </div>
             )}
             <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Masuk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Keluar</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Investor Dividends Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Distribusi Laba & Dividen Investor
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" 
                  onClick={() => loadReport()}
                  title="Hitung Ulang"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </Button>
              </CardTitle>
              <CardDescription>Perhitungan bagi hasil berdasarkan kepemilikan armada sepeda.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Periode: {period}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Investor</th>
                  <th className="px-6 py-4 font-medium text-right">Omzet Kotor</th>
                  <th className="px-6 py-4 font-medium text-right text-red-400">Biaya Perawatan</th>
                  <th className="px-6 py-4 font-medium text-right text-orange-400">Gaji Staff</th>
                  <th className="px-6 py-4 font-medium text-right text-green-500 font-bold">Dividen Bersih</th>
                </tr>
              </thead>
              <tbody>
                {data?.investor_splits.length > 0 ? (
                  data.investor_splits.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 bg-background/40 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-semibold">{item.name}</td>
                      <td className="px-6 py-4 text-right">Rp {item.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-red-400/80">- Rp {item.maintenance.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-orange-400/80">- Rp {item.staff_salary.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-500">
                        Rp {item.dividend.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-muted-foreground italic">
                      Tidak ada data penyewaan untuk periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
              {data?.investor_splits.length > 0 && (
                <tfoot className="bg-white/5 font-bold">
                  <tr>
                    <td className="px-6 py-4">TOTAL</td>
                    <td className="px-6 py-4 text-right">Rp {data.summary.total_income.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-red-400">- Rp {data.summary.total_maintenance_fee.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-orange-400">- Rp {data.summary.total_staff_salary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-green-500">Rp {data.summary.total_investor_dividend.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Revenue Sources */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Transaksi Terbesar (Top Revenue)</CardTitle>
          <CardDescription>Daftar pendapatan dengan nominal tertinggi di periode ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Deskripsi</th>
                  <th className="px-6 py-4 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {data?.top_revenue_sources.length > 0 ? (
                  data.top_revenue_sources.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 bg-background/40 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 font-medium">{item.description}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-500">
                        Rp {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-10 text-center text-muted-foreground italic">
                      Tidak ada data transaksi pendapatan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
