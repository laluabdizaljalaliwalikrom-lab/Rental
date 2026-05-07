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
          <div className="rounded-2xl bg-white/10 p-3 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
            <Bike size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Manajemen Armada</h2>
            <p className="text-sm text-white/40">Kelola unit sepeda, harga sewa, dan pantau status ketersediaan.</p>
          </div>
        </div>
        
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest text-[10px] px-6">
              <Plus size={18} className="mr-2" />
              Tambah Sepeda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white p-0 overflow-hidden">
            <form onSubmit={handleAddBike}>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-2xl font-bold">Tambah Sepeda Baru</DialogTitle>
                <DialogDescription className="text-white/40">Masukkan detail armada sepeda baru di bawah ini.</DialogDescription>
              </DialogHeader>
              <div className="px-6 py-4">
                <BikeForm formData={formData} setFormData={setFormData} />
              </div>
              <DialogFooter className="p-6 pt-2 bg-white/[0.02] border-t border-white/5">
                <Button type="submit" className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest transition-all shadow-xl" disabled={submitting}>
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
          <Loader2 className="h-10 w-10 animate-spin text-white/10" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.length > 0 ? (
            bikes.map((bike) => (
              <Card key={bike.id} className="glass-card overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-500">
                <div className="aspect-[16/10] w-full bg-white/[0.02] flex items-center justify-center relative overflow-hidden border-b border-white/5">
                  {bike.image_url ? (
                    <img src={bike.image_url} alt={bike.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Bike size={64} strokeWidth={1} />
                      <span className="text-[10px] uppercase tracking-widest font-bold">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge className={cn(
                      "border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg",
                      bike.status === 'Available' ? 'bg-green-500/20 text-green-400 shadow-green-500/10' : 'bg-orange-500/20 text-orange-400 shadow-orange-500/10'
                    )}>
                      {bike.status}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">{bike.name}</CardTitle>
                      <CardDescription className="text-white/40 font-medium">{bike.brand} &bull; {bike.type}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                      <p className="text-white/30 text-[9px] uppercase font-bold tracking-[0.15em] mb-1">Per Jam</p>
                      <p className="font-bold text-white text-base tracking-tighter">Rp {bike.price_per_hour.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-colors">
                      <p className="text-white/30 text-[9px] uppercase font-bold tracking-[0.15em] mb-1">Per Hari</p>
                      <p className="font-bold text-white text-base tracking-tighter">Rp {bike.price_per_day.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-12 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/10 font-bold transition-all uppercase tracking-widest text-[9px]" 
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
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-2">
                <Bike size={40} strokeWidth={1} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Belum ada data armada</h3>
                <p className="text-sm text-white/40">Mulai operasional Anda dengan menambahkan sepeda baru.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if(!val) resetForm(); }}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white p-0 overflow-hidden">
          <form onSubmit={handleUpdateBike}>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-bold">Edit Data Sepeda</DialogTitle>
              <DialogDescription className="text-white/40">Perbarui informasi armada sepeda <span className="text-white font-bold">{selectedBike?.name}</span>.</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4">
              <BikeForm formData={formData} setFormData={setFormData} />
            </div>
            <DialogFooter className="p-6 pt-2 bg-white/[0.02] border-t border-white/5">
              <Button type="submit" className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest transition-all shadow-xl" disabled={submitting}>
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
    <div className="grid gap-6 py-2">
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Nama Sepeda *</Label>
        <Input 
          id="name" 
          placeholder="Contoh: Polygon Xtrada 5" 
          required 
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:ring-blue-500/50"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="brand" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Merk</Label>
          <Input 
            id="brand" 
            placeholder="Polygon" 
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:ring-blue-500/50"
            value={formData.brand}
            onChange={(e) => setFormData({...formData, brand: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Tipe</Label>
          <Input 
            id="type" 
            placeholder="MTB" 
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:ring-blue-500/50"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price_h" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Sewa per Jam *</Label>
          <Input 
            id="price_h" 
            type="number" 
            placeholder="15000" 
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:ring-blue-500/50"
            value={formData.price_per_hour || ''}
            onChange={(e) => setFormData({...formData, price_per_hour: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price_d" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Sewa per Hari *</Label>
          <Input 
            id="price_d" 
            type="number" 
            placeholder="120000" 
            required
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:ring-blue-500/50"
            value={formData.price_per_day || ''}
            onChange={(e) => setFormData({...formData, price_per_day: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image" className="text-[10px] uppercase font-bold tracking-widest text-white/40">URL Gambar (Opsional)</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ImageIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-white/20" />
            <Input 
              id="image" 
              className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-11 rounded-xl focus:ring-blue-500/50"
              placeholder="https://images.unsplash.com/..." 
              value={formData.image_url}
              onChange={(e) => setFormData({...formData, image_url: e.target.value})}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
