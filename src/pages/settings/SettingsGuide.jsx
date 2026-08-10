import {
  LayoutDashboard, CheckSquare, FolderKanban, CalendarDays, Timer, StickyNote,
  BookOpen, Lightbulb, Flame, Target, Library, Bookmark, FolderOpen, Wrench,
  BarChart3, Bell, Command, Sparkles, CloudCog,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { AccordionItem } from '@/components/ui/Accordion'

export default function SettingsGuide() {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-display font-semibold mb-1">Panduan Penggunaan</h3>
        <p className="text-xs text-muted-light dark:text-muted-dark mb-2">
          Ringkasan singkat tiap fitur di AIR. Klik bagian di bawah untuk buka detailnya.
        </p>
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-300 mb-2">
          <Command size={14} className="shrink-0" />
          Tekan <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 mx-1">⌘K</kbd> (atau Ctrl+K) kapan saja untuk pencarian cepat ke semua data — task, project, note, goal, habit, dan koleksi buku/film di Library.
        </div>
      </Card>

      <Card className="!p-0">
        <div className="px-5">
          <AccordionItem title="Dashboard" icon={LayoutDashboard} defaultOpen>
            <p>Halaman utama yang merangkum semua aktivitas kamu hari ini: task yang jatuh tempo, jadwal acara terdekat, progress project aktif, streak habit, ringkasan sesi Pomodoro, dan tren produktivitas mingguan. Cocok jadi titik awal tiap buka aplikasi.</p>
          </AccordionItem>
          <AccordionItem title="Tasks" icon={CheckSquare}>
            <p>Kelola semua to-do: buat task baru, atur prioritas (urgent/high/medium/low), status (to do/in progress/done), deadline, tag, dan checklist di dalam satu task. Bisa dicari, difilter per status, dan diarsipkan kalau sudah tidak relevan tapi belum mau dihapus permanen.</p>
          </AccordionItem>
          <AccordionItem title="Projects" icon={FolderKanban}>
            <p>Untuk pekerjaan yang lebih besar dari satu task. Setiap project punya progress bar, deadline, tag, catatan, dan daftar file terkait. Klik salah satu project untuk buka halaman detailnya.</p>
          </AccordionItem>
          <AccordionItem title="Calendar" icon={CalendarDays}>
            <p>Lihat jadwal dalam tampilan bulan, minggu, atau hari. Klik tanggal kosong untuk bikin acara baru, klik acara yang sudah ada untuk edit. Aktifkan "reminder" di sebuah acara supaya kamu dapat notifikasi ±15 menit sebelum acara mulai.</p>
          </AccordionItem>
          <AccordionItem title="Pomodoro" icon={Timer}>
            <p>Timer fokus 25 menit dengan jeda pendek/panjang otomatis mengikuti siklus klasik Pomodoro. Setiap sesi yang selesai otomatis tercatat di riwayat sesi dan masuk ke grafik "focus minutes" di Dashboard & Analytics.</p>
          </AccordionItem>
          <AccordionItem title="Notes" icon={StickyNote}>
            <p>Catatan mendukung format Markdown (judul pakai #, list pakai -, dst). Bisa dikelompokkan ke folder, diberi tag, di-pin ke atas, atau ditandai favorit. Klik ikon mata untuk lihat hasil preview yang sudah dirender.</p>
          </AccordionItem>
          <AccordionItem title="Journal" icon={BookOpen}>
            <p>Jurnal harian: catat mood hari ini, hal-hal yang disyukuri, highlight, dan pelajaran yang didapat. Satu entri per hari — kalau sudah ada, klik "Today's entry" akan membawamu ke entri yang sama.</p>
          </AccordionItem>
          <AccordionItem title="Brainstorm" icon={Lightbulb}>
            <p>Tempat menampung ide random sebelum lupa. Beri kategori dan status (new/exploring/validated/archived) supaya gampang disortir nanti saat mau dieksekusi.</p>
          </AccordionItem>
          <AccordionItem title="Habits" icon={Flame}>
            <p>Lacak kebiasaan harian/mingguan. Centang kotak di kartu habit untuk menandai selesai hari ini. Kotak-kotak kecil di bawahnya adalah heatmap riwayat 12 minggu terakhir — makin banyak kotak terisi, makin konsisten.</p>
          </AccordionItem>
          <AccordionItem title="Goals" icon={Target}>
            <p>Target jangka menengah/panjang dengan progress % dan milestone. Cocok untuk hal yang butuh beberapa minggu/bulan, sementara Tasks lebih untuk hal-hal harian.</p>
          </AccordionItem>
          <AccordionItem title="Media Library" icon={Library}>
            <p>Koleksi pribadi: buku, film, game, musik, dan course. Tambahkan cover/poster (upload gambar dari perangkat atau tempel URL gambar), beri rating bintang 1–5, status (planned/in progress/completed/dropped), dan review singkat.</p>
          </AccordionItem>
          <AccordionItem title="Bookmarks" icon={Bookmark}>
            <p>Simpan link penting supaya gampang ditemukan lagi, dikelompokkan per folder dan bisa ditandai favorit.</p>
          </AccordionItem>
          <AccordionItem title="Files" icon={FolderOpen}>
            <p>Manajer file sederhana. Dalam mode lokal, file yang di-upload hanya tersimpan sebagai metadata di browser ini. Kalau Supabase sudah disambungkan (lihat tab Koneksi), file betulan ter-upload ke Supabase Storage.</p>
          </AccordionItem>
          <AccordionItem title="Dev Tools" icon={Wrench}>
            <p>Kumpulan utilitas: simpan snippet kode, buat palet warna, generator gradient CSS, JSON formatter (prettify/minify), generator UUID, dan encoder/decoder Base64. Semua berjalan langsung di browser, tidak butuh internet.</p>
          </AccordionItem>
          <AccordionItem title="Analytics" icon={BarChart3}>
            <p>Rangkuman angka: total task selesai, total menit fokus, streak habit terpanjang, progress tiap goal — semua dalam bentuk grafik supaya gampang dibaca trennya.</p>
          </AccordionItem>
          <AccordionItem title="Notifications" icon={Bell}>
            <p>AIR memberi notifikasi untuk: acara dengan reminder aktif (±15 menit sebelumnya), ringkasan task yang jatuh tempo hari ini, dan pengingat habit yang belum dicentang di malam hari. Nyalakan izin notifikasi browser di tab "Notifikasi" supaya juga muncul sebagai notifikasi sistem, bukan cuma di lonceng atas. Catatan: pengecekan hanya berjalan selagi tab aplikasi ini terbuka.</p>
          </AccordionItem>
          <AccordionItem title="AI Assistant (11 provider + custom)" icon={Sparkles}>
            <p className="mb-2">Chat assistant yang bisa "lihat" ringkasan task, project, habit, dan goal kamu saat itu juga — jadi sarannya nyambung sama kondisi kamu, bukan generik. Bisa juga dipakai buat pertanyaan apa saja di luar produktivitas, dan bisa langsung bertindak di app (bikin task, mulai Pomodoro, centang habit).</p>
            <p className="font-medium text-inherit mb-1">Pilih provider — semuanya gratis:</p>
            <ul className="list-disc list-inside space-y-1 mb-2">
              <li><b>Gemini</b> (Google AI Studio) — paling serba bisa: chat, coding, baca dokumen/PDF & gambar langsung.</li>
              <li><b>Groq</b> — inference tercepat, enak buat chat yang butuh respons instan.</li>
              <li><b>OpenRouter</b> — satu API key untuk banyak model (Qwen, DeepSeek, Llama, Mistral, dll).</li>
              <li><b>Cerebras</b> — inference sangat cepat, fokus teks (tidak baca gambar).</li>
              <li><b>Together AI</b> — banyak pilihan model open-source dengan free tier luas.</li>
              <li><b>Mistral AI</b> — free tier paling luas: 1 miliar token/bulan, semua model termasuk yang besar.</li>
              <li><b>NVIDIA NIM</b> — katalog model gratis terbanyak (100+), termasuk Llama 405B.</li>
              <li><b>SambaNova</b> — salah satu dari sedikit tempat gratis buat Llama 3.1 405B, inference cepat.</li>
              <li><b>Hugging Face</b> — satu key, auto-routing ke ratusan model open-source.</li>
              <li><b>GitHub Models</b> — akses GPT-4o dkk cukup pakai Personal Access Token GitHub, tidak perlu daftar baru.</li>
              <li><b>SiliconFlow</b> — free tier besar buat model DeepSeek & Qwen terbaru.</li>
            </ul>
            <p className="mb-2">Butuh provider lain yang belum ada di daftar (termasuk model self-hosted kamu sendiri seperti Ollama)? Klik <b>"Tambah provider custom"</b> di bagian bawah kartu provider — cukup isi nama, Base URL endpoint yang kompatibel format OpenAI (<code>/chat/completions</code>), dan model default-nya.</p>
            <p className="font-medium text-inherit mb-1">Lampiran (gambar & file):</p>
            <p className="mb-2">Klik ikon <b>penjepit kertas</b> di sebelah kolom chat untuk melampirkan gambar (PNG/JPEG/WebP), PDF, atau file teks (maks 4 file, 8MB per file). Gemini bisa baca semuanya native (termasuk PDF). Provider lain membaca gambar hanya kalau model yang dipilih mendukung vision, dan file teks (txt/md/csv/json) otomatis disisipkan sebagai teks — PDF tidak bisa dibaca provider selain Gemini. Setelah refresh halaman, lampiran lama hanya tampil sebagai label nama file (data gambarnya tidak disimpan permanen, biar hemat ruang).</p>
            <p className="font-medium text-inherit mb-1">Cara mengaktifkan:</p>
            <ol className="list-decimal list-inside space-y-1 mb-2">
              <li>Buka Settings → tab General di aplikasi ini, scroll ke kartu "AI Assistant".</li>
              <li>Nyalakan switch di provider yang mau dipakai (boleh lebih dari satu sekaligus).</li>
              <li>Klik link "Ambil API key gratis" di provider itu untuk buka halaman pembuatan key-nya, lalu tempel key-nya di kolom yang muncul.</li>
              <li>Kalau lebih dari satu provider aktif, klik "Pakai ini" pada provider yang mau dijadikan default — atau ganti kapan saja lewat dropdown di pojok kanan atas halaman AI Assistant.</li>
            </ol>
            <p className="text-xs">⚠️ Semua API key hanya tersimpan di browser kamu (localStorage), tidak pernah ikut ter-upload ke GitHub atau ke build aplikasi. Tapi tetap jangan share API key ke orang lain, dan jangan taruh di file <code>.env</code> kalau aplikasi ini di-deploy publik — karena isi <code>.env</code> ikut terbundle ke kode yang bisa dilihat siapa saja.</p>
          </AccordionItem>
          <AccordionItem title="Setup Supabase (opsional, buat sinkron ke cloud)" icon={CloudCog}>
            <p className="mb-2">Secara default aplikasi ini jalan 100% lokal di browser kamu (mode "Local mode") — tidak wajib pakai Supabase sama sekali. Kalau nanti mau data kamu tersimpan online dan bisa diakses dari HP/laptop lain, ikuti langkah ini:</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary-500">supabase.com/dashboard</a>, login/daftar, klik "New project", pilih organisasi, kasih nama + password database bebas, pilih region terdekat.</li>
              <li>Setelah project selesai dibuat (tunggu 1-2 menit), buka menu <b>Project Settings → API</b>. Simpan halaman ini / jangan ditutup dulu — kamu butuh <code>Project URL</code> dan key <code>anon public</code> di sini.</li>
              <li>Buka menu <b>SQL Editor</b> di sidebar kiri, klik "New query", buka file <code>supabase.sql</code> yang ada di folder project aplikasi ini, copy semua isinya, paste ke SQL Editor, lalu klik "Run". Ini bikin tabel data + aturan keamanan (Row Level Security) otomatis.</li>
              <li>Buka menu <b>Storage</b> di sidebar → "New bucket" → kasih nama persis <code>uploads</code> → nyalakan toggle "Public bucket" → Save. (Bucket ini dipakai untuk upload file & cover Library.)</li>
              <li>Buka menu <b>Authentication → Providers</b> → pastikan "Email" aktif (biasanya default sudah nyala). Mau tambah login Google? Aktifkan provider "Google" di situ juga dan isi Client ID/Secret sesuai instruksi di halamannya.</li>
              <li>Di dalam folder project aplikasi ini, cari file <code>.env.example</code>, duplikat lalu ubah namanya jadi <code>.env</code>.</li>
              <li>Isi <code>VITE_SUPABASE_URL</code> dengan nilai <code>Project URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> dengan nilai key <code>anon public</code> dari langkah 2.</li>
              <li>Simpan file, lalu jalankan ulang <code>npm run dev</code> (kalau lagi development) atau <code>npm run build</code> ulang (kalau mau deploy). Aplikasi otomatis mendeteksi <code>.env</code> ini dan pindah dari "Local mode" ke "Connected to Supabase" — bisa dicek statusnya di Settings → General → Connection.</li>
            </ol>
            <p className="text-xs mt-2">Kalau cuma dipakai sendiri di satu browser/HP, langkah ini boleh dilewati saja — Local mode sudah cukup dan datanya tetap aman tersimpan di perangkat kamu.</p>
          </AccordionItem>
        </div>
      </Card>
    </div>
  )
}
