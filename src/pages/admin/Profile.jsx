import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Mail, Phone, Lock, User, Loader2, Save, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { Badge } from "@/components/ui/Badge"
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
    <div key={profile?.id} className="max-w-4xl mx-auto space-y-10 pb-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary border border-primary/20">
            <User size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground">Profil Personal</h2>
            <p className="text-sm text-muted-foreground">Kelola informasi identitas dan kredensial keamanan akun Anda.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left Column: Avatar & Basic Info */}
        <div className="md:col-span-1 space-y-8">
          <Card className="glass-card overflow-hidden border-border transition-all duration-500">
            <CardContent className="pt-10 pb-8 text-center">
              <div className="relative inline-block group mb-6">
                <div className="w-36 h-36 rounded-[2.5rem] border-4 border-primary/10 overflow-hidden bg-muted flex items-center justify-center transition-all duration-500 group-hover:rounded-[3.5rem] shadow-2xl group-hover:border-primary/30">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <User size={72} strokeWidth={1} className="text-muted-foreground/30" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-primary text-primary-foreground rounded-2xl cursor-pointer shadow-xl hover:scale-110 transition-all hover:bg-primary/90 border-4 border-background">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpdateAvatar} disabled={uploading} />
                </label>
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter mb-1">{formData.full_name || 'Personal Account'}</h3>
              <div className="flex justify-center">
                 <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">
                    <ShieldCheck size={10} className="mr-1.5" /> {profile?.role || 'Staff'}
                 </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* General Info */}
          <Card className="glass-card border-border">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <User size={20} className="text-primary" /> Informasi Dasar
              </CardTitle>
              <CardDescription className="font-medium text-xs">Informasi utama identitas personel yang terdaftar di sistem.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="full_name" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Nama Lengkap Sesuai ID</Label>
                  <Input 
                    id="full_name" 
                    value={formData.full_name} 
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="h-14 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Nomor WhatsApp Personel</Label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-4 text-muted-foreground/40" />
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="0812xxxx"
                      className="h-14 pl-12 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Alamat Korespondensi (Email)</Label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-4 text-muted-foreground/40" />
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="email@example.com"
                      className="h-14 pl-12 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-orange-500/80 font-bold italic mt-2">* Perubahan email memerlukan konfirmasi ulang melalui inbox alamat email baru Anda.</p>
                </div>
                <Button type="submit" disabled={loading} className="h-14 w-full sm:w-auto px-8 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl transition-all hover:opacity-90 text-[11px] gap-3">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Simpan Perubahan Profil
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glass-card border-border">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-red-500">
                <Lock size={20} /> Keamanan & Kredensial
              </CardTitle>
              <CardDescription className="font-medium text-xs">Pastikan kata sandi Anda kuat dan diperbarui secara berkala.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="curr_pass" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Password Saat Ini *</Label>
                  <Input 
                    id="curr_pass" 
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="h-14 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border/50 pt-8 mt-4">
                   <div className="grid gap-2">
                    <Label htmlFor="new_pass" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Password Baru *</Label>
                    <Input 
                      id="new_pass" 
                      type="password"
                      required
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="h-14 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm_pass" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Konfirmasi Password *</Label>
                    <Input 
                      id="confirm_pass" 
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="h-14 bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/30 rounded-2xl focus:ring-primary/50 transition-all"
                      placeholder="Ulangi password baru"
                    />
                  </div>
                </div>
                <Button type="submit" variant="ghost" disabled={loading} className="h-14 w-full sm:w-auto px-8 rounded-2xl border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest transition-all text-[11px]">
                   {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Lock size={18} className="mr-2" />}
                   Ubah Kata Sandi Sekarang
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
