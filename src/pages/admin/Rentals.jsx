import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bike, Loader2, Calendar, Clock, CreditCard, History, ListFilter, Trash2, Plus, Camera } from 'lucide-react'
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

      const total_price = rentalData.rental_type === 'Short' 
        ? (selectedBike.price_per_hour * rentalData.duration)
        : (selectedBike.price_per_day * rentalData.duration)

      await apiFetch('/api/rentals/', {
        method: 'POST',
        body: JSON.stringify({
          ...rentalData,
          bike_id: selectedBike.id,
          identity_image_url,
          total_price
        })
      })

      toast.success('Rental berhasil dibuat')
      setRentOpen(false)
      setRentalData({
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        identity_type: 'KTP',
        identity_number: '',
        rental_type: 'Short',
        duration: 1
      })
      setIdentityImage(null)
      loadRentalData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCompleteRental = async (id) => {
    try {
      await apiFetch(`/api/rentals/${id}/complete`, { method: 'POST' })
      toast.success('Rental telah diselesaikan')
      loadRentalData()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDeleteRental = async () => {
    if (!selectedRental) return
    try {
      setSubmitting(true)
      await apiFetch(`/api/rentals/${selectedRental.id}`, { method: 'DELETE' })
      toast.success('Riwayat rental berhasil dihapus')
      setDeleteOpen(false)
      loadRentalData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <CreditCard size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sistem Penyewaan</h1>
            <p className="text-sm text-muted-foreground font-medium italic">Manajemen operasional armada & transaksi harian.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="bg-muted border border-border p-1 rounded-2xl h-14 w-fit">
          <TabsTrigger value="available" className="h-12 px-8 rounded-xl font-semibold uppercase text-[10px] tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <ListFilter size={14} className="mr-2" /> Sewa Sepeda
          </TabsTrigger>
          <TabsTrigger value="history" className="h-12 px-8 rounded-xl font-semibold uppercase text-[10px] tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <History size={14} className="mr-2" /> Riwayat Rental
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-8">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
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
                          <span className="text-[10px] uppercase tracking-wider font-medium text-foreground">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500 text-white border-none px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-lg">Tersedia</Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight">{bike.name}</CardTitle>
                      <CardDescription className="text-muted-foreground font-medium">{bike.brand} &bull; {bike.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-2xl bg-muted/40 border border-border group-hover:bg-muted/60 transition-colors text-center">
                          <p className="text-muted-foreground text-[9px] uppercase font-medium tracking-wider mb-1">Per Jam</p>
                          <p className="font-semibold text-foreground text-base tracking-tighter">Rp {bike.price_per_hour.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-muted/40 border border-border group-hover:bg-muted/60 transition-colors text-center">
                          <p className="text-muted-foreground text-[9px] uppercase font-medium tracking-wider mb-1">Per Hari</p>
                          <p className="font-semibold text-foreground text-base tracking-tighter">Rp {bike.price_per_day.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold uppercase tracking-wider text-[10px] shadow-lg shadow-blue-600/20 transition-all" onClick={() => { setSelectedBike(bike); setRentOpen(true); }}>
                        <CreditCard size={16} className="mr-2" /> Sewa Sekarang
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full glass-card py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
                   <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground/30 mb-2">
                     <Bike size={40} strokeWidth={1} />
                   </div>
                   <div className="space-y-1">
                     <h3 className="text-xl font-bold text-foreground">Unit Tidak Tersedia</h3>
                     <p className="text-sm text-muted-foreground/60 font-medium max-w-xs mx-auto">Seluruh armada sedang dalam masa penyewaan aktif atau belum didaftarkan.</p>
                   </div>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-8">
          <Card className="glass-card border-border overflow-hidden">
            <CardHeader className="pb-6">
              <CardTitle className="text-lg font-semibold text-foreground">Aktivitas Transaksi</CardTitle>
              <CardDescription className="text-muted-foreground font-medium mt-1 text-xs">Rekam jejak komprehensif transaksi rental sepeda Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {rentals.length > 0 ? (
                <div className="divide-y divide-border">
                  {rentals.map((r) => {
                    const bike = bikes.find(b => b.id === r.bike_id)
                    return (
                    <div key={r.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6 group hover:bg-muted/50 transition-all">
                      <div className="flex items-start gap-5">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105",
                          r.status === 'Active' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                        )}>
                          {r.status === 'Active' ? <Clock size={28} strokeWidth={2} /> : <History size={28} strokeWidth={2} />}
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none",
                              r.status === 'Active' ? 'bg-blue-400/10 text-blue-400' : 'bg-green-400/10 text-green-400'
                            )}>
                              {r.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                             <div className="flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                               ID: <span className="text-foreground/60">{r.id.slice(0,8)}</span>
                             </div>
                             <p className="text-sm font-bold text-foreground tracking-tight">
                               {r.customer_name}
                             </p>
                             <p className="text-xs text-muted-foreground font-medium">
                               Paket: <span className="text-foreground/80">{r.rental_type === 'Short' ? 'Short-Term' : 'Daily'}</span> ({r.duration} {r.rental_type === 'Short' ? 'Jam' : 'Hari'})
                             </p>
                             <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                               <Bike size={10} className="text-primary/60" />
                               <span className="text-[10px] font-bold text-primary/80 uppercase tracking-tight">
                                 {bike ? `${bike.name} (${bike.brand})` : 'Unit Tidak Dikenal'}
                               </span>
                             </div>
                          </div>
                          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            <p className="flex items-center gap-2"><Clock size={12} className="text-primary/40" /> Mulai: <span className="text-muted-foreground/60">{new Date(r.start_time).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}</span></p>
                            {r.end_time && (
                              <p className="flex items-center gap-2"><Calendar size={12} className="text-primary/40" /> Selesai: <span className="text-muted-foreground/60">{new Date(r.end_time).toLocaleString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}</span></p>
                            )}
                          </div>
                          {r.identity_image_url && (
                            <a href={r.identity_image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-blue-400 hover:text-blue-500 transition-colors mt-3 py-1.5 px-3 rounded-lg bg-blue-400/5 border border-blue-400/10">
                              <Plus size={12} /> Lampiran Identitas
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 pl-14 lg:pl-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-border">
                        <div className="text-right">
                          <p className="font-black text-2xl text-foreground tracking-tighter">Rp {r.total_price.toLocaleString()}</p>
                          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Total</p>
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
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30 mb-4">
                    <History size={32} strokeWidth={1} />
                  </div>
                  <p className="text-muted-foreground/50 text-xs font-bold uppercase tracking-[0.2em] italic">Belum ada riwayat transaksi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rent Dialog */}
      <Dialog open={rentOpen} onOpenChange={setRentOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bike size={24} />
              </div>
              Proses Penyewaan: {selectedBike?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">Lengkapi data pelanggan di bawah untuk melakukan pendaftaran rental.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRentBike} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="customer" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Nama Lengkap Penyewa *</Label>
                  <Input 
                    id="customer" 
                    placeholder="Masukkan nama sesuai identitas resmi" 
                    required 
                    className="h-14 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                    value={rentalData.customer_name}
                    onChange={(e) => setRentalData({...rentalData, customer_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Nomor WhatsApp *</Label>
                    <Input 
                      id="phone" 
                      placeholder="0812xxxx" 
                      required 
                      className="h-14 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                      value={rentalData.customer_phone}
                      onChange={(e) => setRentalData({...rentalData, customer_phone: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Metode Identitas *</Label>
                    <div className="flex gap-2 p-1 bg-muted border border-border rounded-2xl h-14">
                      {['KTP', 'SIM', 'Paspor'].map(type => (
                        <button
                          key={type}
                          type="button"
                          className={cn(
                            "flex-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all",
                            rentalData.identity_type === type ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground/60 hover:text-foreground'
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
                  <Label htmlFor="idNumber" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Nomor Registrasi {rentalData.identity_type} *</Label>
                  <Input 
                    id="idNumber" 
                    placeholder={`Masukkan nomor seri ${rentalData.identity_type}`}
                    required 
                    className="h-14 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                    value={rentalData.identity_number}
                    onChange={(e) => setRentalData({...rentalData, identity_number: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Lokasi Domisili / Hotel / Menginap *</Label>
                  <Input 
                    id="address" 
                    placeholder="Alamat lengkap selama masa penyewaan" 
                    required 
                    className="h-14 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                    value={rentalData.customer_address}
                    onChange={(e) => setRentalData({...rentalData, customer_address: e.target.value})}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Paket Durasi *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      className={cn(
                        "h-16 rounded-2xl flex items-center justify-center gap-3 font-semibold uppercase text-[10px] tracking-wider border transition-all",
                        rentalData.rental_type === 'Short' ? 'bg-primary border-primary/20 text-primary-foreground shadow-lg' : 'bg-muted border-border text-muted-foreground/60 hover:bg-muted/80'
                      )}
                      onClick={() => setRentalData({...rentalData, rental_type: 'Short'})}
                    >
                      <Clock size={18} /> Short-Term
                    </button>
                    <button 
                      type="button" 
                      className={cn(
                        "h-16 rounded-2xl flex items-center justify-center gap-3 font-semibold uppercase text-[10px] tracking-wider border transition-all",
                        rentalData.rental_type === 'Long' ? 'bg-primary border-primary/20 text-primary-foreground shadow-lg' : 'bg-muted border-border text-muted-foreground/60 hover:bg-muted/80'
                      )}
                      onClick={() => setRentalData({...rentalData, rental_type: 'Long'})}
                    >
                      <Calendar size={18} /> Daily Rental
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">
                    Kuantitas ({rentalData.rental_type === 'Short' ? 'Jam' : 'Hari'})
                  </Label>
                  <Input 
                    id="duration" 
                    type="number"
                    min="1"
                    className="h-14 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                    value={rentalData.duration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (rentalData.rental_type === 'Short' && val > 3) {
                        setRentalData({ ...rentalData, rental_type: 'Long', duration: 1 });
                        toast.info("Durasi > 3 jam otomatis dialihkan ke paket harian (Daily)");
                      } else {
                        setRentalData({ ...rentalData, duration: val });
                      }
                    }}
                  />
                </div>

                <div className="grid gap-2">
                    <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Dokumentasi Identitas Resmi *</Label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-8 h-8 mb-3 text-muted-foreground/40" />
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                            {identityImage ? 'Identitas Siap' : 'Klik untuk Ambil / Unggah Foto'}
                          </p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setIdentityImage(e.target.files[0])} />
                      </label>
                    </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-primary/[0.03] border-t border-border mt-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                   <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider opacity-60">Estimasi Pembayaran</p>
                   <p className="text-xs font-medium text-primary italic">Sudah termasuk pajak & layanan</p>
                </div>
                <div className="text-3xl font-semibold text-foreground tracking-tight">
                  Rp {(rentalData.rental_type === 'Short' ? (selectedBike?.price_per_hour * rentalData.duration) : (selectedBike?.price_per_day * rentalData.duration))?.toLocaleString()}
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-semibold uppercase tracking-wider shadow-2xl hover:opacity-90 transition-all disabled:opacity-50 text-xs" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Konfirmasi & Proses Rental"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[90vh] glass border-border text-foreground p-8 text-center flex flex-col items-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
            <Trash2 size={32} />
          </div>
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-semibold text-center">Hapus Riwayat?</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-4 leading-relaxed text-center">
              Tindakan ini akan menghapus data rental secara permanen dari sistem. Apakah Anda yakin ingin melanjutkan?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-8 w-full">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl border border-border text-muted-foreground hover:bg-muted font-semibold" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button className="flex-1 h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold" onClick={handleDeleteRental} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
