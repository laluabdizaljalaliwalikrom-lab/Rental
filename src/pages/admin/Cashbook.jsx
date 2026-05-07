import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp, TrendingDown, Plus, Loader2, ArrowUpRight, ArrowDownRight, Calendar, User, Trash2, Edit } from 'lucide-react'
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/10 p-3 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
            <Wallet size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Buku Kas</h2>
            <p className="text-sm text-white/40">Kelola arus kas, pengeluaran operasional, dan pendapatan harian.</p>
          </div>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'staff') && (
          <Button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all uppercase tracking-widest text-[10px] px-6" onClick={() => setAddOpen(true)}>
            <Plus size={18} className="mr-2" />
            Catat Transaksi
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet size={80} strokeWidth={1.5} className="text-white" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Saldo Kas Akhir</p>
              <div className="text-3xl font-black text-blue-400 tracking-tighter">Rp {balance.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} strokeWidth={1.5} className="text-white" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Total Kas Masuk</p>
              <div className="text-3xl font-black text-green-400 tracking-tighter">Rp {totalDebit.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown size={80} strokeWidth={1.5} className="text-white" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Total Kas Keluar</p>
              <div className="text-3xl font-black text-red-400 tracking-tighter">Rp {totalCredit.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-white/5 overflow-hidden">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-bold text-white">Riwayat Transaksi Keuangan</CardTitle>
          <CardDescription className="text-white/40 font-medium mt-1 text-xs">Rekam jejak komprehensif seluruh aktivitas kas masuk dan keluar.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-white/10" />
            </div>
          ) : entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-y border-white/5">
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30">Waktu Transaksi</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30">Klasifikasi</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30">Rincian Deskripsi</th>
                    <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30">Nominal</th>
                    {profile?.role === 'admin' && <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] text-white/30 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="group hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3 text-white/50 font-medium">
                          <Calendar size={14} className="text-white/20" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">{new Date(entry.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {entry.type === 'debit' ? (
                          <Badge className="bg-green-500/10 text-green-400 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><ArrowUpRight size={10} className="mr-1.5" /> DEBIT</Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-400 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><ArrowDownRight size={10} className="mr-1.5" /> KREDIT</Badge>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-white tracking-tight">{entry.description}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                           {entry.reference_id && <Badge variant="outline" className="text-[8px] h-4 border-white/10 text-white/20 font-black uppercase px-1.5">SISTEM</Badge>}
                           <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest flex items-center gap-1.5">
                             <User size={10} className="opacity-50" /> {entry.created_by_name || 'Automated'}
                           </div>
                        </div>
                      </td>
                      <td className={cn(
                        "px-6 py-5 font-black text-base tracking-tighter",
                        entry.type === 'debit' ? 'text-green-400' : 'text-red-400'
                      )}>
                        {entry.type === 'debit' ? '+' : '-'} Rp {entry.amount.toLocaleString()}
                      </td>
                      {profile?.role === 'admin' && (
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5 transition-all" onClick={() => openEdit(entry)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/10 transition-all" onClick={() => { setSelectedEntry(entry); setDeleteOpen(true); }}>
                              <Trash2 size={14} />
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-full bg-white/5 p-8 mb-6 border border-white/5">
                <Wallet className="h-16 w-16 text-white/10" strokeWidth={1} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Belum ada aktivitas kas</h3>
              <p className="text-sm text-white/30 max-w-xs font-medium">
                Seluruh pencatatan kas masuk dan keluar akan tampil di panel ini secara mendetail.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Entry Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white p-0 overflow-hidden">
          <form onSubmit={handleEdit}>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-bold">Edit Transaksi Kas</DialogTitle>
              <DialogDescription className="text-white/40">
                Perbarui rincian nominal atau deskripsi transaksi terpilih.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-6 grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Jenis Klasifikasi</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Button 
                    type="button" 
                    variant="ghost"
                    className={cn(
                      "h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all",
                      editData.type === 'debit' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                    )}
                    onClick={() => setEditData({...editData, type: 'debit'})}
                  >
                    <ArrowUpRight size={14} className="mr-2" /> Debit
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost"
                    className={cn(
                      "h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all",
                      editData.type === 'credit' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                    )}
                    onClick={() => setEditData({...editData, type: 'credit'})}
                  >
                    <ArrowDownRight size={14} className="mr-2" /> Kredit
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Jumlah Nominal (Rp) *</Label>
                <Input 
                  id="edit-amount" 
                  type="number"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50"
                  placeholder="Contoh: 50000" 
                  value={editData.amount}
                  onChange={(e) => setEditData({...editData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Keterangan Transaksi *</Label>
                <Input 
                  id="edit-description" 
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50"
                  placeholder="Contoh: Pembelian suku cadang" 
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  required
                />
              </div>
            </div>
            <DialogFooter className="p-6 pt-2 bg-white/[0.02] border-t border-white/5">
              <Button type="button" variant="ghost" className="rounded-xl border border-white/10 text-white/40 hover:bg-white/5" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit" className="h-12 px-6 rounded-xl bg-white text-black font-black uppercase tracking-widest shadow-xl transition-all" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white p-0 overflow-hidden">
          <form onSubmit={handleAdd}>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl font-bold">Catat Transaksi Manual</DialogTitle>
              <DialogDescription className="text-white/40">
                Lakukan pencatatan manual untuk pemasukan atau pengeluaran operasional.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-6 grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Jenis Klasifikasi</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Button 
                    type="button" 
                    variant="ghost"
                    className={cn(
                      "h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all",
                      formData.type === 'debit' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                    )}
                    onClick={() => setFormData({...formData, type: 'debit'})}
                  >
                    <ArrowUpRight size={14} className="mr-2" /> Debit
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost"
                    className={cn(
                      "h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all",
                      formData.type === 'credit' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'
                    )}
                    onClick={() => setFormData({...formData, type: 'credit'})}
                  >
                    <ArrowDownRight size={14} className="mr-2" /> Kredit
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Jumlah Nominal (Rp) *</Label>
                <Input 
                  id="amount" 
                  type="number"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50"
                  placeholder="Contoh: 50000" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-[10px] uppercase font-bold tracking-widest text-white/40">Keterangan Transaksi *</Label>
                <Input 
                  id="description" 
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50"
                  placeholder="Contoh: Dana awal modal" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
            </div>
            <DialogFooter className="p-6 pt-2 bg-white/[0.02] border-t border-white/5">
              <Button type="button" variant="ghost" className="rounded-xl border border-white/10 text-white/40 hover:bg-white/5" onClick={() => setAddOpen(false)}>Batal</Button>
              <Button type="submit" className="h-12 px-6 rounded-xl bg-blue-600 text-white font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Transaksi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] glass border-white/10 text-white p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-red-500">
              <Trash2 size={24} /> Hapus Transaksi
            </DialogTitle>
            <DialogDescription className="text-white/40 pt-2">
              Apakah Anda yakin ingin menghapus data <strong className="text-white">{selectedEntry?.description}</strong> senilai <strong className="text-white">Rp {selectedEntry?.amount?.toLocaleString()}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            <p className="text-xs text-white/30 font-medium leading-relaxed">
              Tindakan ini tidak dapat dibatalkan dan akan langsung mempengaruhi akumulasi saldo akhir buku kas Anda.
            </p>
            {selectedEntry?.reference_id && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <p className="text-[11px] text-red-400 font-bold uppercase tracking-tight leading-normal">
                  Transaksi ini terhubung ke riwayat penyewaan. Menghapus transaksi ini juga akan menghapus data riwayat penyewaan terkait secara permanen.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 bg-white/[0.02] border-t border-white/5 gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl border border-white/10 text-white/40 hover:bg-white/5" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button variant="ghost" className="flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 transition-all" onClick={handleDeleteEntry} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
