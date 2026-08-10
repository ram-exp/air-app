import { Bell, BellOff, BellRing, CalendarClock, CheckSquare, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, Switch, Button, Badge } from '@/components/ui'
import { useNotificationStore } from '@/store/useNotificationStore'
import { formatDate } from '@/lib/utils'

export default function SettingsNotifications() {
  const { permission, requestPermission, preferences, setPreference, items, clearAll } = useNotificationStore()

  const enableBrowser = async () => {
    const result = await requestPermission()
    if (result === 'granted') toast.success('Notifikasi browser diaktifkan')
    else if (result === 'denied') toast.error('Izin ditolak — aktifkan lewat pengaturan browser')
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] mb-4">
          {permission === 'granted' ? <BellRing size={18} className="text-teal-500" /> : permission === 'denied' ? <BellOff size={18} className="text-rose-500" /> : <Bell size={18} className="text-amber-500" />}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {permission === 'granted' && 'Notifikasi browser aktif'}
              {permission === 'denied' && 'Notifikasi browser diblokir'}
              {permission === 'default' && 'Notifikasi browser belum diaktifkan'}
              {permission === 'unsupported' && 'Browser ini tidak mendukung notifikasi'}
            </p>
            <p className="text-xs text-muted-light dark:text-muted-dark">
              {permission === 'denied'
                ? 'Ubah izin lewat pengaturan situs di browser kamu untuk mengaktifkan kembali.'
                : 'Dapatkan notifikasi sistem untuk reminder acara, task jatuh tempo, dan habit — selama tab ini terbuka.'}
            </p>
          </div>
          {permission !== 'granted' && permission !== 'unsupported' && (
            <Button size="sm" onClick={enableBrowser} disabled={permission === 'denied'}>Aktifkan</Button>
          )}
        </div>

        <h3 className="font-display font-semibold mb-3 text-sm">Jenis pengingat</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><CalendarClock size={15} className="text-primary-500" /><div><p className="text-sm font-medium">Reminder acara</p><p className="text-xs text-muted-light dark:text-muted-dark">±15 menit sebelum acara dengan reminder aktif</p></div></div>
            <Switch checked={preferences.events} onChange={(v) => setPreference('events', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><CheckSquare size={15} className="text-primary-500" /><div><p className="text-sm font-medium">Ringkasan task jatuh tempo</p><p className="text-xs text-muted-light dark:text-muted-dark">Sekali sehari kalau ada task due hari ini</p></div></div>
            <Switch checked={preferences.tasks} onChange={(v) => setPreference('tasks', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Flame size={15} className="text-primary-500" /><div><p className="text-sm font-medium">Pengingat habit malam hari</p><p className="text-xs text-muted-light dark:text-muted-dark">Setelah jam 8 malam, kalau masih ada habit belum dicentang</p></div></div>
            <Switch checked={preferences.habits} onChange={(v) => setPreference('habits', v)} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm">Riwayat notifikasi</h3>
          {items.length > 0 && <button onClick={clearAll} className="text-xs text-rose-500">Hapus semua</button>}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-light dark:text-muted-dark text-center py-6">Belum ada notifikasi.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {items.map((n) => (
              <div key={n.id} className="flex items-center gap-3 text-sm px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05]">
                <span className="flex-1 truncate">{n.title}</span>
                {!n.read && <Badge tone="primary">baru</Badge>}
                <span className="text-xs text-muted-light dark:text-muted-dark shrink-0">{formatDate(n.createdAt, { hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
