import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Box, Package, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/Badge'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function Addons() {
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAddon, setEditingAddon] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    is_active: true
  })

  useEffect(() => {
    fetchAddons()
  }, [])

  const fetchAddons = async () => {
    try {
      const data = await apiFetch('/api/addons/')
      setAddons(data)
    } catch (error) {
      toast.error("Gagal memuat add-ons")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (addon = null) => {
    if (addon) {
      setEditingAddon(addon)
      setFormData({
        name: addon.name,
        price: addon.price,
        description: addon.description || '',
        is_active: addon.is_active
      })
    } else {
      setEditingAddon(null)
      setFormData({
        name: '',
        price: '',
        description: '',
        is_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingAddon ? 'PUT' : 'POST'
      const url = editingAddon ? `/api/addons/${editingAddon.id}` : '/api/addons/'
      
      await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      })

      toast.success(editingAddon ? "Add-on diperbarui" : "Add-on ditambahkan")
      setIsModalOpen(false)
      fetchAddons()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Hapus add-on ini?")) return
    try {
      await apiFetch(`/api/addons/${id}`, { method: 'DELETE' })
      toast.success("Add-on dihapus")
      fetchAddons()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add-on & Aksesoris</h1>
          <p className="text-muted-foreground mt-1">Kelola aksesoris tambahan untuk penyewaan sepeda.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="rounded-2xl gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} />
          Tambah Add-on
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : addons.length === 0 ? (
          <div className="col-span-full h-64 glass rounded-[32px] flex flex-col items-center justify-center text-muted-foreground">
            <Package size={48} className="mb-4 opacity-20" />
            <p>Belum ada add-on yang tersedia.</p>
          </div>
        ) : (
          addons.map((addon) => (
            <div key={addon.id} className="glass p-6 rounded-[32px] border border-border/50 hover:border-primary/50 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                 <button onClick={() => handleOpenModal(addon)} className="p-2 bg-background/80 backdrop-blur-md rounded-xl hover:text-primary transition-colors">
                   <Pencil size={16} />
                 </button>
                 <button onClick={() => handleDelete(addon.id)} className="p-2 bg-background/80 backdrop-blur-md rounded-xl hover:text-red-500 transition-colors">
                   <Trash2 size={16} />
                 </button>
               </div>

               <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Box size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg leading-tight">{addon.name}</h3>
                    <Badge variant={addon.is_active ? "default" : "secondary"} className="mt-1 text-[10px] uppercase font-bold tracking-tighter">
                      {addon.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="flex justify-between items-end p-4 bg-muted/30 rounded-2xl">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Biaya Tambahan</span>
                    <span className="text-xl font-bold tracking-tighter text-primary">Rp {addon.price.toLocaleString()}</span>
                 </div>
                 <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                   {addon.description || "Tidak ada deskripsi."}
                 </p>
               </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col shadow-2xl">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Box size={24} />
              </div>
              {editingAddon ? "Perbarui Aksesoris" : "Tambah Aksesoris Baru"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              {editingAddon ? "Sesuaikan detail item tambahan di bawah ini." : "Daftarkan aksesoris baru untuk meningkatkan pendapatan rental."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 ml-1">Nama Aksesoris *</Label>
                <Input 
                  placeholder="Contoh: Helm Premium, Lampu Depan"
                  className="h-14 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 ml-1">Harga Tambahan (Rp) *</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">Rp</div>
                  <Input 
                    type="number"
                    placeholder="0"
                    className="h-14 pl-12 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all font-mono font-bold"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 ml-1">Deskripsi Item</Label>
                <textarea 
                  className="w-full min-h-[120px] bg-muted/40 border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 text-foreground"
                  placeholder="Jelaskan spesifikasi atau kondisi aksesoris ini..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-4 p-5 bg-primary/[0.03] rounded-2xl border border-primary/10 group cursor-pointer hover:bg-primary/[0.05] transition-colors" onClick={() => setFormData({...formData, is_active: !formData.is_active})}>
                 <div className={cn(
                   "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                   formData.is_active ? "bg-primary border-primary text-white" : "border-muted-foreground/20"
                 )}>
                   {formData.is_active && <ShieldCheck size={14} strokeWidth={3} />}
                 </div>
                 <div className="flex-1">
                    <Label className="text-sm font-bold cursor-pointer block">Status Aktif</Label>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Item ini akan muncul sebagai opsi pada formulir sewa.</p>
                 </div>
              </div>
            </div>

            <div className="p-8 bg-muted/20 border-t border-border mt-auto flex gap-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px]">
                Batal
              </Button>
              <Button type="submit" className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:opacity-90">
                {editingAddon ? "Simpan Perubahan" : "Daftarkan Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
