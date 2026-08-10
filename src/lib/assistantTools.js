// Function-calling ("tool use") layer for the AI Assistant.
// Each entry in TOOL_DECLARATIONS is sent to whichever provider is active
// (Gemini, Groq, OpenRouter, Cerebras, or Together) so it knows what actions
// it's allowed to take. gemini.js consumes this shape directly;
// openaiCompat.js converts it to OpenAI's `tools: [{type:'function',...}]`
// shape internally. When the model decides to call one, executeTool()
// actually performs it against the real app state (dataService for
// Firestore/local data, usePomodoroStore for the timer) — this is what makes
// the assistant "Jarvis-like" instead of just chatting.
//
// Coverage: every feature in the app is reachable — tasks, projects, goals,
// habits, pomodoro, notes, journal, brainstorm, library, bookmarks, and the
// calendar — with create/update/delete (or the closest equivalent) for each.
import { usePomodoroStore } from '@/store/usePomodoroStore'
import { useAssistantStore } from '@/store/useAssistantStore'
import { generateGeminiImage } from './gemini'
import { dataService } from './dataService'
import { normalizePhrase } from './phraseMatch'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function toIsoOrNull(d) {
  if (!d) return null
  const parsed = new Date(d)
  return isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

async function findByField(collection, field, needle) {
  const items = await dataService.getAll(collection)
  const n = (needle || '').toLowerCase()
  return items.find((i) => (i[field] || '').toLowerCase().includes(n))
}

// Slug -> hash-router path. Keep in sync with src/routes/index.jsx.
const PAGE_ROUTES = {
  dashboard: '/',
  tasks: '/tasks',
  projects: '/projects',
  calendar: '/calendar',
  pomodoro: '/pomodoro',
  arcade: '/arcade',
  whiteboard: '/whiteboard',
  notes: '/notes',
  journal: '/journal',
  brainstorm: '/brainstorm',
  habits: '/habits',
  goals: '/goals',
  library: '/library',
  bookmarks: '/bookmarks',
  files: '/files',
  devtools: '/devtools',
  assistant: '/assistant',
  analytics: '/analytics',
  settings: '/settings',
}

// Common synonyms/typos users (or the model) might say instead of the slug.
const PAGE_ALIASES = {
  home: 'dashboard',
  beranda: 'dashboard',
  overview: 'dashboard',
  task: 'tasks',
  todo: 'tasks',
  todos: 'tasks',
  project: 'projects',
  kalender: 'calendar',
  jadwal: 'calendar',
  timer: 'pomodoro',
  focus: 'pomodoro',
  game: 'arcade',
  games: 'arcade',
  papan: 'whiteboard',
  note: 'notes',
  catatan: 'notes',
  jurnal: 'journal',
  diary: 'journal',
  ide: 'brainstorm',
  ideas: 'brainstorm',
  habit: 'habits',
  kebiasaan: 'habits',
  goal: 'goals',
  tujuan: 'goals',
  perpustakaan: 'library',
  media: 'library',
  bookmark: 'bookmarks',
  file: 'files',
  files_page: 'files',
  tools: 'devtools',
  'dev tools': 'devtools',
  ai: 'assistant',
  'ai assistant': 'assistant',
  chat: 'assistant',
  analitik: 'analytics',
  pengaturan: 'settings',
  setting: 'settings',
}

function resolvePageSlug(input) {
  const key = (input || '').trim().toLowerCase()
  if (PAGE_ROUTES[key]) return key
  if (PAGE_ALIASES[key]) return PAGE_ALIASES[key]
  return null
}

// Verb words that signal navigation intent, matched anywhere in the
// message (not just at the start) — so "can u open journal page", "pls
// open journal page for me", "tolong bukain notes dong" all match, no
// matter what's wrapped around the verb + page name.
const NAV_VERB_PATTERN = /\b(buka\w*|bukain|bukakan|pindah\w*|pergi\w*|masuk\w*|tampil\w*|lihat\w*|arahkan\w*|navigate|redirect|open|show|go|switch|take)\b/

// Words that signal this is actually a compound/multi-step request ("buka
// notes terus buatin catatan baru") — those are left for the AI, since more
// than just navigation is being asked for.
const NAV_COMPOUND_GUARDS = ['terus', 'lalu', 'kemudian', 'habis itu', 'abis itu', 'setelah itu', 'sekalian', 'then', 'and then', 'after that']

// Finds the longest known page slug/alias that appears anywhere in `norm`
// as a whole word/phrase (not just a substring — "note" shouldn't match
// inside some unrelated longer word). Multi-word aliases (e.g. "dev tools",
// "ai assistant") are tried before single words so they win when both could
// technically match.
function findPagePhrase(norm) {
  const candidates = [...Object.keys(PAGE_ROUTES), ...Object.keys(PAGE_ALIASES)]
    .map((k) => normalizePhrase(k))
    .filter(Boolean)
    .sort((a, b) => b.split(' ').length - a.split(' ').length || b.length - a.length)
  for (const c of candidates) {
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(norm)) return c
  }
  return null
}

