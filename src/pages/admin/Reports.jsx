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
import { cn } from "@/lib/utils"
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
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary border border-primary/20">
            <BarChart3 size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Laporan Keuangan</h2>
            <p className="text-sm text-muted-foreground">Analisis mendalam arus kas dan performa bisnis Anda.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-muted border border-border rounded-xl p-1 gap-1">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                className={cn(
                  "capitalize text-[10px] h-8 px-4 rounded-lg font-black uppercase tracking-widest transition-all",
                  period === p ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => {
                  setPeriod(p)
                  setLoading(true)
                }}
              >
                {p === 'daily' ? 'Hari Ini' : p === 'weekly' ? 'Minggu' : p === 'monthly' ? 'Bulan' : 'Tahun'}
              </button>
            ))}
          </div>
          <Button variant="ghost" className="h-10 rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted font-bold px-4 transition-all">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card relative overflow-hidden group border-border hover:border-primary/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} strokeWidth={1.5} className="text-foreground" />
          </div>
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Pendapatan</p>
            <CardTitle className="text-2xl font-bold text-green-500 tracking-tighter">Rp {data?.summary.total_income.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-400 border-none px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                <ArrowUpRight size={10} className="mr-1" /> Arus Masuk
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group border-border hover:border-primary/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown size={80} strokeWidth={1.5} className="text-foreground" />
          </div>
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Total Pengeluaran</p>
            <CardTitle className="text-2xl font-bold text-red-500 tracking-tighter">Rp {data?.summary.total_expense.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500/10 text-red-400 border-none px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                <ArrowDownRight size={10} className="mr-1" /> Arus Keluar
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} strokeWidth={1.5} className="text-white" />
          </div>
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Laba Bersih</p>
            <CardTitle className={cn(
              "text-2xl font-bold tracking-tighter",
              data?.summary.net_profit >= 0 ? 'text-blue-400' : 'text-red-400'
            )}>
              Rp {data?.summary.net_profit.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Periode {period}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} strokeWidth={1.5} className="text-white" />
          </div>
          <CardHeader className="pb-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Saldo Kas Akhir</p>
            <CardTitle className="text-2xl font-bold text-purple-400 tracking-tighter">Rp {data?.summary.cash_on_hand.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Dana Liquid Tersedia
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Trend Chart */}
        <Card className="md:col-span-4 glass-card overflow-hidden border-border">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Tren Arus Kas
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-xs">Visualisasi pendapatan vs pengeluaran harian.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full mt-4 min-w-0 min-h-0">
              {data?.trends.length > 0 ? (
                <ResponsiveContainer width="99%" height="100%">
                  <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700}}
                      tickFormatter={(str) => {
                        const d = new Date(str)
                        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                      }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700}}
                      tickFormatter={(val) => `Rp ${val / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '16px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      labelStyle={{ marginBottom: '8px', color: 'hsl(var(--muted-foreground))', fontSize: '10px', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="income" name="Pendapatan" stroke="#4ade80" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                    <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#f87171" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                  <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Data tidak cukup untuk grafik tren</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ratio Chart */}
        <Card className="md:col-span-3 glass-card overflow-hidden border-border">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-500" />
              Rasio Laba Rugi
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-xs">Proporsi pendapatan vs pengeluaran.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center">
            <div className="h-[280px] w-full min-w-0 min-h-0">
               {data?.summary.total_income > 0 || data?.summary.total_expense > 0 ? (
                 <ResponsiveContainer width="99%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={70}
                       outerRadius={90}
                       paddingAngle={8}
                       dataKey="value"
                       stroke="none"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       contentStyle={{ backgroundColor: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                       itemStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                  <div className="flex h-full items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02] w-full">
                    <p className="text-white/20 text-xs font-bold uppercase tracking-widest text-center px-6">Belum ada data distribusi</p>
                  </div>
               )}
            </div>
            <div className="flex gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#f43f5e] shadow-[0_0_8px_#f43f5e]" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Expense</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investor Dividends Table */}
      <Card className="glass-card border-white/5 overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                Distribusi Laba & Dividen
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-inner" 
                  onClick={() => loadReport()}
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </Button>
              </CardTitle>
              <CardDescription className="text-white/40 font-medium mt-1 text-xs">Perhitungan bagi hasil berdasarkan kepemilikan armada.</CardDescription>
            </div>
            <Badge className="bg-blue-500/10 text-blue-400 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest h-fit">
              PERIODE: {period}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white/[0.02] border-y border-white/5">
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30">Investor</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30 text-right">Omzet Kotor</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30 text-right">Biaya Perawatan</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30 text-right">Gaji Staff</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30 text-right">Dividen Bersih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.investor_splits.length > 0 ? (
                  data.investor_splits.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-5 font-bold text-white tracking-tight">{item.name}</td>
                      <td className="px-6 py-5 text-right font-medium text-white/70">Rp {item.revenue.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right text-red-400/60 font-medium">- Rp {item.maintenance.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right text-orange-400/60 font-medium">- Rp {item.staff_salary.toLocaleString()}</td>
                      <td className="px-6 py-5 text-right font-black text-green-400 text-base tracking-tighter">
                        Rp {item.dividend.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <p className="text-white/20 text-xs font-bold uppercase tracking-widest italic">Tidak ada data penyewaan periode ini</p>
                    </td>
                  </tr>
                )}
              </tbody>
              {data?.investor_splits.length > 0 && (
                <tfoot className="bg-white/[0.04] border-t border-white/10">
                  <tr className="font-black text-[10px] uppercase tracking-[0.2em]">
                    <td className="px-6 py-6 text-white">TOTAL DISTRIBUSI</td>
                    <td className="px-6 py-6 text-right text-white/50 font-bold">Rp {data.summary.total_income.toLocaleString()}</td>
                    <td className="px-6 py-6 text-right text-red-400/40 font-bold">- Rp {data.summary.total_maintenance_fee.toLocaleString()}</td>
                    <td className="px-6 py-6 text-right text-orange-400/40 font-bold">- Rp {data.summary.total_staff_salary.toLocaleString()}</td>
                    <td className="px-6 py-6 text-right text-green-400 text-lg tracking-tighter">Rp {data.summary.total_investor_dividend.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Revenue Sources */}
      <Card className="glass-card border-white/5 overflow-hidden">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-bold text-white">Transaksi Terbesar (Top Revenue)</CardTitle>
          <CardDescription className="text-white/40 font-medium mt-1 text-xs">Daftar pendapatan dengan nominal tertinggi di periode ini.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white/[0.02] border-y border-white/5">
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30">Tanggal</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30">Deskripsi Transaksi</th>
                  <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.top_revenue_sources.length > 0 ? (
                  data.top_revenue_sources.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-5 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white/40">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 font-bold text-white tracking-tight">{item.description}</td>
                      <td className="px-6 py-5 text-right font-black text-green-400 text-base tracking-tighter">
                        Rp {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-16 text-center">
                      <p className="text-white/20 text-xs font-bold uppercase tracking-widest italic">Tidak ada transaksi pendapatan besar</p>
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
