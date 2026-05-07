import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings as SettingsIcon, Save, Percent, Wallet, Loader2, Layout, Globe, Image as ImageIcon, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [systemSettings, setSystemSettings] = useState({
    staff_salary_percentage: 10,
    maintenance_fee_percentage: 5,
    maintenance_fee_nominal: 0
  })

  const [landingSettings, setLandingSettings] = useState({
    hero_title_id: "",
    hero_title_en: "",
    hero_desc_id: "",
    hero_desc_en: "",
    hero_image_url: "",
    promo_text_id: "",
    promo_text_en: "",
    stats_perf: "",
    stats_sec: "",
    stats_ready: "",
    stats_rating: ""
  })

  useEffect(() => {
    async function loadAllSettings() {
      try {
        const [systemData, landingData] = await Promise.all([
          apiFetch('/api/settings/'),
          apiFetch('/api/settings/landing')
        ])
        setSystemSettings(systemData)
        setLandingSettings(landingData)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadAllSettings()
  }, [])

  const handleSaveSystem = async () => {
    try {
      setSaving(true)
      await apiFetch('/api/settings/', {
        method: 'POST',
        body: JSON.stringify(systemSettings)
      })
      toast.success("Pengaturan sistem berhasil disimpan")
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLanding = async () => {
    try {
      setSaving(true)
      await apiFetch('/api/settings/landing', {
        method: 'POST',
        body: JSON.stringify(landingSettings)
      })
      toast.success("Pengaturan Landing Page berhasil diperbarui")
    } catch (error) {
      toast.error("Gagal memperbarui Landing Page: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
          <p className="text-sm text-muted-foreground">Kelola konfigurasi sistem dan tampilan landing page.</p>
        </div>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="bg-background/80 border border-white/10 mb-6">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Percent size={16} /> Sistem & Finansial
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-2">
            <Layout size={16} /> Kustomisasi Landing Page
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Percent className="h-5 w-5 text-primary" />
                            Pembagian Laba
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="staff_pct">Gaji Staff (%)</Label>
                            <div className="relative">
                                <Input 
                                    id="staff_pct" 
                                    type="number" 
                                    value={systemSettings.staff_salary_percentage} 
                                    onChange={(e) => setSystemSettings({...systemSettings, staff_salary_percentage: parseFloat(e.target.value)})}
                                    className="pr-10"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">%</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Wallet className="h-5 w-5 text-primary" />
                            Biaya Perawatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="maint_pct">Persentase (%)</Label>
                            <Input 
                                id="maint_pct" 
                                type="number" 
                                value={systemSettings.maintenance_fee_percentage} 
                                onChange={(e) => setSystemSettings({...systemSettings, maintenance_fee_percentage: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="maint_nom">Nominal Tetap (Rp)</Label>
                            <Input 
                                id="maint_nom" 
                                type="number" 
                                value={systemSettings.maintenance_fee_nominal} 
                                onChange={(e) => setSystemSettings({...systemSettings, maintenance_fee_nominal: parseFloat(e.target.value)})}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSaveSystem} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                    Simpan Pengaturan Sistem
                </Button>
            </div>
        </TabsContent>

        <TabsContent value="landing" className="space-y-6">
            <div className="grid gap-6">
                {/* Hero Section Config */}
                <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="h-5 w-5 text-blue-500" />
                            Konten Hero (Utama)
                        </CardTitle>
                        <CardDescription>Sesuaikan teks utama yang tampil di halaman depan.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Judul (ID)</Label>
                                <Input value={landingSettings.hero_title_id} onChange={e => setLandingSettings({...landingSettings, hero_title_id: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Deskripsi (ID)</Label>
                                <textarea 
                                    className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                                    value={landingSettings.hero_desc_id} 
                                    onChange={e => setLandingSettings({...landingSettings, hero_desc_id: e.target.value})} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Promo Badge (ID)</Label>
                                <Input value={landingSettings.promo_text_id} onChange={e => setLandingSettings({...landingSettings, promo_text_id: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Title (EN)</Label>
                                <Input value={landingSettings.hero_title_en} onChange={e => setLandingSettings({...landingSettings, hero_title_en: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Description (EN)</Label>
                                <textarea 
                                    className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                                    value={landingSettings.hero_desc_en} 
                                    onChange={e => setLandingSettings({...landingSettings, hero_desc_en: e.target.value})} 
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Promo Badge (EN)</Label>
                                <Input value={landingSettings.promo_text_en} onChange={e => setLandingSettings({...landingSettings, promo_text_en: e.target.value})} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Image & Assets */}
                    <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ImageIcon className="h-5 w-5 text-orange-500" />
                                Visual & Media
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Hero Image URL</Label>
                                <Input value={landingSettings.hero_image_url} onChange={e => setLandingSettings({...landingSettings, hero_image_url: e.target.value})} />
                                <p className="text-[10px] text-muted-foreground">Contoh: /premium_hero_bike_1778159126854.png atau URL eksternal.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Config */}
                    <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5 text-emerald-500" />
                                Data Statistik
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Performance</Label>
                                <Input value={landingSettings.stats_perf} onChange={e => setLandingSettings({...landingSettings, stats_perf: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Security</Label>
                                <Input value={landingSettings.stats_sec} onChange={e => setLandingSettings({...landingSettings, stats_sec: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Ready Status</Label>
                                <Input value={landingSettings.stats_ready} onChange={e => setLandingSettings({...landingSettings, stats_ready: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>User Rating</Label>
                                <Input value={landingSettings.stats_rating} onChange={e => setLandingSettings({...landingSettings, stats_rating: e.target.value})} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSaveLanding} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                    Update Landing Page
                </Button>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
