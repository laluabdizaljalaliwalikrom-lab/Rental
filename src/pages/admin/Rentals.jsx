import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bike, Loader2, Calendar, Clock, CreditCard, History, ListFilter } from 'lucide-react'
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
} from "@/components/ui/dialog"
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
  const [submitting, setSubmitting] = useState(false)
  const [selectedBike, setSelectedBike] = useState(null)
  
  const [rentalData, setRentalData] = useState({
    customer_name: '',
    rental_type: 'Short',
    duration: 1
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [bikesRes, rentalsRes] = await Promise.all([
        fetch('/api/fleet/'),
        fetch('/api/rentals/')
      ])
      
      if (!bikesRes.ok || !rentalsRes.ok) throw new Error('Gagal mengambil data')
      
      const bikesData = await bikesRes.json()
      const rentalsData = await rentalsRes.json()
      
      setBikes(bikesData)
      setRentals(rentalsData)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRentBike = async (e) => {
    e.preventDefault()
    if (!selectedBike) return

    const totalPrice = rentalData.rental_type === 'Short' 
      ? selectedBike.price_per_hour * rentalData.duration 
      : selectedBike.price_per_day * rentalData.duration

    try {
      setSubmitting(true)
      const response = await fetch('/api/rentals/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bike_id: selectedBike.id,
          customer_name: rentalData.customer_name,
          rental_type: rentalData.rental_type,
          duration: rentalData.duration,
          total_price: totalPrice
        })
      })

      if (!response.ok) throw new Error('Gagal memproses rental')
      
      toast.success(`Rental berhasil! Total: Rp ${totalPrice.toLocaleString()}`)
      setRentOpen(false)
      setRentalData({ customer_name: '', rental_type: 'Short', duration: 1 })
      fetchData()
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
      const response = await fetch(`/api/rentals/${id}/complete`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Gagal menyelesaikan rental')
      toast.success('Rental telah selesai')
      fetchData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
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
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-background/60 backdrop-blur-xl border border-white/10">
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
                  <Card key={bike.id} className="overflow-hidden border-white/10 bg-background/60 backdrop-blur-xl group">
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
                <Card className="col-span-full border-white/10 bg-background/60 backdrop-blur-xl py-12 text-center">
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
          <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>Daftar semua penyewaan sepeda.</CardDescription>
            </CardHeader>
            <CardContent>
              {rentals.length > 0 ? (
                <div className="space-y-4">
                  {rentals.map((r) => (
                    <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${r.status === 'Active' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                          {r.status === 'Active' ? <Clock size={24} /> : <Calendar size={24} />}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{r.customer_name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID Sepeda: {r.bike_id.substring(0, 8)}... • {r.rental_type} ({r.duration} {r.rental_type === 'Short' ? 'Jam' : 'Hari'})
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Mulai: {new Date(r.start_time).toLocaleString()}
                          </p>
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
                      </div>
                    </div>
                  ))}
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleRentBike}>
            <DialogHeader>
              <DialogTitle>Konfigurasi Rental</DialogTitle>
              <DialogDescription>
                Masukkan detail penyewaan untuk <strong>{selectedBike?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Nama Penyewa</Label>
                <Input 
                  id="customer" 
                  placeholder="Nama Lengkap" 
                  required 
                  value={rentalData.customer_name}
                  onChange={(e) => setRentalData({...rentalData, customer_name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Mekanisme Sewa</Label>
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
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Konfirmasi Penyewaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
