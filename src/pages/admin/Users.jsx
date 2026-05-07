import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users as UsersIcon, UserPlus, Loader2, Edit, Shield, User, Mail, Calendar, Trash2, Key } from 'lucide-react'
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

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  
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

  const { profile: currentUser } = useAuth()

  useEffect(() => {
    // Inline fetch for initial load prevents React Compiler TDZ and strict linter warnings
    apiFetch('/api/profiles/')
      .then(data => setUsers(data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  const loadUsers = () => {
    apiFetch('/api/profiles/')
      .then(data => setUsers(data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    
    if (selectedUser.id === currentUser?.id && formData.role !== selectedUser.role) {
       toast.error("Anda tidak bisa mengubah role Anda sendiri")
       return
    }

    try {
      setSubmitting(true)
      await apiFetch(`/api/profiles/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })
      toast.success('Data pengguna berhasil diperbarui')
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
    if (!addFormData.email || !addFormData.password || !addFormData.full_name) {
      toast.error("Semua kolom harus diisi")
      return
    }
    
    try {
      setSubmitting(true)
      await apiFetch('/api/profiles/', {
        method: 'POST',
        body: JSON.stringify(addFormData)
      })
      toast.success('Pengguna baru berhasil ditambahkan')
      setAddOpen(false)
      setAddFormData({ email: '', password: '', full_name: '', role: 'viewer' })
      loadUsers()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    
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

  const openEdit = (u) => {
    setSelectedUser(u)
    setFormData({
      full_name: u.full_name || '',
      role: u.role
    })
    setEditOpen(true)
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">Admin</Badge>
      case 'staff': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">Staff</Badge>
      default: return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20">Viewer</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <UsersIcon size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Pengguna</h2>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setAddOpen(true)}>
          <UserPlus size={18} />
          Tambah User
        </Button>
      </div>

      <Card className="border-white/10 bg-background/80">
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Kelola peran dan akses setiap akun di dalam sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[200px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length > 0 ? (
            <div className="rounded-md border border-white/10 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-medium">Pengguna</th>
                    <th className="px-6 py-4 font-medium">Kontak</th>
                    <th className="px-6 py-4 font-medium">Role Akses</th>
                    <th className="px-6 py-4 font-medium">Terdaftar</th>
                    <th className="px-6 py-4 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 bg-background/40 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : <User size={18} />}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{u.full_name || 'Tanpa Nama'}</div>
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] text-primary font-bold">(Anda)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail size={14} />
                          {u.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {new Date(u.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} className="hover:text-primary">
                          <Edit size={16} />
                        </Button>
                        {u.id !== currentUser?.id && (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(u); setDeleteOpen(true); }} className="hover:text-red-500 text-muted-foreground">
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed border-white/10">
              <div className="rounded-full bg-muted p-6 mb-4">
                <UsersIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Belum ada data pengguna</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-2">
                Tidak ada pengguna lain selain Anda di sistem ini.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>
                Ubah nama lengkap atau hak akses (role) untuk <strong>{selectedUser?.email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullname">Nama Lengkap</Label>
                <Input 
                  id="fullname" 
                  placeholder="Nama Lengkap Pengguna" 
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Role (Hak Akses)</Label>
                <div className="flex flex-col gap-2 mt-1">
                  <Button 
                    type="button" 
                    variant={formData.role === 'admin' ? 'default' : 'outline'}
                    className={formData.role === 'admin' ? 'bg-red-500 hover:bg-red-600 text-white border-transparent' : 'justify-start'}
                    onClick={() => setFormData({...formData, role: 'admin'})}
                    disabled={selectedUser?.id === currentUser?.id}
                  >
                    <Shield size={16} className="mr-2" /> Admin (Akses Penuh)
                  </Button>
                  <Button 
                    type="button" 
                    variant={formData.role === 'staff' ? 'default' : 'outline'}
                    className={formData.role === 'staff' ? 'bg-blue-500 hover:bg-blue-600 text-white border-transparent' : 'justify-start'}
                    onClick={() => setFormData({...formData, role: 'staff'})}
                    disabled={selectedUser?.id === currentUser?.id}
                  >
                    <User size={16} className="mr-2" /> Staff (Kasir / Operator)
                  </Button>
                  <Button 
                    type="button" 
                    variant={formData.role === 'viewer' ? 'default' : 'outline'}
                    className={formData.role === 'viewer' ? 'bg-gray-500 hover:bg-gray-600 text-white border-transparent' : 'justify-start'}
                    onClick={() => setFormData({...formData, role: 'viewer'})}
                    disabled={selectedUser?.id === currentUser?.id}
                  >
                    <UsersIcon size={16} className="mr-2" /> Viewer (Hanya Lihat)
                  </Button>
                </div>
                {selectedUser?.id === currentUser?.id && (
                  <p className="text-xs text-muted-foreground mt-1 text-orange-400">
                    * Anda tidak dapat mengubah hak akses Anda sendiri.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Buat akun baru. Password akan diset secara manual di sini.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-email">Alamat Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="add-email" 
                    type="email"
                    placeholder="nama@email.com" 
                    className="pl-9"
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-password">Password Sementara</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="add-password" 
                    type="password"
                    placeholder="Minimal 6 karakter" 
                    className="pl-9"
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-fullname">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="add-fullname" 
                    placeholder="Nama Lengkap" 
                    className="pl-9"
                    value={addFormData.full_name}
                    onChange={(e) => setAddFormData({...addFormData, full_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2 mt-2">
                <Label>Role (Hak Akses)</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Button 
                    type="button" 
                    variant={addFormData.role === 'admin' ? 'default' : 'outline'}
                    className={addFormData.role === 'admin' ? 'bg-red-500 hover:bg-red-600' : ''}
                    onClick={() => setAddFormData({...addFormData, role: 'admin'})}
                  >
                    Admin
                  </Button>
                  <Button 
                    type="button" 
                    variant={addFormData.role === 'staff' ? 'default' : 'outline'}
                    className={addFormData.role === 'staff' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    onClick={() => setAddFormData({...addFormData, role: 'staff'})}
                  >
                    Staff
                  </Button>
                  <Button 
                    type="button" 
                    variant={addFormData.role === 'viewer' ? 'default' : 'outline'}
                    className={addFormData.role === 'viewer' ? 'bg-gray-500 hover:bg-gray-600' : ''}
                    onClick={() => setAddFormData({...addFormData, role: 'viewer'})}
                  >
                    Viewer
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Buat Akun
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
              <Trash2 size={20} /> Hapus Pengguna
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun <strong>{selectedUser?.email}</strong> secara permanen?
              Tindakan ini tidak dapat dibatalkan dan pengguna tidak akan bisa login lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={submitting}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Ya, Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
