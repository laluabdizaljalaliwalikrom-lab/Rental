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
  ChevronRight
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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Investor</h2>
            <p className="text-sm text-muted-foreground">Kelola mitra investor dan kepemilikan armada mereka.</p>
          </div>
        </div>
        <Button onClick={() => { setFormData({name:'', email:'', phone:'', address:''}); setIsAddOpen(true) }} className="flex items-center gap-2">
          <Plus size={18} />
          Tambah Investor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Cari nama atau email investor..." 
          className="pl-10 bg-background/60 border-white/10" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse border-white/10 bg-background/40 h-[200px]" />
          ))
        ) : filteredInvestors.map((investor) => (
          <Card key={investor.id} className="border-white/10 bg-background/60 backdrop-blur-xl group hover:border-primary/30 transition-all overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">{investor.name}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                   <Mail size={12} /> {investor.email || '-'}
                </div>
              </div>
              <div className="flex gap-1">
                 <Button variant="ghost" size="icon" onClick={() => { setSelectedInvestor(investor); setFormData(investor); setIsEditOpen(true) }}>
                    <Edit2 size={14} className="text-muted-foreground" />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => handleDelete(investor.id)}>
                    <Trash2 size={14} className="text-red-400" />
                 </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone size={14} /> {investor.phone || '-'}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                  <MapPin size={14} /> {investor.address || '-'}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-2 border-white/10 hover:bg-primary/5 flex items-center justify-between group/btn"
                  onClick={() => openFleetModal(investor)}
                >
                  <div className="flex items-center gap-2">
                    <Bike size={16} className="text-primary" />
                    <span>Lihat Armada</span>
                  </div>
                  <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(val) => { setIsAddOpen(val); setIsEditOpen(val); }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isEditOpen ? 'Edit Investor' : 'Tambah Investor Baru'}
              </DialogTitle>
              <DialogDescription>
                Masukkan detail informasi mitra investor Anda di bawah ini.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  placeholder="budi@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">No. Telepon</Label>
                <Input 
                  id="phone" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="0812xxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Alamat</Label>
                <Input 
                  id="address" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  placeholder="Jl. Merdeka No. 10"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                Simpan Investor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fleet View Dialog */}
      <Dialog open={isFleetOpen} onOpenChange={setIsFleetOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5 text-primary" />
              Armada Milik: {selectedInvestor?.name}
            </DialogTitle>
            <DialogDescription>
              Daftar semua sepeda yang diinvestasikan oleh mitra ini.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center pb-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Koleksi Armada</h4>
              {currentUser?.role === 'admin' && (
                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 border-primary/20 hover:bg-primary/5" onClick={openClaimModal}>
                  <Plus size={12} /> Klaim Armada
                </Button>
              )}
            </div>
            {investorFleet.length > 0 ? investorFleet.map((bike) => (
              <div key={bike.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Bike size={20} />
                   </div>
                   <div>
                      <h4 className="font-semibold text-sm">{bike.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{bike.brand} • {bike.type}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={bike.status === 'Available' ? 'success' : 'warning'} className="text-[10px]">
                     {bike.status}
                  </Badge>
                  {currentUser?.role === 'admin' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => handleUnclaim(bike)}
                      title="Lepas dari Investor"
                    >
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-white/5 rounded-xl">
                 <Bike size={40} className="text-muted-foreground/20 mb-3" />
                 <p className="text-sm text-muted-foreground italic">
                    Investor ini belum memiliki armada yang terdaftar.
                 </p>
                 {currentUser?.role === 'admin' && (
                   <Button variant="link" className="text-primary text-xs mt-2" onClick={openClaimModal}>
                      Klik di sini untuk klaim armada
                   </Button>
                 )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim Selection Dialog */}
      <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Pilih Armada untuk Diklaim</DialogTitle>
            <DialogDescription>
              Menampilkan daftar armada milik <strong>Pusat</strong> yang bisa dialihkan ke investor ini.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto pr-2">
            {availableFleet.length > 0 ? availableFleet.map((bike) => (
              <div key={bike.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
                <div>
                   <h5 className="text-sm font-bold">{bike.name}</h5>
                   <p className="text-[10px] text-muted-foreground uppercase">{bike.brand} • {bike.type}</p>
                </div>
                <Button 
                  size="sm" 
                  disabled={claiming}
                  onClick={() => handleClaim(bike)}
                  className="h-8 text-xs bg-primary/20 text-primary hover:bg-primary/30 border-none"
                >
                  Klaim
                </Button>
              </div>
            )) : (
              <div className="text-center py-10 text-muted-foreground text-sm italic">
                Tidak ada armada Pusat yang tersedia untuk diklaim.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
