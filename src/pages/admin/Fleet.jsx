import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bike, Plus, Loader2, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from "@/components/ui/Badge"
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Fleet() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedBike, setSelectedBike] = useState(null)
  const { profile: currentUser } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: '',
    price_per_hour: 0,
    price_per_day: 0,
    status: 'Available',
    image_url: ''
  })

  const loadFleetData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const data = await apiFetch('/api/fleet/')
      setBikes(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    // Inline fetch for initial load prevents React Compiler from falsely detecting synchronous state updates
    apiFetch('/api/fleet/')
      .then(data => setBikes(data))
      .catch(error => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])

  const handleAddBike = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await apiFetch('/api/fleet/', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      
      toast.success('Sepeda berhasil ditambahkan')
      setOpen(false)
      resetForm()
      loadFleetData(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateBike = async (e) => {
    e.preventDefault()
    if (!selectedBike) return
    try {
      setSubmitting(true)
      await apiFetch(`/api/fleet/${selectedBike.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      
      toast.success('Data sepeda berhasil diperbarui')
      setEditOpen(false)
      resetForm()
      loadFleetData(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBike = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sepeda ini?')) return
    try {
      setLoading(true)
      await apiFetch(`/api/fleet/${id}`, {
        method: 'DELETE'
      })
      toast.success('Sepeda berhasil dihapus')
      loadFleetData(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', brand: '', type: '', price_per_hour: 0, price_per_day: 0, status: 'Available', image_url: '' })
    setSelectedBike(null)
  }

  const openEdit = (bike) => {
    setSelectedBike(bike)
    setFormData({
      name: bike.name,
      brand: bike.brand || '',
      type: bike.type || '',
      price_per_hour: bike.price_per_hour,
      price_per_day: bike.price_per_day,
      status: bike.status,
      image_url: bike.image_url || ''
    })
    setEditOpen(true)
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary border border-primary/20">
            <Bike size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Armada</h2>
            <p className="text-sm text-muted-foreground">Kelola unit sepeda, harga sewa, dan pantau status ketersediaan.</p>
          </div>
        </div>
        
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest text-[10px] px-6">
              <Plus size={18} className="mr-2" />
              Tambah Sepeda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass border-border text-foreground p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-bold">Tambah Sepeda Baru</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">Masukkan detail armada sepeda baru di bawah ini.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddBike}>
              <div className="px-6 py-4">
                <BikeForm formData={formData} setFormData={setFormData} />
              </div>
              <DialogFooter className="p-6 pt-2 bg-muted/50 border-t border-border">
                <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest transition-all shadow-xl" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Armada
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/20" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.length > 0 ? (
            bikes.map((bike) => (
              <Card key={bike.id} className="glass-card overflow-hidden group border-border hover:border-primary/20 transition-all duration-500">
                <div className="aspect-[16/10] w-full bg-muted/20 flex items-center justify-center relative overflow-hidden border-b border-border">
                  {bike.image_url ? (
                    <img src={bike.image_url} alt={bike.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Bike size={64} strokeWidth={1} className="text-foreground" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-foreground">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge className={cn(
                      "border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg",
                      bike.status === 'Available' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                    )}>
                      {bike.status}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{bike.name}</CardTitle>
                      <CardDescription className="text-muted-foreground font-medium">{bike.brand} &bull; {bike.type}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border group-hover:bg-muted/60 transition-colors">
                      <p className="text-muted-foreground text-[9px] uppercase font-bold tracking-[0.15em] mb-1">Per Jam</p>
                      <p className="font-bold text-foreground text-base tracking-tighter">Rp {bike.price_per_hour.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/40 border border-border group-hover:bg-muted/60 transition-colors">
                      <p className="text-muted-foreground text-[9px] uppercase font-bold tracking-[0.15em] mb-1">Per Hari</p>
                      <p className="font-bold text-foreground text-base tracking-tighter">Rp {bike.price_per_day.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 font-bold transition-all uppercase tracking-widest text-[9px]" 
                      onClick={() => openEdit(bike)}
                    >
                      <Edit size={14} className="mr-2" /> Detail
                    </Button>
                    {currentUser?.role === 'admin' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all" 
                        onClick={() => handleDeleteBike(bike.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full glass-card py-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mb-2">
                <Bike size={40} strokeWidth={1} />
              </div>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest italic">Belum ada armada terdaftar</p>
            </Card>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if(!val) resetForm(); }}>
        <DialogContent className="sm:max-w-[425px] glass border-border text-foreground p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Edit Detail Sepeda</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">Perbarui informasi armada sepeda <span className="text-primary font-bold">{selectedBike?.name}</span>.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBike}>
            <div className="px-6 py-4">
              <BikeForm formData={formData} setFormData={setFormData} />
            </div>
            <DialogFooter className="p-6 pt-2 bg-muted/50 border-t border-border">
              <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-black uppercase tracking-widest transition-all shadow-xl" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BikeForm({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Nama Sepeda *</Label>
        <Input 
          id="name" 
          placeholder="Contoh: Honda Vario 160" 
          required 
          className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-11 rounded-xl focus:ring-primary/50"
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="brand" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Merk</Label>
          <Input 
            id="brand" 
            placeholder="Honda" 
            className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-11 rounded-xl focus:ring-primary/50"
            value={formData.brand} 
            onChange={(e) => setFormData({...formData, brand: e.target.value})} 
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Tipe</Label>
          <Input 
            id="type" 
            placeholder="Matic" 
            className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-11 rounded-xl focus:ring-primary/50"
            value={formData.type} 
            onChange={(e) => setFormData({...formData, type: e.target.value})} 
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price_h" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Sewa per Jam *</Label>
          <Input 
            id="price_h" 
            type="number" 
            required 
            className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-11 rounded-xl focus:ring-primary/50"
            value={formData.price_per_hour} 
            onChange={(e) => setFormData({...formData, price_per_hour: parseInt(e.target.value) || 0})} 
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price_d" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Sewa per Hari *</Label>
          <Input 
            id="price_d" 
            type="number" 
            required 
            className="bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-11 rounded-xl focus:ring-primary/50"
            value={formData.price_per_day} 
            onChange={(e) => setFormData({...formData, price_per_day: parseInt(e.target.value) || 0})} 
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">URL Gambar (Opsional)</Label>
        <div className="relative">
          <ImageIcon size={14} className="absolute left-3.5 top-3.5 text-muted-foreground/40" />
          <Input 
            id="image" 
            placeholder="https://..." 
            className="pl-11 bg-muted border border-border text-foreground placeholder:text-muted-foreground/30 h-11 rounded-xl focus:ring-primary/50"
            value={formData.image_url} 
            onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
          />
        </div>
      </div>
    </div>
  )
}
