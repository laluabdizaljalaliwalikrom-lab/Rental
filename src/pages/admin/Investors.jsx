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
  Loader2
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
  const [availableFleet, setAvailableFleet] = useState([])
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
    let isMounted = true

    const fetchInitialData = async () => {
      try {
        const data = await apiFetch('/api/investors/')
        if (isMounted) {
          setInvestors(data)
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          toast.error("Gagal memuat data investor: " + error.message)
          setLoading(false)
        }
      }
    }

    fetchInitialData()

    return () => {
      isMounted = false
    }
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
      const data = await apiFetch(`/api/investors/${investor.id}/fleet/`)
      setInvestorFleet(data)
    } catch (error) {
      toast.error("Gagal memuat armada investor: " + error.message)
    }
  }

  const openClaimModal = async () => {
    try {
      const allFleet = await apiFetch('/api/fleet/')
      // Filter sepeda yang belum punya investor atau masih milik Pusat
      const available = allFleet.filter(bike => !bike.investor_id || bike.investor_name === 'Pusat')
      setAvailableFleet(available)
      setIsClaimOpen(true)
    } catch (error) {
      toast.error("Gagal memuat armada tersedia: " + error.message)
    }
  }

  const handleClaim = async (bike) => {
    try {
      setClaiming(true)
      await apiFetch(`/api/fleet/${bike.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          investor_id: selectedInvestor.id,
          investor_name: selectedInvestor.name
        })
      })
      toast.success(`${bike.name} berhasil diklaim`)
      
      // Refresh data
      const updatedFleet = await apiFetch(`/api/investors/${selectedInvestor.id}/fleet/`)
      setInvestorFleet(updatedFleet)
      
      // Update available list
      setAvailableFleet(prev => prev.filter(b => b.id !== bike.id))
    } catch (error) {
      toast.error("Gagal mengklaim armada: " + error.message)
    } finally {
      setClaiming(false)
    }
  }

  const handleUnclaim = async (bike) => {
    if (!confirm(`Apakah Anda yakin ingin melepaskan ${bike.name} dari investor ini?`)) return
    try {
      setClaiming(true)
      await apiFetch(`/api/fleet/${bike.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          investor_id: null,
          investor_name: 'Pusat'
        })
      })
      toast.success(`${bike.name} berhasil dilepaskan ke Pusat`)
      
      // Refresh data
      const updatedFleet = await apiFetch(`/api/investors/${selectedInvestor.id}/fleet/`)
      setInvestorFleet(updatedFleet)
    } catch (error) {
      toast.error("Gagal melepaskan armada: " + error.message)
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
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Investor</h2>
            <p className="text-sm text-muted-foreground">Kelola mitra investor dan kepemilikan armada mereka.</p>
          </div>
        </div>
        <Button onClick={() => { setFormData({name:'', email:'', phone:'', address:''}); setIsAddOpen(true) }} className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest text-[10px] px-6">
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
                <CardTitle className="text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{investor.name}</CardTitle>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
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
                  className="w-full h-12 mt-2 rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted font-bold transition-all flex items-center justify-between group/btn px-4"
                  onClick={() => openFleetModal(investor)}
                >
                  <div className="flex items-center gap-2 uppercase tracking-widest text-[9px]">
                    <Bike size={16} className="text-primary" />
                    <span>Lihat Koleksi Armada</span>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/30 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(val) => { setIsAddOpen(val); setIsEditOpen(val); }}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">
              {isEditOpen ? 'Edit Investor' : 'Tambah Investor Baru'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Masukkan detail informasi mitra investor Anda di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Nama Lengkap *</Label>
                <Input 
                  id="name" 
                  required 
                  className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/50"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/50"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  placeholder="budi@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">No. Telepon</Label>
                <Input 
                  id="phone" 
                  className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/50"
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="0812xxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Alamat</Label>
                <Input 
                  id="address" 
                  className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-12 rounded-xl focus:ring-primary/50"
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  placeholder="Jl. Merdeka No. 10"
                />
              </div>
            </div>
            <DialogFooter className="p-6 pt-2 bg-muted/50 border-t border-border">
              <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-[0.2em] shadow-xl transition-all">
                Simpan Investor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fleet View Dialog */}
      <Dialog open={isFleetOpen} onOpenChange={setIsFleetOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] glass border-white/10 text-white p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bike size={24} />
              </div>
              Armada: {selectedInvestor?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Daftar koleksi armada sepeda yang diinvestasikan oleh mitra ini.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            <div className="flex justify-between items-center pb-2">
              <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Koleksi Saat Ini</h4>
              {currentUser?.role === 'admin' && (
                <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all" onClick={openClaimModal}>
                  <Plus size={12} className="mr-1.5" /> Klaim Baru
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {investorFleet.length > 0 ? investorFleet.map((bike) => (
                <div key={bike.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/30 group hover:bg-muted/50 transition-all">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground/40 group-hover:text-primary transition-colors">
                        <Bike size={24} strokeWidth={1.5} />
                     </div>
                     <div>
                        <h4 className="font-bold text-foreground tracking-tight">{bike.name}</h4>
                        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{bike.brand} &bull; {bike.type}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(
                      "text-[9px] font-black px-3 py-1 rounded-full uppercase border-none",
                      bike.status === 'Available' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                    )}>
                       {bike.status}
                    </Badge>
                    {currentUser?.role === 'admin' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        onClick={() => handleUnclaim(bike)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
                   <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30 mb-4">
                      <Bike size={32} strokeWidth={1} />
                   </div>
                   <p className="text-muted-foreground/60 text-sm font-medium italic px-10 leading-relaxed">
                      Investor ini belum memiliki armada yang terdaftar secara resmi.
                   </p>
                   {currentUser?.role === 'admin' && (
                     <Button variant="link" className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-4 hover:no-underline hover:text-foreground" onClick={openClaimModal}>
                        + Klik untuk Tambahkan Armada
                     </Button>
                   )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/50 border-t border-border">
             <Button variant="ghost" className="w-full rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setIsFleetOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Selection Dialog */}
      <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
        <DialogContent className="sm:max-w-[450px] glass border-white/10 text-white p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold">Klaim Armada Baru</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Daftar armada milik <strong className="text-foreground">Pusat</strong> yang tersedia untuk dialihkan.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-3">
            {availableFleet.length > 0 ? availableFleet.map((bike) => (
              <div key={bike.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-all">
                <div>
                   <h5 className="font-bold text-foreground tracking-tight">{bike.name}</h5>
                   <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{bike.brand} &bull; {bike.type}</p>
                </div>
                <Button 
                  size="sm" 
                  disabled={claiming}
                  onClick={() => handleClaim(bike)}
                  className="h-10 px-5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all"
                >
                  {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Klaim'}
                </Button>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground/30 text-[10px] font-black uppercase tracking-widest italic">
                  Tidak ada armada Pusat yang tersedia
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 bg-muted/50 border-t border-border">
             <Button variant="ghost" className="w-full rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setIsClaimOpen(false)}>Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
