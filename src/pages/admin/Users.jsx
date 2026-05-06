import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users as UsersIcon, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Users() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Pengguna</h2>
        <Button className="flex items-center gap-2">
          <UserPlus size={18} />
          Tambah User
        </Button>
      </div>

      <Card className="border-white/10 bg-background/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Kelola akses dan akun pengguna sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <UsersIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Belum ada data pengguna</h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">
              Daftar semua staf atau admin yang memiliki akses ke sistem ini.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
