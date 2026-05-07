import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bike, Loader2, Calendar, Clock, CreditCard, History, ListFilter, Trash2, Phone, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from "@/components/ui/Badge"
import { apiFetch } from '@/lib/api'
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from '@/hooks/useAuth'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function Rentals() {
  const [bikes, setBikes] = useState([])
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [rentOpen, setRentOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedBike, setSelectedBike] = useState(null)
  const [selectedRental, setSelectedRental] = useState(null)
  const { profile: currentUser } = useAuth()
  
  const [rentalData, setRentalData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    identity_type: 'KTP',
    identity_number: '',
    rental_type: 'Short',
    duration: 1
  })
  const [identityImage, setIdentityImage] = useState(null)

  const loadRentalData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const [bikesData, rentalsData] = await Promise.all([
        apiFetch('/api/fleet/'),
        apiFetch('/api/rentals/')
      ])
      
      setBikes(bikesData)
      setRentals(rentalsData)
    } catch (error) {
      toast.error(error.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    // Inline fetch for initial load prevents React Compiler from falsely detecting synchronous state updates
    Promise.all([apiFetch('/api/fleet/'), apiFetch('/api/rentals/')])
      .then(([bikesData, rentalsData]) => {
        setBikes(bikesData)
        setRentals(rentalsData)
      })
      .catch(error => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])

  const handleRentBike = async (e) => {
    e.preventDefault()
    if (!selectedBike) return

    const totalPrice = rentalData.rental_type === 'Short' 
      ? selectedBike.price_per_hour * rentalData.duration 
      : selectedBike.price_per_day * rentalData.duration

    try {
      setSubmitting(true)

      let identity_image_url = null
      if (identityImage) {
        const formData = new FormData()
        formData.append('file', identityImage)
        
        const uploadRes = await apiFetch('/api/rentals/upload-identity', {
          method: 'POST',
          body: formData
        })
        identity_image_url = uploadRes.url
      }

      await apiFetch('/api/rentals/', {
        method: 'POST',
        body: JSON.stringify({
          bike_id: selectedBike.id,
          customer_name: rentalData.customer_name,
          customer_phone: rentalData.customer_phone,
          customer_address: rentalData.customer_address,
          identity_type: rentalData.identity_type,
          identity_number: rentalData.identity_number,
          identity_image_url: identity_image_url,
          rental_type: rentalData.rental_type,
          duration: rentalData.duration,
          total_price: totalPrice
        })
      })
      
      toast.success(`Rental berhasil! Total: Rp ${totalPrice.toLocaleString()}`)
      setRentOpen(false)
      setRentalData({ 
        customer_name: '', customer_phone: '', customer_address: '', 
        identity_type: 'KTP', identity_number: '', 
        rental_type: 'Short', duration: 1 
      })
      setIdentityImage(null)
      loadRentalData(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteRental = async (id) => {
    if (!confirm('Tandai rental ini sebagai selesai? Sepeda akan kembali tersedia.')) return
    
    try {
      setLoading(true)
      await apiFetch(`/api/rentals/${id}/complete`, {
        method: 'POST'
      })
      toast.success('Rental telah selesai')
      loadRentalData(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRental = async () => {
    if (!selectedRental) return
    try {
      setSubmitting(true)
      await apiFetch(`/api/rentals/${selectedRental.id}`, {
        method: 'DELETE'
      })
      toast.success('Transaksi penyewaan berhasil dihapus')
      setDeleteOpen(false)
      loadRentalData(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary border border-primary/20">
            <CreditCard size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sistem Penyewaan</h2>
            <p className="text-sm text-muted-foreground">Kelola operasional penyewaan unit secara real-time dan efisien.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="bg-muted border border-border p-1 rounded-2xl h-14 w-fit">
          <TabsTrigger value="available" className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <ListFilter size={14} className="mr-2" /> Sewa Sepeda
          </TabsTrigger>
          <TabsTrigger value="history" className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <History size={14} className="mr-2" /> Riwayat Rental
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-8">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-white/10" />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bikes.filter(b => b.status === 'Available').length > 0 ? (
                bikes.filter(b => b.status === 'Available').map((bike) => (
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
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500 text-white border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Tersedia</Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{bike.name}</CardTitle>
                      <CardDescription className="text-muted-foreground font-medium">{bike.brand} &bull; {bike.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-2xl bg-muted/40 border border-border group-hover:bg-muted/60 transition-colors text-center">
                          <p className="text-muted-foreground text-[9px] uppercase font-bold tracking-[0.15em] mb-1">Per Jam</p>
                          <p className="font-bold text-foreground text-base tracking-tighter">Rp {bike.price_per_hour.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-muted/40 border border-border group-hover:bg-muted/60 transition-colors text-center">
                          <p className="text-muted-foreground text-[9px] uppercase font-bold tracking-[0.15em] mb-1">Per Hari</p>
                          <p className="font-bold text-foreground text-base tracking-tighter">Rp {bike.price_per_day.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-blue-600/20 transition-all" onClick={() => { setSelectedBike(bike); setRentOpen(true); }}>
                        <CreditCard size={16} className="mr-2" /> Sewa Sekarang
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full glass-card py-20 text-center flex flex-col items-center justify-center space-y-4">
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-2">
                     <Bike size={40} strokeWidth={1} />
                   </div>
                   <div className="space-y-1">
                     <h3 className="text-xl font-bold text-white uppercase tracking-wider">Tidak ada sepeda tersedia</h3>
                     <p className="text-sm text-white/30 font-medium max-w-xs mx-auto">Seluruh armada sedang dalam masa penyewaan aktif atau belum didaftarkan.</p>
                   </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-8">
          <Card className="glass-card border-white/5 overflow-hidden">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-bold text-white">Log Aktivitas Penyewaan</CardTitle>
              <CardDescription className="text-white/40 font-medium mt-1 text-xs">Rekam jejak komprehensif transaksi rental sepeda Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {rentals.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {rentals.map((r) => {
                    const bike = bikes.find(b => b.id === r.bike_id)
                    return (
                    <div key={r.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6 group hover:bg-white/[0.03] transition-all">
                      <div className="flex items-start gap-5">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105",
                          r.status === 'Active' ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-green-600 text-white shadow-green-600/20'
                        )}>
                          {r.status === 'Active' ? <Clock size={28} strokeWidth={2} /> : <History size={28} strokeWidth={2} />}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-xl text-white tracking-tight">{r.customer_name}</p>
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none",
                              r.status === 'Active' ? 'bg-blue-400/10 text-blue-400' : 'bg-green-400/10 text-green-400'
                            )}>
                              {r.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-white/20">
                            {r.customer_phone && <span className="flex items-center gap-1.5"><Phone size={12} className="opacity-50" /> {r.customer_phone}</span>}
                            {r.identity_type && <span className="flex items-center gap-1.5"><CreditCard size={12} className="opacity-50" /> {r.identity_type}: {r.identity_number}</span>}
                          </div>
                          <div className="pt-2 space-y-1">
                             <p className="text-sm font-bold text-white/70 tracking-tight">
                               Armada: <span className="text-blue-400">{bike ? `${bike.name} (${bike.brand})` : `Unit ID: ${r.bike_id.substring(0, 8)}`}</span>
                             </p>
                             <p className="text-xs text-white/40 font-medium">
                               Paket: <span className="text-white/60">{r.rental_type === 'Short' ? 'Short-Term' : 'Daily'}</span> ({r.duration} {r.rental_type === 'Short' ? 'Jam' : 'Hari'})
                             </p>
                          </div>
                          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                            <p className="flex items-center gap-2"><Clock size={12} className="text-blue-500/50" /> Mulai: <span className="text-white/40">{new Date(r.start_time).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}</span></p>
                            {r.end_time && (
                              <p className="flex items-center gap-2"><Calendar size={12} className="text-green-500/50" /> Selesai: <span className="text-white/40">{new Date(r.end_time).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}</span></p>
                            )}
                          </div>
                          {r.identity_image_url && (
                            <a href={r.identity_image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-blue-400 hover:text-white transition-colors mt-3 py-1.5 px-3 rounded-lg bg-blue-400/5 border border-blue-400/10">
                              <Plus size={12} /> Lampiran Identitas
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 pl-14 lg:pl-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-border">
                        <div className="text-right">
                          <p className="font-black text-2xl text-foreground tracking-tighter">Rp {r.total_price.toLocaleString()}</p>
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Total Pembayaran</p>
                        </div>
                        <div className="flex gap-2">
                           {r.status === 'Active' && (
                             <Button size="sm" className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-xl hover:opacity-90 transition-all" onClick={() => handleCompleteRental(r.id)}>
                               Selesai
                             </Button>
                           )}
                           {currentUser?.role === 'admin' && (
                             <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all" onClick={() => { setSelectedRental(r); setDeleteOpen(true); }}>
                               <Trash2 size={16} />
                             </Button>
                           )}
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-4">
                    <History size={32} strokeWidth={1} />
                  </div>
                  <p className="text-white/20 text-xs font-bold uppercase tracking-[0.2em] italic">Belum ada riwayat transaksi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rent Dialog */}
      <Dialog open={rentOpen} onOpenChange={setRentOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] glass border-white/10 text-white p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-4 flex-shrink-0">
            <DialogTitle className="text-3xl font-black tracking-tighter">Konfigurasi Rental</DialogTitle>
            <DialogDescription className="text-white/40 font-medium">
              Selesaikan rincian data penyewa untuk unit <span className="text-blue-400 font-bold">{selectedBike?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRentBike} className="flex flex-col min-h-0 flex-1">
            <div className="px-8 py-4 overflow-y-auto flex-1 custom-scrollbar space-y-8">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="customer" className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Nama Lengkap Penyewa *</Label>
                  <Input 
                    id="customer" 
                    placeholder="Masukkan nama sesuai identitas resmi" 
                    required 
                    className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl focus:ring-blue-500/50"
                    value={rentalData.customer_name}
                    onChange={(e) => setRentalData({...rentalData, customer_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Nomor WhatsApp *</Label>
                    <Input 
                      id="phone" 
                      placeholder="0812xxxx" 
                      required 
                      className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl focus:ring-blue-500/50"
                      value={rentalData.customer_phone}
                      onChange={(e) => setRentalData({...rentalData, customer_phone: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Metode Identitas *</Label>
                    <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/10 rounded-2xl h-14">
                      {['KTP', 'SIM', 'Paspor'].map(type => (
                        <button
                          key={type}
                          type="button"
                          className={cn(
                            "flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            rentalData.identity_type === type ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white/60'
                          )}
                          onClick={() => setRentalData({...rentalData, identity_type: type})}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="idNumber" className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Nomor Registrasi {rentalData.identity_type} *</Label>
                  <Input 
                    id="idNumber" 
                    placeholder={`Masukkan nomor seri ${rentalData.identity_type}`}
                    required 
                    className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl focus:ring-blue-500/50"
                    value={rentalData.identity_number}
                    onChange={(e) => setRentalData({...rentalData, identity_number: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address" className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Lokasi Domisili / Hotel / Menginap *</Label>
                  <Input 
                    id="address" 
                    placeholder="Alamat lengkap selama masa penyewaan" 
                    required 
                    className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl focus:ring-blue-500/50"
                    value={rentalData.customer_address}
                    onChange={(e) => setRentalData({...rentalData, customer_address: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Paket Durasi *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      className={cn(
                        "h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest border transition-all",
                        rentalData.rental_type === 'Short' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
                      )}
                      onClick={() => setRentalData({...rentalData, rental_type: 'Short'})}
                    >
                      <Clock size={18} /> Short-Term
                    </button>
                    <button 
                      type="button" 
                      className={cn(
                        "h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest border transition-all",
                        rentalData.rental_type === 'Long' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
                      )}
                      onClick={() => setRentalData({...rentalData, rental_type: 'Long'})}
                    >
                      <Calendar size={18} /> Daily Rental
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration" className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">
                    Kuantitas ({rentalData.rental_type === 'Short' ? 'Jam' : 'Hari'})
                  </Label>
                  <Input 
                    id="duration" 
                    type="number"
                    min="1"
                    className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/10 rounded-2xl focus:ring-blue-500/50"
                    value={rentalData.duration}
                    onChange={(e) => setRentalData({...rentalData, duration: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="identityImage" className="text-[10px] uppercase font-black tracking-[0.2em] text-white/30">Lampiran Foto Identitas (Opsional)</Label>
                  <div className="relative group/file">
                    <Input 
                      id="identityImage" 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setIdentityImage(e.target.files[0])}
                      className="h-14 bg-white/5 border-white/10 text-white rounded-2xl file:bg-white/10 file:text-white file:border-none file:h-full file:mr-4 file:px-4 file:font-bold file:text-[10px] file:uppercase cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 pt-6 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-left flex flex-col">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">Estimasi Total Biaya</p>
                <p className="text-3xl font-black text-white tracking-tighter">
                  Rp {(rentalData.rental_type === 'Short' ? (selectedBike?.price_per_hour * rentalData.duration) : (selectedBike?.price_per_day * rentalData.duration))?.toLocaleString()}
                </p>
              </div>
              <Button type="submit" className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Proses Rental"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Rental Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black text-red-500 flex items-center gap-3 uppercase tracking-tight">
              <Trash2 size={28} /> Hapus Transaksi
            </DialogTitle>
            <DialogDescription className="text-white/40 pt-4 leading-relaxed">
              Apakah Anda benar-benar yakin ingin menghapus transaksi penyewaan atas nama <strong className="text-white">{selectedRental?.customer_name}</strong>? Tindakan ini akan menghapus log sistem secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 pt-0">
             <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider leading-normal">
               ⚠️ Perhatian: Seluruh data terkait penyewaan ini termasuk lampiran identitas akan hilang dari basis data.
             </div>
          </div>
          <DialogFooter className="p-8 bg-white/[0.02] border-t border-white/5 gap-4">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl border border-white/10 text-white/40 hover:bg-white/5" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button variant="ghost" className="flex-1 h-12 rounded-xl bg-red-600 text-white hover:bg-red-700 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 transition-all" onClick={handleDeleteRental} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
