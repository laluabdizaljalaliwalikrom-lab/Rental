import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bike, Loader2, Calendar, Clock, CreditCard, History, ListFilter, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Badge } from "@/components/ui/Badge"
import { apiFetch } from '@/lib/api'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <CreditCard size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Penyewaan</h2>
        </div>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-background/80 border border-white/10">
          <TabsTrigger value="available" className="flex items-center gap-2">
            <ListFilter size={16} /> Sewa Sepeda
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History size={16} /> Riwayat Rental
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bikes.filter(b => b.status === 'Available').length > 0 ? (
                bikes.filter(b => b.status === 'Available').map((bike) => (
                  <Card key={bike.id} className="overflow-hidden border-white/10 bg-background/80 group">
                    <div className="aspect-video w-full bg-muted flex items-center justify-center relative overflow-hidden">
                      {bike.image_url ? (
                        <img src={bike.image_url} alt={bike.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <Bike size={48} className="text-muted-foreground/20" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Tersedia</Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{bike.name}</CardTitle>
                      <CardDescription>{bike.brand} • {bike.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Per Jam</p>
                          <p className="font-bold">Rp {bike.price_per_hour.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Per Hari</p>
                          <p className="font-bold">Rp {bike.price_per_day.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button className="w-full gap-2" onClick={() => { setSelectedBike(bike); setRentOpen(true); }}>
                        <CreditCard size={16} /> Sewa Sekarang
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full border-white/10 bg-background/80 py-12 text-center">
                  <CardContent className="flex flex-col items-center">
                    <Bike size={48} className="text-muted-foreground/20 mb-4" />
                    <h3 className="text-lg font-medium">Tidak ada sepeda tersedia</h3>
                    <p className="text-sm text-muted-foreground">Semua armada sedang dipinjam atau belum ditambahkan.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="border-white/10 bg-background/80">
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>Daftar semua penyewaan sepeda.</CardDescription>
            </CardHeader>
            <CardContent>
              {rentals.length > 0 ? (
                <div className="space-y-4">
                  {rentals.map((r) => {
                    const bike = bikes.find(b => b.id === r.bike_id)
                    return (
                    <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${r.status === 'Active' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                          {r.status === 'Active' ? <Clock size={24} /> : <Calendar size={24} />}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-primary">{r.customer_name}</p>
                          {(r.customer_phone || r.identity_type) && (
                            <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                              {r.customer_phone && <span className="mr-2">📞 {r.customer_phone}</span>}
                              {r.identity_type && <span>💳 {r.identity_type}: {r.identity_number}</span>}
                            </p>
                          )}
                          <p className="text-sm font-medium mt-1">
                            Armada: {bike ? `${bike.name} (${bike.brand})` : `ID: ${r.bike_id.substring(0, 8)}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Paket: {r.rental_type === 'Short' ? 'Sewa Singkat' : 'Sewa Harian'} ({r.duration} {r.rental_type === 'Short' ? 'Jam' : 'Hari'})
                          </p>
                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <p className="flex items-center gap-1"><Clock size={12} /> Mulai: {new Date(r.start_time).toLocaleString('id-ID')}</p>
                            {r.end_time && (
                              <p className="flex items-center gap-1"><Calendar size={12} /> Selesai: {new Date(r.end_time).toLocaleString('id-ID')}</p>
                            )}
                            {r.customer_address && (
                              <p className="flex items-center gap-1 mt-1 break-all">📍 Alamat: {r.customer_address}</p>
                            )}
                            <p className="flex items-center gap-1 text-primary/70 mt-1"><User size={12} /> Diproses oleh: {r.processed_by_name || 'Sistem'}</p>
                            {r.identity_image_url && (
                              <a href={r.identity_image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline mt-1">
                                📎 Lihat Foto Identitas
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">Rp {r.total_price.toLocaleString()}</p>
                          <Badge variant={r.status === 'Active' ? 'default' : 'secondary'}>{r.status}</Badge>
                        </div>
                        {r.status === 'Active' && (
                          <Button size="sm" variant="outline" className="h-8 border-primary/20 hover:bg-primary/10" onClick={() => handleCompleteRental(r.id)}>
                            Selesaikan
                          </Button>
                        )}
                        {currentUser?.role === 'admin' && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => { setSelectedRental(r); setDeleteOpen(true); }}>
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Belum ada data transaksi.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rent Dialog */}
      <Dialog open={rentOpen} onOpenChange={setRentOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <form onSubmit={handleRentBike} className="flex flex-col min-h-0 flex-1">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Konfigurasi Rental</DialogTitle>
              <DialogDescription>
                Masukkan detail penyewaan untuk <strong>{selectedBike?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto flex-1 px-1">
              <div className="grid gap-2">
                <Label htmlFor="customer">Nama Lengkap Penyewa *</Label>
                <Input 
                  id="customer" 
                  placeholder="Sesuai Identitas" 
                  required 
                  value={rentalData.customer_name}
                  onChange={(e) => setRentalData({...rentalData, customer_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">No. WhatsApp *</Label>
                  <Input 
                    id="phone" 
                    placeholder="08123..." 
                    required 
                    value={rentalData.customer_phone}
                    onChange={(e) => setRentalData({...rentalData, customer_phone: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Jenis Identitas *</Label>
                  <div className="flex gap-2">
                    {['KTP', 'SIM', 'Paspor'].map(type => (
                      <Button
                        key={type}
                        type="button"
                        variant={rentalData.identity_type === type ? 'default' : 'outline'}
                        className={`flex-1 px-0 ${rentalData.identity_type === type ? 'bg-primary' : ''}`}
                        onClick={() => setRentalData({...rentalData, identity_type: type})}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="idNumber">Nomor {rentalData.identity_type} *</Label>
                <Input 
                  id="idNumber" 
                  placeholder={`Masukkan nomor ${rentalData.identity_type}`}
                  required 
                  value={rentalData.identity_number}
                  onChange={(e) => setRentalData({...rentalData, identity_number: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Alamat Domisili / Hotel *</Label>
                <Input 
                  id="address" 
                  placeholder="Alamat lengkap saat ini" 
                  required 
                  value={rentalData.customer_address}
                  onChange={(e) => setRentalData({...rentalData, customer_address: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="identityImage">Foto Identitas (Opsional)</Label>
                <Input 
                  id="identityImage" 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setIdentityImage(e.target.files[0])}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">Disarankan untuk keamanan tambahan.</p>
              </div>
              
              <div className="grid gap-2 mt-2">
                <Label>Mekanisme Sewa *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    type="button" 
                    variant={rentalData.rental_type === 'Short' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                    onClick={() => setRentalData({...rentalData, rental_type: 'Short'})}
                  >
                    <Clock size={16} /> Singkat (Jam)
                  </Button>
                  <Button 
                    type="button" 
                    variant={rentalData.rental_type === 'Long' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                    onClick={() => setRentalData({...rentalData, rental_type: 'Long'})}
                  >
                    <Calendar size={16} /> Panjang (Hari)
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">
                  Durasi ({rentalData.rental_type === 'Short' ? 'Jam' : 'Hari'})
                </Label>
                <Input 
                  id="duration" 
                  type="number" 
                  min="1"
                  required
                  value={rentalData.duration || ''}
                  onChange={(e) => setRentalData({...rentalData, duration: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                />
              </div>

              <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Estimasi Biaya</p>
                  <p className="text-2xl font-bold text-primary">
                    Rp {(((rentalData.rental_type === 'Short' 
                      ? (selectedBike?.price_per_hour || 0) 
                      : (selectedBike?.price_per_day || 0)) * (rentalData.duration || 0)) || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 pt-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi Penyewaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 size={20} /> Hapus Riwayat Rental
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus catatan penyewaan atas nama <strong>{selectedRental?.customer_name}</strong> secara permanen?
              {selectedRental?.status === 'Active' && " Perhatian: Karena statusnya masih Aktif, menghapus riwayat ini akan otomatis mengembalikan status sepeda menjadi Tersedia."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteRental} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ya, Hapus Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