/**
 * Deterministically recognizes "open/go to a page" commands — e.g. "buka
 * notes", "can u open journal page", "pls open journal page for me" —
 * regardless of what filler words surround the verb + page name, and
 * resolves them straight to a page slug, WITHOUT depending on the AI model.
 *
 * Why this exists: navigate_to_page is just a function declaration — the
 * model has to actively decide to call it on every single request, and in
 * practice every provider (Gemini, Groq, OpenRouter, Cerebras, Together)
 * will sometimes just answer in plain text ("kamu bisa buka Notes lewat
 * sidebar...") instead of invoking it, especially for short one-line
 * requests. Since this class of command is simple and unambiguous, we
 * match it locally first (see useAssistantChat.js) and only fall back to
 * the normal AI round-trip for anything that doesn't look like a pure
 * navigation request (compound requests, long sentences, etc).
 *
 * Returns the resolved slug, or null if this doesn't look like a plain
 * navigation command.
 */
export function matchNavigationCommand(text) {
  const norm = normalizePhrase(text)
  if (!norm) return null

  // No-verb case: the whole message is just a page name/alias, e.g. "notes".
  const direct = resolvePageSlug(norm)
  if (direct) return direct

  // Anything that reads like more than one instruction chained together is
  // left for the AI to sort out.
  if (NAV_COMPOUND_GUARDS.some((g) => norm.includes(normalizePhrase(g)))) return null

  // Keep this to short, clearly-a-command messages — long sentences are
  // more likely genuine questions/conversation that happen to mention a
  // page-like word ("what should my goal be for today"), not a navigation
  // request.
  if (norm.split(' ').length > 10) return null

  if (!NAV_VERB_PATTERN.test(norm)) return null

  const pagePhrase = findPagePhrase(norm)
  if (!pagePhrase) return null

  return resolvePageSlug(pagePhrase)
}

