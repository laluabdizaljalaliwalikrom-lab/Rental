import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Loader2,
  Shield,
  User,
  Mail,
  Trash2,
  Edit,
  Key,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion
} from 'lucide-react'
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
} from "@/components/ui/dialog"

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { profile: currentUser } = useAuth()

  const [formData, setFormData] = useState({
    full_name: '',
    role: 'viewer'
  })

  const [addFormData, setAddFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'viewer'
  })

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await apiFetch('/api/profiles/')
      setUsers(data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Inline fetch prevents React Compiler from falsely detecting synchronous state updates
    apiFetch('/api/profiles/')
      .then(data => setUsers(data))
      .catch(error => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await apiFetch(`/api/profiles/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      toast.success('Pengguna berhasil diperbarui')
      setEditOpen(false)
      loadUsers()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await apiFetch('/api/profiles/', {
        method: 'POST',
        body: JSON.stringify(addFormData)
      })
      toast.success('Pengguna baru berhasil ditambahkan')
      setAddOpen(false)
      setAddFormData({ email: '', password: '', full_name: '', role: 'viewer' })
      setLoading(true)
      apiFetch('/api/profiles/')
        .then(data => setUsers(data))
        .catch(error => toast.error(error.message))
        .finally(() => setLoading(false))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSubmitting(true)
      await apiFetch(`/api/profiles/${selectedUser.id}`, {
        method: 'DELETE'
      })
      toast.success('Pengguna berhasil dihapus')
      setDeleteOpen(false)
      loadUsers()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (user) => {
    setSelectedUser(user)
    setFormData({
      full_name: user.full_name || '',
      role: user.role
    })
    setEditOpen(true)
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase()))
  )

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-500 text-white border-none px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-lg shadow-red-500/20"><ShieldCheck size={10} className="mr-1.5" /> SUPER ADMIN</Badge>
      case 'staff': return <Badge className="bg-blue-500 text-white border-none px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-lg shadow-blue-500/20"><ShieldAlert size={10} className="mr-1.5" /> STAFF OPERATOR</Badge>
      default: return <Badge className="bg-gray-500 text-white border-none px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-lg shadow-gray-500/20"><ShieldQuestion size={10} className="mr-1.5" /> VIEWER ONLY</Badge>
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary border border-primary/20">
            <UsersIcon size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Manajemen Pengguna</h2>
            <p className="text-sm text-muted-foreground">Kelola hak akses, tim admin, dan pantau aktivitas akun.</p>
          </div>
        </div>

        {currentUser?.role === 'admin' && (
          <Button onClick={() => setAddOpen(true)} className="h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all uppercase tracking-wider text-[10px] px-6">
            <UserPlus size={18} className="mr-2" />
            Tambah Akun
          </Button>
        )}
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 h-5 w-5 group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Cari email atau nama lengkap pengguna..."
          className="h-14 pl-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/40 rounded-2xl focus:ring-primary/50 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        <Card className="glass-card border-border overflow-hidden">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg font-semibold text-foreground tracking-tight">Daftar Akun Terdaftar</CardTitle>
            <CardDescription className="text-muted-foreground font-medium mt-1 text-xs">Informasi lengkap seluruh personel yang memiliki akses ke sistem.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-muted/50 border-y border-border">
                      <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Identitas Pengguna</th>
                      <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Level Akses</th>
                      <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Terakhir Update</th>
                      <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-muted-foreground text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="group hover:bg-muted/20 transition-all border-b border-border last:border-0">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-semibold border border-primary/10">
                              {user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground tracking-tight flex items-center gap-2">
                                {user.full_name || 'Tanpa Nama'}
                                {user.id === currentUser?.id && <Badge variant="outline" className="text-[8px] h-4 border-primary/20 text-primary font-semibold uppercase px-1.5">SAYA</Badge>}
                              </div>
                              <div className="text-[11px] text-muted-foreground/60 font-medium">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/40">
                            {new Date(user.updated_at || user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all" onClick={() => openEdit(user)}>
                              <Edit size={14} />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/10 transition-all" onClick={() => { setSelectedUser(user); setDeleteOpen(true); }}>
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Edit size={24} />
              </div>
              Edit Detail Pengguna
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Ubah rincian identitas atau level akses untuk <span className="text-primary font-semibold">{selectedUser?.email}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="fullname" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Nama Lengkap Personel *</Label>
                <Input
                  id="fullname"
                  placeholder="Masukkan nama lengkap"
                  className="bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-14 rounded-2xl focus:ring-primary/50 transition-all"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Level Hak Akses (Role)</Label>
                <div className="flex flex-col gap-3 mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-14 rounded-2xl font-semibold uppercase text-[10px] tracking-wider transition-all justify-start px-5",
                      formData.role === 'admin' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    disabled={selectedUser?.id === currentUser?.id}
                  >
                    <Shield size={16} className="mr-3" /> Super Admin (Akses Penuh)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-14 rounded-2xl font-semibold uppercase text-[10px] tracking-wider transition-all justify-start px-5",
                      formData.role === 'staff' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setFormData({ ...formData, role: 'staff' })}
                    disabled={selectedUser?.id === currentUser?.id}
                  >
                    <User size={16} className="mr-3" /> Staff Operator (Kasir)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-14 rounded-2xl font-semibold uppercase text-[10px] tracking-wider transition-all justify-start px-5",
                      formData.role === 'viewer' ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setFormData({ ...formData, role: 'viewer' })}
                    disabled={selectedUser?.id === currentUser?.id}
                  >
                    <UsersIcon size={16} className="mr-3" /> Viewer (Hanya Lihat)
                  </Button>
                </div>
                {selectedUser?.id === currentUser?.id && (
                  <p className="text-[10px] text-orange-500 mt-2 font-semibold italic">
                    * Hak akses sendiri tidak dapat diubah untuk keamanan sistem.
                  </p>
                )}
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

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] glass border-border text-foreground p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-primary/[0.02] border-b border-border/50">
            <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UserPlus size={24} />
              </div>
              Daftarkan Akun Baru
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Buat akses personel baru. Password harus terdiri dari minimal 6 karakter.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="add-email" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Alamat Email Resmi *</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="add-email"
                    type="email"
                    placeholder="nama@email.com"
                    className="pl-12 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-14 rounded-2xl focus:ring-primary/50 transition-all"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-password" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Kata Sandi (Password) *</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="add-password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    className="pl-12 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-14 rounded-2xl focus:ring-primary/50 transition-all"
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-fullname" className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Nama Lengkap Personel *</Label>
                <div className="relative">
                  <User className="absolute left-4 top-4.5 h-4 w-4 text-muted-foreground/40" />
                  <Input
                    id="add-fullname"
                    placeholder="Masukkan nama lengkap"
                    className="pl-12 bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/30 h-14 rounded-2xl focus:ring-primary/50 transition-all"
                    value={addFormData.full_name}
                    onChange={(e) => setAddFormData({ ...addFormData, full_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">Level Hak Akses (Role)</Label>
                <div className="grid grid-cols-3 gap-3 mt-1">
                   <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-12 rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all",
                      addFormData.role === 'admin' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setAddFormData({ ...addFormData, role: 'admin' })}
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-12 rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all",
                      addFormData.role === 'staff' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setAddFormData({ ...addFormData, role: 'staff' })}
                  >
                    Staff
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-12 rounded-xl font-semibold uppercase text-[10px] tracking-wider transition-all",
                      addFormData.role === 'viewer' ? 'bg-gray-500 text-white shadow-lg shadow-gray-500/20' : 'bg-muted/40 text-muted-foreground border border-border hover:bg-muted/80'
                    )}
                    onClick={() => setAddFormData({ ...addFormData, role: 'viewer' })}
                  >
                    Viewer
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/50 border-t border-border">
              <Button type="button" variant="ghost" className="rounded-xl border border-border text-muted-foreground hover:bg-muted font-semibold uppercase tracking-wider text-[10px] h-12 px-6" onClick={() => setAddOpen(false)}>Batal</Button>
              <Button type="submit" className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold uppercase tracking-wider shadow-xl transition-all text-[10px]" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Daftarkan Sekarang
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
              Hapus Akses Personel?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium pt-1">
              Apakah Anda yakin ingin menghapus akun <span className="text-red-500 font-semibold">{selectedUser?.email}</span> secara permanen?
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 py-6 flex-1 overflow-y-auto custom-scrollbar">
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider leading-relaxed bg-muted/30 p-4 rounded-2xl border border-border">
              Tindakan ini tidak dapat dibatalkan. Pengguna yang dihapus akan segera kehilangan seluruh akses ke dasbor dan sistem admin.
            </p>
          </div>
          <div className="flex gap-4 p-8 bg-muted/50 border-t border-border">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl border border-border text-muted-foreground hover:bg-muted font-semibold uppercase tracking-wider text-[10px]" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button className="flex-1 h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold uppercase tracking-wider text-[10px]" onClick={handleDelete} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ya, Hapus Akun"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
