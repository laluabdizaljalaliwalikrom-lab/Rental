import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Bike,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Loader2,
  Box,
  Package

} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/Badge'
import { apiFetch } from '@/lib/api'
import { cn } from "@/lib/utils"
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function Investors() {
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isFleetOpen, setIsFleetOpen] = useState(false)
  const [isClaimOpen, setIsClaimOpen] = useState(false)
  const [selectedInvestor, setSelectedInvestor] = useState(null)
  const [investorFleet, setInvestorFleet] = useState([])
  const [investorAddons, setInvestorAddons] = useState([])
  const [availableFleet, setAvailableFleet] = useState([])
  const [availableAddons, setAvailableAddons] = useState([])
  const [claiming, setClaiming] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' })
  const { profile: currentUser } = useAuth()

  const loadInvestors = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/api/investors/')
      setInvestors(data)
    } catch (error) {
      toast.error("Gagal memuat data investor: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Inline fetch prevents React Compiler from falsely detecting synchronous state updates
    apiFetch('/api/investors/')
      .then(data => setInvestors(data))
      .catch(error => toast.error("Gagal memuat data investor: " + error.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = isEditOpen ? 'PUT' : 'POST'
      const url = isEditOpen ? `/api/investors/${selectedInvestor.id}/` : '/api/investors/'

      await apiFetch(url, {
        method,
        body: JSON.stringify(formData)
      })

      toast.success(isEditOpen ? "Investor diperbarui" : "Investor ditambahkan")
      setIsAddOpen(false)
      setIsEditOpen(false)
      loadInvestors()
      setFormData({ name: '', email: '', phone: '', address: '' })
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus investor ini?")) return
    try {
      await apiFetch(`/api/investors/${id}/`, { method: 'DELETE' })
      toast.success("Investor dihapus")
      loadInvestors()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const openFleetModal = async (investor) => {
    setSelectedInvestor(investor)
    setIsFleetOpen(true)
    try {
      const fleet = await apiFetch(`/api/investors/${investor.id}/fleet/`)
      setInvestorFleet(fleet)
      const allAddons = await apiFetch('/api/addons/')
      setInvestorAddons(allAddons.filter(a => a.investor_id === investor.id))
    } catch (error) {
      toast.error("Gagal memuat aset investor: " + error.message)
    }
  }

  const openClaimModal = async () => {
    try {
      const [allFleet, allAddons] = await Promise.all([
        apiFetch('/api/fleet/'),
        apiFetch('/api/addons/')
      ])
      setAvailableFleet(allFleet.filter(bike => !bike.investor_id || bike.investor_name === 'Pusat'))
      setAvailableAddons(allAddons.filter(addon => !addon.investor_id || addon.investor_name === 'Pusat'))
      setIsClaimOpen(true)
    } catch (error) {
      toast.error("Gagal memuat aset tersedia: " + error.message)
    }
  }

  const handleClaim = async (item, type = 'bike') => {
    try {
      setClaiming(true)
      const url = type === 'bike' ? `/api/fleet/${item.id}` : `/api/addons/${item.id}`
      await apiFetch(url, {
        method: type === 'bike' ? 'PUT' : 'PATCH',
        body: JSON.stringify({
          investor_id: selectedInvestor.id,
          investor_name: selectedInvestor.name
        })
      })
      toast.success(`${item.name} berhasil diklaim`)

      if (type === 'bike') {
        const updated = await apiFetch(`/api/investors/${selectedInvestor.id}/fleet/`)
        setInvestorFleet(updated)
        setAvailableFleet(prev => prev.filter(b => b.id !== item.id))
      } else {
        const all = await apiFetch('/api/addons/')
        setInvestorAddons(all.filter(a => a.investor_id === selectedInvestor.id))
        setAvailableAddons(prev => prev.filter(a => a.id !== item.id))
      }
    } catch (error) {
      toast.error("Gagal mengklaim aset: " + error.message)
    } finally {
      setClaiming(false)
    }
  }

  const handleUnclaim = async (item, type = 'bike') => {
    if (!confirm(`Lepaskan ${item.name} dari investor ini?`)) return
    try {
      setClaiming(true)
      const url = type === 'bike' ? `/api/fleet/${item.id}` : `/api/addons/${item.id}`
      await apiFetch(url, {
        method: type === 'bike' ? 'PUT' : 'PATCH',
        body: JSON.stringify({
          investor_id: null,
          investor_name: 'Pusat'
        })
      })
      toast.success(`${item.name} dilepaskan ke Pusat`)

      if (type === 'bike') {
        const updated = await apiFetch(`/api/investors/${selectedInvestor.id}/fleet/`)
        setInvestorFleet(updated)
      } else {
        const all = await apiFetch('/api/addons/')
        setInvestorAddons(all.filter(a => a.investor_id === selectedInvestor.id))
      }
    } catch (error) {
      toast.error("Gagal melepaskan aset: " + error.message)
    } finally {
      setClaiming(false)
    }
  }

  const filteredInvestors = investors.filter(inv =>
    inv.name.toLowerCase().includes(search.toLowerCase()) ||
    inv.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary border border-primary/20">
            <Users size={28} strokeWidth={2.5} />
          </div>
            <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Kepemilikan Aset</h2>
            <p className="text-sm text-muted-foreground">Kelola kepemilikan armada dan aksesoris investor.</p>
          </div>
        </div>
        <Button onClick={() => { setFormData({ name: '', email: '', phone: '', address: '' }); setIsAddOpen(true) }} className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all uppercase tracking-wider text-[10px] px-6">
          <Plus size={18} className="mr-2" />
          Tambah Investor
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 h-5 w-5 group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Cari nama atau email investor..."
          className="h-14 pl-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/40 rounded-2xl focus:ring-primary/50 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-[250px] rounded-3xl bg-white/5 animate-pulse border border-white/5" />
          ))
        ) : filteredInvestors.map((investor) => (
          <Card key={investor.id} className="glass-card overflow-hidden group border-border hover:border-primary/20 transition-all duration-500">
            <CardHeader className="pb-4 flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-xl font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">{investor.name}</CardTitle>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <Mail size={12} className="text-muted-foreground/40" /> {investor.email || '-'}
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all" onClick={() => { setSelectedInvestor(investor); setFormData(investor); setIsEditOpen(true) }}>
                  <Edit2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all" onClick={() => handleDelete(investor.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
                  <Phone size={14} className="text-muted-foreground/40" /> {investor.phone || '-'}
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground truncate">
                  <MapPin size={14} className="text-muted-foreground/40" /> {investor.address || '-'}
                </div>
                <Button
                  variant="ghost"
                  className="w-full h-12 mt-2 rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted font-semibold transition-all flex items-center justify-between group/btn px-4"
                  onClick={() => openFleetModal(investor)}
                >
                  <div className="flex items-center gap-2 uppercase tracking-wider text-[9px]">
                    <Package size={16} className="text-primary" />
                    <span>Manajemen Kepemilikan Aset</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/30 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(val) => { setIsAddOpen(val); setIsEditOpen(val); }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {isEditOpen ? <Edit2 size={24} /> : <Plus size={24} />}
              </div>
              {isEditOpen ? 'Edit Detail Investor' : 'Tambah Investor Baru'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Masukkan detail informasi mitra investor Anda di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Nama Lengkap Mitra *</Label>
                <Input
                  id="name"
                  required
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/50 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Alamat Korespondensi (Email)</Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/50 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="budi@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Nomor WhatsApp Aktif</Label>
                <Input
                  id="phone"
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/50 transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0812xxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Alamat Domisili</Label>
                <Input
                  id="address"
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/50 transition-all"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Merdeka No. 10"
                />
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/50 border-t border-border">
              <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 font-semibold uppercase tracking-wider shadow-xl transition-all text-xs">
                {isEditOpen ? 'Simpan Perubahan' : 'Daftarkan Investor Baru'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFleetOpen} onOpenChange={setIsFleetOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="flex items-center gap-3 text-2xl font-semibold">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Package size={24} />
              </div>
              Aset Investor: {selectedInvestor?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Daftar kepemilikan aset armada dan aksesoris mitra ini.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Armada Sepeda</h4>
                {currentUser?.role === 'admin' && (
                  <Button size="sm" variant="ghost" className="h-8 px-3 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 font-bold text-[9px] uppercase tracking-wider transition-all" onClick={openClaimModal}>
                    Klaim Aset
                  </Button>
                )}
              </div>
              
              <div className="grid gap-2">
                {investorFleet.map((bike) => (
                  <div key={bike.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground/30">
                        <Bike size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{bike.name}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-medium">{bike.type}</p>
                      </div>
                    </div>
                    {currentUser?.role === 'admin' && (
                      <button onClick={() => handleUnclaim(bike, 'bike')} className="p-2 text-muted-foreground/30 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {investorFleet.length === 0 && <p className="text-[10px] text-muted-foreground italic p-4 border border-dashed rounded-xl text-center">Belum ada sepeda.</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Aksesoris & Add-on</h4>
              <div className="grid gap-2">
                {investorAddons.map((addon) => (
                  <div key={addon.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground/30">
                        <Box size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{addon.name}</p>
                        <p className="text-[9px] text-primary font-black">Rp {addon.price.toLocaleString()}</p>
                      </div>
                    </div>
                    {currentUser?.role === 'admin' && (
                      <button onClick={() => handleUnclaim(addon, 'addon')} className="p-2 text-muted-foreground/30 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {investorAddons.length === 0 && <p className="text-[10px] text-muted-foreground italic p-4 border border-dashed rounded-xl text-center">Belum ada aksesoris.</p>}
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/50 border-t border-border">
            <Button variant="ghost" className="w-full h-12 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-semibold uppercase tracking-wider text-[10px]" onClick={() => setIsFleetOpen(false)}>Tutup Jendela</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Plus size={24} />
              </div>
              Klaim Aset Baru
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Daftar aset milik <strong className="text-primary font-semibold">Pusat</strong> yang dapat dialihkan ke mitra.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            <div className="space-y-3">
               <h5 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Armada Tersedia</h5>
               {availableFleet.map(bike => (
                  <div key={bike.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                    <p className="text-xs font-bold">{bike.name}</p>
                    <Button size="sm" className="h-8 rounded-lg text-[9px] uppercase font-bold" onClick={() => handleClaim(bike, 'bike')} disabled={claiming}>Klaim</Button>
                  </div>
               ))}
               {availableFleet.length === 0 && <p className="text-[9px] text-muted-foreground italic text-center py-2">Semua armada sudah memiliki pemilik.</p>}
            </div>

            <div className="space-y-3">
               <h5 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Aksesoris Tersedia</h5>
               {availableAddons.map(addon => (
                  <div key={addon.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                    <p className="text-xs font-bold">{addon.name}</p>
                    <Button size="sm" className="h-8 rounded-lg text-[9px] uppercase font-bold" onClick={() => handleClaim(addon, 'addon')} disabled={claiming}>Klaim</Button>
                  </div>
               ))}
               {availableAddons.length === 0 && <p className="text-[9px] text-muted-foreground italic text-center py-2">Semua aksesoris sudah memiliki pemilik.</p>}
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/50 border-t border-border">
            <Button variant="ghost" className="w-full h-12 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground font-semibold uppercase tracking-wider text-[10px]" onClick={() => setIsClaimOpen(false)}>Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
