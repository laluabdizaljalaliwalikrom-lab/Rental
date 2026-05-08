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
    // Inline fetch prevents React Compiler from falsely detecting synchronous state updates
    apiFetch('/api/cashbook/')
      .then(data => setEntries(data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
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
          <div className="rounded-2xl bg-primary/10 p-3 text-primary border border-primary/20">
            <Wallet size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Buku Kas</h2>
            <p className="text-sm text-muted-foreground">Kelola arus kas, pengeluaran operasional, dan pendapatan harian.</p>
          </div>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'staff') && (
          <Button className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all uppercase tracking-wider text-[10px] px-6" onClick={() => setAddOpen(true)}>
            <Plus size={18} className="mr-2" />
            Catat Transaksi
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wallet size={80} strokeWidth={1.5} className="text-foreground" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Saldo Kas Akhir</p>
              <div className="text-2xl font-bold text-primary tracking-tight">Rp {balance.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={80} strokeWidth={1.5} className="text-foreground" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Kas Masuk</p>
              <div className="text-2xl font-bold text-green-400 tracking-tight">Rp {totalDebit.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingDown size={80} strokeWidth={1.5} className="text-foreground" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Kas Keluar</p>
              <div className="text-2xl font-bold text-red-400 tracking-tight">Rp {totalCredit.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border overflow-hidden">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-semibold text-foreground">Riwayat Transaksi Keuangan</CardTitle>
          <CardDescription className="text-muted-foreground font-medium mt-1 text-xs">Rekam jejak komprehensif seluruh aktivitas kas masuk dan keluar.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
            </div>
          ) : entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-muted/50 border-y border-border">
                    <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Waktu Transaksi</th>
                    <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Klasifikasi</th>
                    <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Rincian Deskripsi</th>
                    <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Nominal</th>
                    {profile?.role === 'admin' && <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="group hover:bg-muted/20 transition-all border-b border-border last:border-0">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3 text-muted-foreground font-medium">
                          <Calendar size={14} className="text-muted-foreground/40" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider">{new Date(entry.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {entry.type === 'debit' ? (
                          <Badge className="bg-green-500/10 text-green-400 border-none px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider"><ArrowUpRight size={10} className="mr-1.5" /> DEBIT</Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-400 border-none px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider"><ArrowDownRight size={10} className="mr-1.5" /> KREDIT</Badge>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-foreground tracking-tight">{entry.description}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          {entry.reference_id && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary font-semibold uppercase px-1.5">SISTEM</Badge>}
                          <div className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider flex items-center gap-1.5">
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
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all" onClick={() => openEdit(entry)}>
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
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-2">
                <Wallet className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs font-medium italic">
                Belum ada rekaman transaksi keuangan yang tersedia untuk periode ini.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Entry Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Edit size={24} />
              </div>
              Edit Detail Transaksi
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Perbarui rincian transaksi kas yang telah tercatat sebelumnya.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Jenis Klasifikasi</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-12 rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all",
                      editData.type === 'debit' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setEditData({ ...editData, type: 'debit' })}
                  >
                    <ArrowUpRight size={14} className="mr-2" /> Debit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-12 rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all",
                      editData.type === 'credit' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setEditData({ ...editData, type: 'credit' })}
                  >
                    <ArrowDownRight size={14} className="mr-2" /> Kredit
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Jumlah Nominal (Rp) *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-14 rounded-2xl focus:ring-primary/50 transition-all"
                  placeholder="Contoh: 50000"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Keterangan Transaksi *</Label>
                <Input
                  id="edit-description"
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-14 rounded-2xl focus:ring-primary/50 transition-all"
                  placeholder="Contoh: Pembelian suku cadang"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/50 border-t border-border">
              <Button type="button" variant="ghost" className="rounded-xl border border-border text-muted-foreground hover:bg-muted font-semibold uppercase tracking-wider text-[10px] h-12 px-6" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit" className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold uppercase tracking-wider shadow-xl transition-all text-[10px]" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Entry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Plus size={24} />
              </div>
              Catat Transaksi Manual
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Lakukan pencatatan manual untuk pemasukan atau pengeluaran operasional.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Jenis Klasifikasi</Label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-12 rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all",
                      formData.type === 'debit' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setFormData({ ...formData, type: 'debit' })}
                  >
                    <ArrowUpRight size={14} className="mr-2" /> Debit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-12 rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all",
                      formData.type === 'credit' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setFormData({ ...formData, type: 'credit' })}
                  >
                    <ArrowDownRight size={14} className="mr-2" /> Kredit
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Jumlah Nominal (Rp) *</Label>
                <Input
                  id="amount"
                  type="number"
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-14 rounded-2xl focus:ring-primary/50 transition-all"
                  placeholder="Contoh: 50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Keterangan Transaksi *</Label>
                <Input
                  id="description"
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-14 rounded-2xl focus:ring-primary/50 transition-all"
                  placeholder="Contoh: Dana awal modal"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/50 border-t border-border">
              <Button type="button" variant="ghost" className="rounded-xl border border-border text-muted-foreground hover:bg-muted font-semibold uppercase tracking-wider text-[10px] h-12 px-6" onClick={() => setAddOpen(false)}>Batal</Button>
              <Button type="submit" className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold uppercase tracking-wider shadow-xl transition-all text-[10px]" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Transaksi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-red-500/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3 text-red-500">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              Hapus Transaksi?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Tindakan ini akan menghapus catatan kas secara permanen. Apakah Anda yakin?
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {selectedEntry?.reference_id && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <p className="text-[11px] text-red-400 font-semibold uppercase tracking-tight leading-normal">
                  Transaksi ini terhubung ke riwayat penyewaan. Menghapus transaksi ini juga akan menghapus data riwayat penyewaan terkait secara permanen.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-4 p-8 bg-muted/50 border-t border-border">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl border border-border text-muted-foreground hover:bg-muted font-semibold uppercase tracking-wider text-[10px]" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button className="flex-1 h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold uppercase tracking-wider text-[10px]" onClick={handleDeleteEntry} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus Permanen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
