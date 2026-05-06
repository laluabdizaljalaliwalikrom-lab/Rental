import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bike, Plus, Loader2, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from "@/components/ui/Badge"
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
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: '',
    price_per_hour: 0,
    price_per_day: 0,
    status: 'Available',
    image_url: ''
  })

  useEffect(() => {
    fetchFleet()
  }, [])

  const fetchFleet = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fleet/')
      if (!response.ok) throw new Error('Gagal mengambil data armada')
      const data = await response.json()
      setBikes(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBike = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const response = await fetch('/api/fleet/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Gagal menambahkan sepeda')
      
      toast.success('Sepeda berhasil ditambahkan')
      setOpen(false)
      resetForm()
      fetchFleet()
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
      const response = await fetch(`/api/fleet/${selectedBike.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Gagal memperbarui data sepeda')
      
      toast.success('Data sepeda berhasil diperbarui')
      setEditOpen(false)
      resetForm()
      fetchFleet()
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
      const response = await fetch(`/api/fleet/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Gagal menghapus sepeda')
      toast.success('Sepeda berhasil dihapus')
      fetchFleet()
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Bike size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Manajemen Armada</h2>
        </div>
        
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              Tambah Sepeda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddBike}>
              <DialogHeader>
                <DialogTitle>Tambah Sepeda Baru</DialogTitle>
                <DialogDescription>Masukkan detail armada sepeda baru di bawah ini.</DialogDescription>
              </DialogHeader>
              <BikeForm formData={formData} setFormData={setFormData} />
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bikes.length > 0 ? (
            bikes.map((bike) => (
              <Card key={bike.id} className="overflow-hidden border-white/10 bg-background/60 backdrop-blur-xl group">
                <div className="aspect-video w-full bg-muted flex items-center justify-center relative overflow-hidden">
                  {bike.image_url ? (
                    <img src={bike.image_url} alt={bike.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <Bike size={48} className="text-muted-foreground/20" />
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant={bike.status === 'Available' ? 'success' : 'warning'}>
                      {bike.status}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl">{bike.name}</CardTitle>
                      <CardDescription>{bike.brand} • {bike.type}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Per Jam</p>
                      <p className="font-bold">Rp {bike.price_per_hour.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-center">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Per Hari</p>
                      <p className="font-bold">Rp {bike.price_per_day.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={() => openEdit(bike)}>
                      <Edit size={16} /> Edit
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteBike(bike.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full border-white/10 bg-background/60 backdrop-blur-xl py-12 text-center">
              <CardContent className="flex flex-col items-center">
                <Bike size={48} className="text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-medium">Belum ada data sepeda</h3>
                <p className="text-sm text-muted-foreground">Mulai dengan menambahkan sepeda baru.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(val) => { setEditOpen(val); if(!val) resetForm(); }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdateBike}>
            <DialogHeader>
              <DialogTitle>Edit Data Sepeda</DialogTitle>
              <DialogDescription>Perbarui informasi armada sepeda <strong>{selectedBike?.name}</strong>.</DialogDescription>
            </DialogHeader>
            <BikeForm formData={formData} setFormData={setFormData} />
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
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
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nama Sepeda</Label>
        <Input 
          id="name" 
          placeholder="Contoh: Polygon Xtrada 5" 
          required 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="brand">Merk</Label>
          <Input 
            id="brand" 
            placeholder="Polygon" 
            value={formData.brand}
            onChange={(e) => setFormData({...formData, brand: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">Tipe</Label>
          <Input 
            id="type" 
            placeholder="MTB" 
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price_h">Sewa per Jam</Label>
          <Input 
            id="price_h" 
            type="number" 
            placeholder="15000" 
            required
            value={formData.price_per_hour || ''}
            onChange={(e) => setFormData({...formData, price_per_hour: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price_d">Sewa per Hari</Label>
          <Input 
            id="price_d" 
            type="number" 
            placeholder="120000" 
            required
            value={formData.price_per_day || ''}
            onChange={(e) => setFormData({...formData, price_per_day: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image">URL Gambar (Opsional)</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="image" 
              className="pl-9"
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
