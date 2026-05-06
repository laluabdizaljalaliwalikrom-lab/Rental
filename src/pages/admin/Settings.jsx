import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings as SettingsIcon, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <SettingsIcon size={24} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Pengaturan</h2>
      </div>

      <div className="grid gap-6">
        <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Profil Instansi</CardTitle>
            <CardDescription>
              Informasi dasar tentang usaha rental Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Rental</Label>
              <Input id="name" defaultValue="Rental Sepeda" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" placeholder="Jl. Raya No. 123" />
            </div>
            <Button className="flex items-center gap-2">
              <Save size={18} />
              Simpan Perubahan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
