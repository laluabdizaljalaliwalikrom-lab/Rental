import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Mail, Phone, Lock, User, Loader2, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { supabase } from '@/lib/supabase'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    avatar_url: profile?.avatar_url || ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      
      // 1. Update email if changed (via Supabase Auth)
      if (formData.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (authError) throw authError
        toast.info("Email konfirmasi telah dikirim ke alamat baru Anda.")
      }

      // 2. Update metadata via API (and email for sync)
      await apiFetch('/api/profiles/me/', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email
        })
      })

      await refreshProfile()
      toast.success("Profil berhasil diperbarui")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAvatar = async (e) => {
    try {
      const file = e.target.files[0]
      if (!file) return

      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      // 3. Save to database via API
      await apiFetch('/api/profiles/me/', {
        method: 'PUT',
        body: JSON.stringify({ avatar_url: publicUrl })
      })

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
      await refreshProfile()
      toast.success("Foto profil diperbarui")
    } catch (error) {
      toast.error("Gagal mengunggah foto: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Konfirmasi password tidak cocok")
    }

    try {
      setLoading(true)
      
      // 1. Verifikasi Password Saat Ini (Re-authentication)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwordData.currentPassword
      })

      if (signInError) {
        throw new Error("Password saat ini salah. Verifikasi gagal.")
      }

      // 2. Update ke Password Baru
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      if (error) throw error
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success("Password berhasil diubah")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div key={profile?.id} className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Profil Saya</h2>
        <p className="text-muted-foreground">Kelola informasi pribadi dan pengaturan keamanan akun Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-white/10 bg-background/60 backdrop-blur-xl overflow-hidden">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="relative inline-block group">
                <div className="w-32 h-32 rounded-full border-4 border-primary/20 overflow-hidden bg-zinc-800 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-zinc-600" />
                  )}
                </div>
                <label className="absolute bottom-4 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpdateAvatar} disabled={uploading} />
                </label>
              </div>
              <h3 className="text-xl font-bold">{formData.full_name || 'User'}</h3>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role || 'Staff'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* General Info */}
          <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User size={18} className="text-primary" /> Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input 
                    id="full_name" 
                    value={formData.full_name} 
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Nomor WhatsApp</Label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="0812xxxx"
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Alamat Email</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="email@example.com"
                      className="pl-10 bg-white/5 border-white/10"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Catatan: Perubahan email memerlukan konfirmasi melalui kotak masuk email baru Anda.</p>
                </div>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Simpan Profil
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock size={18} className="text-primary" /> Keamanan Akun
              </CardTitle>
              <CardDescription>Ubah kata sandi Anda secara berkala untuk menjaga keamanan akun.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="curr_pass">Password Saat Ini</Label>
                  <Input 
                    id="curr_pass" 
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="bg-white/5 border-white/10"
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid gap-2 border-t border-white/5 pt-4">
                  <Label htmlFor="new_pass">Password Baru</Label>
                  <Input 
                    id="new_pass" 
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="bg-white/5 border-white/10"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm_pass">Konfirmasi Password Baru</Label>
                  <Input 
                    id="confirm_pass" 
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="bg-white/5 border-white/10"
                    placeholder="Ulangi password baru"
                  />
                </div>
                <Button type="submit" variant="outline" disabled={loading} className="border-primary/20 text-primary hover:bg-primary/5">
                  Ubah Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
