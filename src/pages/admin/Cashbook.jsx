import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp, TrendingDown, Plus, Loader2, ArrowUpRight, ArrowDownRight, Calendar, User, Trash2, Edit } from 'lucide-react'
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

export default function Cashbook() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { profile } = useAuth()
  
  const [formData, setFormData] = useState({
    type: 'debit',
    amount: '',
    description: ''
  })

  const [editData, setEditData] = useState({
    id: '',
    type: 'debit',
    amount: '',
    description: ''
  })

  const loadData = () => {
    apiFetch('/api/cashbook/')
      .then(data => setEntries(data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.description) {
      toast.error("Silakan isi jumlah dan deskripsi")
      return
    }
    
    try {
      setSubmitting(true)
      await apiFetch('/api/cashbook/', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      })
      toast.success('Pencatatan kas berhasil ditambahkan')
      setAddOpen(false)
      setFormData({ type: 'debit', amount: '', description: '' })
      loadData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return
    const hasLinkedRental = !!selectedEntry.reference_id
    try {
      setSubmitting(true)
      await apiFetch(`/api/cashbook/${selectedEntry.id}`, {
        method: 'DELETE'
      })
      if (hasLinkedRental) {
        toast.success('Transaksi kas dan riwayat penyewaan terkait berhasil dihapus')
      } else {
        toast.success('Transaksi kas berhasil dihapus')
      }
      setDeleteOpen(false)
      loadData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (entry) => {
    setEditData({
      id: entry.id,
      type: entry.type,
      amount: entry.amount.toString(),
      description: entry.description
    })
    setEditOpen(true)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editData.amount || !editData.description) {
      toast.error("Silakan isi jumlah dan deskripsi")
      return
    }
    
    try {
      setSubmitting(true)
      await apiFetch(`/api/cashbook/${editData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          type: editData.type,
          description: editData.description,
          amount: parseFloat(editData.amount)
        })
      })
      toast.success('Transaksi kas berhasil diperbarui')
      setEditOpen(false)
      loadData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const totalDebit = entries.filter(e => e.type === 'debit').reduce((acc, curr) => acc + curr.amount, 0)
  const totalCredit = entries.filter(e => e.type === 'credit').reduce((acc, curr) => acc + curr.amount, 0)
  const balance = totalDebit - totalCredit

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Wallet size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Buku Kas</h2>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'staff') && (
          <Button className="flex items-center gap-2" onClick={() => setAddOpen(true)}>
            <Plus size={18} />
            Catat Transaksi
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-background/80 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Saldo Kas</p>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">Rp {balance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/80 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Kas Masuk (Debit)</p>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">Rp {totalDebit.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-background/80 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Total Kas Keluar (Kredit)</p>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500">Rp {totalCredit.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-background/80">
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
          <CardDescription>
            Rekam jejak semua kas masuk dan kas keluar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : entries.length > 0 ? (
            <div className="rounded-md border border-white/10 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-medium">Tanggal</th>
                    <th className="px-6 py-4 font-medium">Tipe</th>
                    <th className="px-6 py-4 font-medium">Deskripsi</th>
                    <th className="px-6 py-4 font-medium">Jumlah</th>
                    {profile?.role === 'admin' && <th className="px-6 py-4 font-medium text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-white/5 bg-background/40 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(entry.created_at).toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {entry.type === 'debit' ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><TrendingUp size={12} className="mr-1" /> Masuk</Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><TrendingDown size={12} className="mr-1" /> Keluar</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {entry.description}
                        {entry.reference_id && <span className="ml-2 text-[10px] text-muted-foreground">(Auto)</span>}
                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <User size={10} /> Diproses oleh: {entry.created_by_name || 'Sistem'}
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-bold ${entry.type === 'debit' ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.type === 'debit' ? '+' : '-'} Rp {entry.amount.toLocaleString()}
                      </td>
                      {profile?.role === 'admin' && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => openEdit(entry)}>
                              <Edit size={16} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10" onClick={() => { setSelectedEntry(entry); setDeleteOpen(true); }}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed border-white/10">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Wallet className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Belum ada transaksi</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2">
                Pencatatan kas akan muncul di sini.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Entry Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Transaksi Kas</DialogTitle>
              <DialogDescription>
                Perbarui detail transaksi kas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Jenis Transaksi</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button 
                    type="button" 
                    variant={editData.type === 'debit' ? 'default' : 'outline'}
                    className={editData.type === 'debit' ? 'bg-green-500 hover:bg-green-600 border-transparent' : ''}
                    onClick={() => setEditData({...editData, type: 'debit'})}
                  >
                    <ArrowUpRight size={16} className="mr-2" /> Kas Masuk
                  </Button>
                  <Button 
                    type="button" 
                    variant={editData.type === 'credit' ? 'default' : 'outline'}
                    className={editData.type === 'credit' ? 'bg-red-500 hover:bg-red-600 border-transparent' : ''}
                    onClick={() => setEditData({...editData, type: 'credit'})}
                  >
                    <ArrowDownRight size={16} className="mr-2" /> Kas Keluar
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Jumlah (Rp)</Label>
                <Input 
                  id="edit-amount" 
                  type="number"
                  placeholder="Contoh: 50000" 
                  value={editData.amount}
                  onChange={(e) => setEditData({...editData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Keterangan</Label>
                <Input 
                  id="edit-description" 
                  placeholder="Contoh: Beli ban dalam Polygon" 
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Perbarui Transaksi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Catat Transaksi Manual</DialogTitle>
              <DialogDescription>
                Masukkan uang masuk tambahan atau catat pengeluaran.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Jenis Transaksi</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button 
                    type="button" 
                    variant={formData.type === 'debit' ? 'default' : 'outline'}
                    className={formData.type === 'debit' ? 'bg-green-500 hover:bg-green-600 border-transparent' : ''}
                    onClick={() => setFormData({...formData, type: 'debit'})}
                  >
                    <ArrowUpRight size={16} className="mr-2" /> Kas Masuk
                  </Button>
                  <Button 
                    type="button" 
                    variant={formData.type === 'credit' ? 'default' : 'outline'}
                    className={formData.type === 'credit' ? 'bg-red-500 hover:bg-red-600 border-transparent' : ''}
                    onClick={() => setFormData({...formData, type: 'credit'})}
                  >
                    <ArrowDownRight size={16} className="mr-2" /> Kas Keluar
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Jumlah (Rp)</Label>
                <Input 
                  id="amount" 
                  type="number"
                  placeholder="Contoh: 50000" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Keterangan</Label>
                <Input 
                  id="description" 
                  placeholder="Contoh: Beli ban dalam Polygon" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Transaksi
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
              <Trash2 size={20} /> Hapus Transaksi Kas
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <p>
                  Apakah Anda yakin ingin menghapus data <strong>{selectedEntry?.description}</strong> senilai Rp {selectedEntry?.amount?.toLocaleString()}?
                  Tindakan ini tidak dapat dibatalkan dan akan mengubah saldo akhir buku kas Anda.
                </p>
                {selectedEntry?.reference_id && (
                  <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    ⚠️ <strong>Perhatian:</strong> Transaksi ini terhubung ke riwayat penyewaan. Menghapus transaksi ini juga akan <strong>menghapus data riwayat penyewaan</strong> terkait secara permanen.
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteEntry} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ya, Hapus Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