export const TOOL_DECLARATIONS = [
  // ---------- Navigation ----------
  {
    name: 'navigate_to_page',
    description: 'Membuka/berpindah ke halaman tertentu di dalam aplikasi ini untuk pengguna, misalnya diminta "buka dashboard", "pindah ke tasks", atau "buka pomodoro". Selalu panggil ini kalau pengguna minta dibukakan/ditampilkan sebuah halaman/fitur, jangan cuma menjelaskan caranya.',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: Object.keys(PAGE_ROUTES),
          description: 'Slug halaman tujuan, contoh: dashboard, tasks, projects, calendar, pomodoro, arcade, whiteboard, notes, journal, brainstorm, habits, goals, library, bookmarks, files, devtools, assistant, analytics, settings',
        },
      },
      required: ['page'],
    },
  },

  // ---------- Tasks ----------
  {
    name: 'create_task',
    description: 'Membuat task baru di daftar Tasks pengguna.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul/nama task, wajib diisi' },
        priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'], description: 'Prioritas task, default medium' },
        dueDate: { type: 'string', description: 'Tanggal jatuh tempo format YYYY-MM-DD, opsional' },
        notes: { type: 'string', description: 'Catatan tambahan, opsional' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Mengubah properti sebuah task yang sudah ada (status, prioritas, tanggal jatuh tempo, atau catatan), dicari berdasarkan judul (boleh sebagian).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul task yang ingin diubah' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'done'], description: 'Status baru, opsional' },
        priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'], description: 'Prioritas baru, opsional' },
        dueDate: { type: 'string', description: 'Tanggal jatuh tempo baru format YYYY-MM-DD, opsional' },
        notes: { type: 'string', description: 'Catatan baru, opsional' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Menandai sebuah task yang sudah ada sebagai selesai (done), dicari berdasarkan judul (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul task yang ingin ditandai selesai' },
      },
      required: ['title'],
    },
  },
  {
    name: 'delete_task',
    description: 'Menghapus sebuah task, dicari berdasarkan judul (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul task yang ingin dihapus' },
      },
      required: ['title'],
    },
  },

  // ---------- Pomodoro ----------
  {
    name: 'start_pomodoro',
    description: 'Memulai/menyalakan sesi fokus Pomodoro dengan durasi custom dalam menit. Gunakan ini setiap kali pengguna minta set/mulai timer pomodoro, termasuk durasi yang tidak standar seperti 15 menit.',
    parameters: {
      type: 'object',
      properties: {
        minutes: { type: 'number', description: 'Durasi sesi fokus dalam menit, contoh: 15, 25, 50' },
        label: { type: 'string', description: 'Label/nama sesi, misalnya task yang sedang dikerjakan. Opsional.' },
      },
      required: ['minutes'],
    },
  },
  {
    name: 'pause_pomodoro',
    description: 'Menjeda (pause) timer Pomodoro yang sedang berjalan.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'reset_pomodoro',
    description: 'Mereset timer Pomodoro kembali ke durasi awal mode saat ini dan menghentikannya.',
    parameters: { type: 'object', properties: {} },
  },

  // ---------- Habits ----------
  {
    name: 'create_habit',
    description: 'Membuat habit baru untuk dilacak.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nama habit, wajib diisi' },
        icon: { type: 'string', description: 'Satu emoji sebagai ikon, opsional' },
        cadence: { type: 'string', enum: ['daily', 'weekly'], description: 'Frekuensi target, default daily' },
        target: { type: 'number', description: 'Target jumlah per periode (mis. 7 untuk harian, 4 untuk mingguan), opsional' },
      },
      required: ['name'],
    },
  },
  {
    name: 'toggle_habit_today',
    description: 'Menandai (atau membatalkan tanda jika sudah tertandai) sebuah habit sebagai selesai untuk hari ini, dicari berdasarkan nama (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nama atau sebagian nama habit' },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_habit',
    description: 'Menghapus sebuah habit, dicari berdasarkan nama (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nama atau sebagian nama habit yang ingin dihapus' },
      },
      required: ['name'],
    },
  },

  // ---------- Projects ----------
  {
    name: 'create_project',
    description: 'Membuat project baru.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nama project, wajib diisi' },
        description: { type: 'string', description: 'Deskripsi singkat, opsional' },
        status: { type: 'string', enum: ['active', 'on_hold', 'completed'], description: 'Status, default active' },
        deadline: { type: 'string', description: 'Tenggat format YYYY-MM-DD, opsional' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_project',
    description: 'Mengubah progress dan/atau status sebuah project yang sudah ada, dicari berdasarkan nama (boleh sebagian).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nama atau sebagian nama project' },
        progress: { type: 'number', description: 'Progress baru dalam persen (0-100), opsional' },
        status: { type: 'string', enum: ['active', 'on_hold', 'completed'], description: 'Status baru, opsional' },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_project',
    description: 'Menghapus sebuah project, dicari berdasarkan nama (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nama atau sebagian nama project yang ingin dihapus' },
      },
      required: ['name'],
    },
  },

  // ---------- Goals ----------
  {
    name: 'create_goal',
    description: 'Membuat goal/tujuan baru.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul goal, wajib diisi' },
        category: { type: 'string', description: 'Kategori, misalnya Career, Health, Finance, Personal. Opsional.' },
        deadline: { type: 'string', description: 'Tenggat format YYYY-MM-DD, opsional' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_goal_progress',
    description: 'Mengubah progress (dan opsional status) sebuah goal yang sudah ada, dicari berdasarkan judul (boleh sebagian).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul goal' },
        progress: { type: 'number', description: 'Progress baru dalam persen (0-100)' },
        status: { type: 'string', enum: ['active', 'completed'], description: 'Status baru, opsional' },
      },
      required: ['title', 'progress'],
    },
  },
  {
    name: 'delete_goal',
    description: 'Menghapus sebuah goal, dicari berdasarkan judul (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul goal yang ingin dihapus' },
      },
      required: ['title'],
    },
  },

  // ---------- Notes ----------
  {
    name: 'create_note',
    description: 'Membuat catatan (note) baru.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul catatan, wajib diisi' },
        content: { type: 'string', description: 'Isi catatan, boleh markdown, opsional' },
        folder: { type: 'string', description: 'Folder tujuan, opsional' },
        pinned: { type: 'boolean', description: 'Sematkan catatan ini, opsional' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_note',
    description: 'Mengubah isi/folder sebuah catatan yang sudah ada, dicari berdasarkan judul (boleh sebagian).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul catatan' },
        content: { type: 'string', description: 'Isi catatan baru, opsional' },
        folder: { type: 'string', description: 'Folder baru, opsional' },
        pinned: { type: 'boolean', description: 'Sematkan/lepas sematan, opsional' },
      },
      required: ['title'],
    },
  },
  {
    name: 'delete_note',
    description: 'Menghapus sebuah catatan, dicari berdasarkan judul (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul catatan yang ingin dihapus' },
      },
      required: ['title'],
    },
  },

  // ---------- Journal ----------
  {
    name: 'add_journal_entry',
    description: 'Menambahkan entri jurnal baru (biasanya untuk hari ini).',
    parameters: {
      type: 'object',
      properties: {
        mood: { type: 'number', description: 'Skala mood 1-5 (1=buruk, 5=sangat baik), opsional' },
        highlights: { type: 'string', description: 'Momen/pencapaian penting hari ini, opsional' },
        learning: { type: 'string', description: 'Pelajaran yang didapat hari ini, opsional' },
        gratitude: { type: 'array', items: { type: 'string' }, description: 'Daftar hal yang disyukuri, opsional' },
      },
      required: [],
    },
  },
  {
    name: 'delete_latest_journal_entry',
    description: 'Menghapus entri jurnal yang paling baru dibuat.',
    parameters: { type: 'object', properties: {} },
  },

  // ---------- Brainstorm ----------
  {
    name: 'create_brainstorm_idea',
    description: 'Menambahkan ide baru ke papan Brainstorm.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul ide, wajib diisi' },
        category: { type: 'string', description: 'Kategori ide, misalnya Product, Engineering. Opsional.' },
        notes: { type: 'string', description: 'Detail/catatan tambahan tentang ide, opsional' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_brainstorm_status',
    description: 'Mengubah status sebuah ide brainstorm, dicari berdasarkan judul (boleh sebagian).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul ide' },
        status: { type: 'string', enum: ['new', 'exploring', 'validated', 'archived'], description: 'Status baru' },
      },
      required: ['title', 'status'],
    },
  },
  {
    name: 'delete_brainstorm_idea',
    description: 'Menghapus sebuah ide brainstorm, dicari berdasarkan judul (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul ide yang ingin dihapus' },
      },
      required: ['title'],
    },
  },

  // ---------- Library ----------
  {
    name: 'create_library_item',
    description: 'Menambahkan item baru ke Library (buku, film, game, course, atau musik) yang sedang/sudah dinikmati.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul item, wajib diisi' },
        type: { type: 'string', enum: ['book', 'movie', 'game', 'course', 'music'], description: 'Jenis item, wajib diisi' },
        creator: { type: 'string', description: 'Penulis/sutradara/pembuat, opsional' },
        status: { type: 'string', enum: ['planned', 'in_progress', 'completed'], description: 'Status, default in_progress' },
        rating: { type: 'number', description: 'Rating 1-5, opsional' },
      },
      required: ['title', 'type'],
    },
  },
  {
    name: 'update_library_item',
    description: 'Mengubah status/rating/review sebuah item Library yang sudah ada, dicari berdasarkan judul (boleh sebagian).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul item' },
        status: { type: 'string', enum: ['planned', 'in_progress', 'completed'], description: 'Status baru, opsional' },
        rating: { type: 'number', description: 'Rating baru 1-5, opsional' },
        review: { type: 'string', description: 'Review/catatan baru, opsional' },
      },
      required: ['title'],
    },
  },
  {
    name: 'delete_library_item',
    description: 'Menghapus sebuah item Library, dicari berdasarkan judul (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul item yang ingin dihapus' },
      },
      required: ['title'],
    },
  },

  // ---------- Bookmarks ----------
  {
    name: 'create_bookmark',
    description: 'Menyimpan bookmark/link baru.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul bookmark, wajib diisi' },
        url: { type: 'string', description: 'URL tujuan, wajib diisi' },
        folder: { type: 'string', description: 'Folder tujuan, opsional' },
      },
      required: ['title', 'url'],
    },
  },
  {
    name: 'delete_bookmark',
    description: 'Menghapus sebuah bookmark, dicari berdasarkan judul (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul bookmark yang ingin dihapus' },
      },
      required: ['title'],
    },
  },

  // ---------- Calendar / Events ----------
  {
    name: 'create_event',
    description: 'Membuat acara/event baru di Calendar.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul acara, wajib diisi' },
        date: { type: 'string', description: 'Tanggal & waktu mulai, format ISO atau YYYY-MM-DD HH:mm, wajib diisi' },
        end: { type: 'string', description: 'Tanggal & waktu selesai, opsional' },
        category: { type: 'string', enum: ['work', 'personal', 'health'], description: 'Kategori acara, opsional' },
        reminder: { type: 'boolean', description: 'Aktifkan pengingat, opsional' },
      },
      required: ['title', 'date'],
    },
  },
  {
    name: 'delete_event',
    description: 'Menghapus sebuah acara di Calendar, dicari berdasarkan judul (boleh sebagian/partial match).',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul acara yang ingin dihapus' },
      },
      required: ['title'],
    },
  },
  {
    name: 'add_event_note',
    description: 'Menambahkan satu catatan/entri journal ke sebuah acara Calendar yang sudah ada, dicari berdasarkan judul (boleh sebagian/partial match). Beda dari add_journal_entry (yang untuk halaman Journal terpisah) — ini catatan yang menempel langsung di acara kalender tsb.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Judul atau sebagian judul acara yang ingin diberi catatan' },
        note: { type: 'string', description: 'Isi catatan/journal yang ingin ditambahkan' },
      },
      required: ['title', 'note'],
    },
  },
  {
    name: 'generate_image',
    description: 'Membuat gambar/ilustrasi dari deskripsi teks (text-to-image) dan menampilkannya langsung di chat. Gunakan setiap kali pengguna minta digambarkan, dibuatkan ilustrasi, poster, sketsa, atau sejenisnya.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Deskripsi detail dan visual dari gambar yang diinginkan. Tulis dalam Bahasa Inggris untuk hasil terbaik, sertakan gaya (mis. "digital painting", "photorealistic", "flat illustration") kalau relevan.',
        },
      },
      required: ['prompt'],
    },
  },
]

