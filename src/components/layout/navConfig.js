import {
  LayoutDashboard, CheckSquare, FolderKanban, CalendarDays, Timer,
  StickyNote, BookOpen, Lightbulb, Flame, Target, Library, Bookmark,
  FolderOpen, Wrench, BarChart3, Settings, Sparkles, Gamepad2, PenTool,
} from 'lucide-react'

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Productivity',
    items: [
      { to: '/tasks', label: 'Tasks', icon: CheckSquare },
      { to: '/projects', label: 'Projects', icon: FolderKanban },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
      { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
    ],
  },
  {
    label: 'Break Room',
    items: [
      { to: '/arcade', label: 'Arcade', icon: Gamepad2 },
      { to: '/whiteboard', label: 'Whiteboard', icon: PenTool },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { to: '/notes', label: 'Notes', icon: StickyNote },
      { to: '/journal', label: 'Journal', icon: BookOpen },
      { to: '/brainstorm', label: 'Brainstorm', icon: Lightbulb },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { to: '/habits', label: 'Habits', icon: Flame },
      { to: '/goals', label: 'Goals', icon: Target },
    ],
  },
  {
    label: 'Library',
    items: [{ to: '/library', label: 'Media Library', icon: Library }],
  },
  {
    label: 'Utilities',
    items: [
      { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
      { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
      { to: '/files', label: 'Files', icon: FolderOpen },
      { to: '/devtools', label: 'Dev Tools', icon: Wrench },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/analytics', label: 'Analytics', icon: BarChart3 }],
  },
]

export const SETTINGS_ITEM = { to: '/settings', label: 'Settings', icon: Settings }