export async function executeTool(name, args = {}) {
  try {
    switch (name) {
      // ---------- Navigation ----------
      case 'navigate_to_page': {
        const slug = resolvePageSlug(args.page)
        const path = slug ? PAGE_ROUTES[slug] : null
        if (!path) return { ok: false, message: `Halaman "${args.page}" tidak dikenali.` }
        window.location.hash = `#${path}`
        const label = slug.charAt(0).toUpperCase() + slug.slice(1)
        return { ok: true, message: `Membuka halaman ${label}.` }
      }

      // ---------- Tasks ----------
      case 'create_task': {
        const item = {
          title: args.title,
          notes: args.notes || '',
          status: 'todo',
          priority: args.priority || 'medium',
          dueDate: toIsoOrNull(args.dueDate),
          tags: [],
          checklist: [],
          archived: false,
        }
        const created = await dataService.create('tasks', item)
        return { ok: true, message: `Task "${created.title}" berhasil dibuat.` }
      }

      case 'update_task': {
        const match = await findByField('tasks', 'title', args.title)
        if (!match) return { ok: false, message: `Task dengan judul mirip "${args.title}" tidak ditemukan.` }
        const patch = {}
        if (args.status) patch.status = args.status
        if (args.priority) patch.priority = args.priority
        if (args.dueDate) patch.dueDate = toIsoOrNull(args.dueDate)
        if (args.notes !== undefined) patch.notes = args.notes
        await dataService.update('tasks', match.id, patch)
        return { ok: true, message: `Task "${match.title}" berhasil diperbarui.` }
      }

      case 'complete_task': {
        const match = await findByField('tasks', 'title', args.title)
        if (!match) return { ok: false, message: `Task dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.update('tasks', match.id, { status: 'done' })
        return { ok: true, message: `Task "${match.title}" ditandai selesai.` }
      }

      case 'delete_task': {
        const match = await findByField('tasks', 'title', args.title)
        if (!match) return { ok: false, message: `Task dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.remove('tasks', match.id)
        return { ok: true, message: `Task "${match.title}" dihapus.` }
      }

      // ---------- Pomodoro ----------
      case 'start_pomodoro': {
        const minutes = Math.max(1, Math.round(Number(args.minutes) || 25))
        const store = usePomodoroStore.getState()
        usePomodoroStore.setState({
          mode: 'focus',
          secondsLeft: minutes * 60,
          isRunning: true,
          label: args.label || store.label || 'Deep work',
        })
        return { ok: true, message: `Pomodoro dimulai selama ${minutes} menit${args.label ? ` untuk "${args.label}"` : ''}.` }
      }

      case 'pause_pomodoro': {
        usePomodoroStore.getState().pause()
        return { ok: true, message: 'Pomodoro dijeda.' }
      }

      case 'reset_pomodoro': {
        usePomodoroStore.getState().reset()
        return { ok: true, message: 'Pomodoro direset.' }
      }

      // ---------- Habits ----------
      case 'create_habit': {
        const item = {
          name: args.name,
          icon: args.icon || '✅',
          color: 'primary',
          target: Number(args.target) || (args.cadence === 'weekly' ? 4 : 7),
          cadence: args.cadence || 'daily',
          history: {},
        }
        const created = await dataService.create('habits', item)
        return { ok: true, message: `Habit "${created.name}" berhasil dibuat.` }
      }

      case 'toggle_habit_today': {
        const match = await findByField('habits', 'name', args.name)
        if (!match) return { ok: false, message: `Habit dengan nama mirip "${args.name}" tidak ditemukan.` }
        const key = todayKey()
        const history = { ...(match.history || {}) }
        history[key] = !history[key]
        await dataService.update('habits', match.id, { history })
        return { ok: true, message: `Habit "${match.name}" ${history[key] ? 'ditandai selesai' : 'dibatalkan tandanya'} untuk hari ini.` }
      }

      case 'delete_habit': {
        const match = await findByField('habits', 'name', args.name)
        if (!match) return { ok: false, message: `Habit dengan nama mirip "${args.name}" tidak ditemukan.` }
        await dataService.remove('habits', match.id)
        return { ok: true, message: `Habit "${match.name}" dihapus.` }
      }

      // ---------- Projects ----------
      case 'create_project': {
        const item = {
          name: args.name,
          description: args.description || '',
          status: args.status || 'active',
          progress: 0,
          deadline: toIsoOrNull(args.deadline),
          tags: [],
          notes: '',
          files: [],
        }
        const created = await dataService.create('projects', item)
        return { ok: true, message: `Project "${created.name}" berhasil dibuat.` }
      }

      case 'update_project': {
        const match = await findByField('projects', 'name', args.name)
        if (!match) return { ok: false, message: `Project dengan nama mirip "${args.name}" tidak ditemukan.` }
        const patch = {}
        if (args.progress !== undefined) patch.progress = Math.max(0, Math.min(100, Number(args.progress)))
        if (args.status) patch.status = args.status
        await dataService.update('projects', match.id, patch)
        return { ok: true, message: `Project "${match.name}" berhasil diperbarui.` }
      }

      case 'delete_project': {
        const match = await findByField('projects', 'name', args.name)
        if (!match) return { ok: false, message: `Project dengan nama mirip "${args.name}" tidak ditemukan.` }
        await dataService.remove('projects', match.id)
        return { ok: true, message: `Project "${match.name}" dihapus.` }
      }

      // ---------- Goals ----------
      case 'create_goal': {
        const item = {
          title: args.title,
          category: args.category || 'Personal',
          progress: 0,
          deadline: toIsoOrNull(args.deadline),
          status: 'active',
          milestones: [],
        }
        const created = await dataService.create('goals', item)
        return { ok: true, message: `Goal "${created.title}" berhasil dibuat.` }
      }

      case 'update_goal_progress': {
        const match = await findByField('goals', 'title', args.title)
        if (!match) return { ok: false, message: `Goal dengan judul mirip "${args.title}" tidak ditemukan.` }
        const patch = { progress: Math.max(0, Math.min(100, Number(args.progress))) }
        if (args.status) patch.status = args.status
        else if (patch.progress >= 100) patch.status = 'completed'
        await dataService.update('goals', match.id, patch)
        return { ok: true, message: `Goal "${match.title}" progress diperbarui ke ${patch.progress}%.` }
      }

      case 'delete_goal': {
        const match = await findByField('goals', 'title', args.title)
        if (!match) return { ok: false, message: `Goal dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.remove('goals', match.id)
        return { ok: true, message: `Goal "${match.title}" dihapus.` }
      }

      // ---------- Notes ----------
      case 'create_note': {
        const item = {
          title: args.title,
          content: args.content || '',
          folder: args.folder || 'General',
          tags: [],
          pinned: Boolean(args.pinned),
          favorite: false,
        }
        const created = await dataService.create('notes', item)
        return { ok: true, message: `Catatan "${created.title}" berhasil dibuat.` }
      }

      case 'update_note': {
        const match = await findByField('notes', 'title', args.title)
        if (!match) return { ok: false, message: `Catatan dengan judul mirip "${args.title}" tidak ditemukan.` }
        const patch = {}
        if (args.content !== undefined) patch.content = args.content
        if (args.folder !== undefined) patch.folder = args.folder
        if (args.pinned !== undefined) patch.pinned = Boolean(args.pinned)
        await dataService.update('notes', match.id, patch)
        return { ok: true, message: `Catatan "${match.title}" berhasil diperbarui.` }
      }

      case 'delete_note': {
        const match = await findByField('notes', 'title', args.title)
        if (!match) return { ok: false, message: `Catatan dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.remove('notes', match.id)
        return { ok: true, message: `Catatan "${match.title}" dihapus.` }
      }

      // ---------- Journal ----------
      case 'add_journal_entry': {
        const item = {
          date: new Date().toISOString(),
          mood: args.mood !== undefined ? Number(args.mood) : 3,
          gratitude: Array.isArray(args.gratitude) ? args.gratitude : [],
          highlights: args.highlights || '',
          learning: args.learning || '',
        }
        await dataService.create('journal', item)
        return { ok: true, message: 'Entri jurnal hari ini berhasil ditambahkan.' }
      }

      case 'delete_latest_journal_entry': {
        const entries = await dataService.getAll('journal')
        if (!entries.length) return { ok: false, message: 'Belum ada entri jurnal untuk dihapus.' }
        const latest = [...entries].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))[0]
        await dataService.remove('journal', latest.id)
        return { ok: true, message: 'Entri jurnal terbaru dihapus.' }
      }

      // ---------- Brainstorm ----------
      case 'create_brainstorm_idea': {
        const item = {
          title: args.title,
          category: args.category || 'General',
          tags: [],
          status: 'new',
          favorite: false,
          notes: args.notes || '',
        }
        const created = await dataService.create('brainstorm', item)
        return { ok: true, message: `Ide "${created.title}" berhasil ditambahkan ke Brainstorm.` }
      }

      case 'update_brainstorm_status': {
        const match = await findByField('brainstorm', 'title', args.title)
        if (!match) return { ok: false, message: `Ide dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.update('brainstorm', match.id, { status: args.status })
        return { ok: true, message: `Status ide "${match.title}" diubah ke "${args.status}".` }
      }

      case 'delete_brainstorm_idea': {
        const match = await findByField('brainstorm', 'title', args.title)
        if (!match) return { ok: false, message: `Ide dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.remove('brainstorm', match.id)
        return { ok: true, message: `Ide "${match.title}" dihapus.` }
      }

      // ---------- Library ----------
      case 'create_library_item': {
        const item = {
          type: args.type,
          title: args.title,
          creator: args.creator || '',
          tags: [],
          rating: args.rating !== undefined ? Number(args.rating) : 0,
          status: args.status || 'in_progress',
          favorite: false,
          review: '',
          cover: '',
        }
        const created = await dataService.create('library', item)
        return { ok: true, message: `"${created.title}" berhasil ditambahkan ke Library.` }
      }

      case 'update_library_item': {
        const match = await findByField('library', 'title', args.title)
        if (!match) return { ok: false, message: `Item Library dengan judul mirip "${args.title}" tidak ditemukan.` }
        const patch = {}
        if (args.status) patch.status = args.status
        if (args.rating !== undefined) patch.rating = Number(args.rating)
        if (args.review !== undefined) patch.review = args.review
        await dataService.update('library', match.id, patch)
        return { ok: true, message: `"${match.title}" berhasil diperbarui.` }
      }

      case 'delete_library_item': {
        const match = await findByField('library', 'title', args.title)
        if (!match) return { ok: false, message: `Item Library dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.remove('library', match.id)
        return { ok: true, message: `"${match.title}" dihapus dari Library.` }
      }

      // ---------- Bookmarks ----------
      case 'create_bookmark': {
        const item = {
          title: args.title,
          url: args.url,
          tags: [],
          favorite: false,
          folder: args.folder || 'General',
        }
        const created = await dataService.create('bookmarks', item)
        return { ok: true, message: `Bookmark "${created.title}" berhasil disimpan.` }
      }

      case 'delete_bookmark': {
        const match = await findByField('bookmarks', 'title', args.title)
        if (!match) return { ok: false, message: `Bookmark dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.remove('bookmarks', match.id)
        return { ok: true, message: `Bookmark "${match.title}" dihapus.` }
      }

      // ---------- Calendar / Events ----------
      case 'create_event': {
        const item = {
          title: args.title,
          date: toIsoOrNull(args.date) || new Date().toISOString(),
          end: toIsoOrNull(args.end),
          category: args.category || 'personal',
          reminder: Boolean(args.reminder),
        }
        const created = await dataService.create('events', item)
        return { ok: true, message: `Acara "${created.title}" berhasil ditambahkan ke Calendar.` }
      }

      case 'delete_event': {
        const match = await findByField('events', 'title', args.title)
        if (!match) return { ok: false, message: `Acara dengan judul mirip "${args.title}" tidak ditemukan.` }
        await dataService.remove('events', match.id)
        return { ok: true, message: `Acara "${match.title}" dihapus.` }
      }

      case 'add_event_note': {
        const match = await findByField('events', 'title', args.title)
        if (!match) return { ok: false, message: `Acara dengan judul mirip "${args.title}" tidak ditemukan.` }
        const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: args.note, createdAt: new Date().toISOString() }
        const journal = [entry, ...(match.journal || [])]
        await dataService.update('events', match.id, { journal })
        return { ok: true, message: `Catatan ditambahkan ke acara "${match.title}".` }
      }

      // ---------- Image generation ----------
      case 'generate_image': {
        // Image generation always uses Gemini's native image model, even if
        // the active chat provider is something else — so it needs the
        // Gemini key specifically, pulled straight from the store.
        const geminiKey = useAssistantStore.getState().providers?.gemini?.apiKey
        if (!geminiKey) {
          return { ok: false, message: 'Fitur gambar butuh Gemini API key (terpisah dari provider chat yang lagi aktif). Tambahkan di Settings → AI Assistant → Gemini.' }
        }
        try {
          const image = await generateGeminiImage({ apiKey: geminiKey, prompt: args.prompt })
          return { ok: true, message: `Gambar untuk "${args.prompt}" berhasil dibuat.`, image }
        } catch (err) {
          return { ok: false, message: err.message || 'Gagal membuat gambar.' }
        }
      }

      default:
        return { ok: false, message: `Fungsi "${name}" tidak dikenali.` }
    }
  } catch (err) {
    return { ok: false, message: `Gagal menjalankan "${name}": ${err.message || 'error tidak diketahui'}` }
  }
}
