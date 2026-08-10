import { createHashRouter } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

import Dashboard from '@/pages/dashboard/Dashboard'
import TasksPage from '@/pages/tasks/TasksPage'
import ProjectsPage from '@/pages/projects/ProjectsPage'
import ProjectDetailPage from '@/pages/projects/ProjectDetailPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import PomodoroPage from '@/pages/pomodoro/PomodoroPage'
import ArcadePage from '@/pages/arcade/ArcadePage'
import WhiteboardPage from '@/pages/whiteboard/WhiteboardPage'
import NotesPage from '@/pages/notes/NotesPage'
import JournalPage from '@/pages/journal/JournalPage'
import BrainstormPage from '@/pages/brainstorm/BrainstormPage'
import HabitsPage from '@/pages/habits/HabitsPage'
import GoalsPage from '@/pages/goals/GoalsPage'
import LibraryPage from '@/pages/library/LibraryPage'
import BookmarksPage from '@/pages/bookmarks/BookmarksPage'
import FilesPage from '@/pages/files/FilesPage'
import DevToolsPage from '@/pages/devtools/DevToolsPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import AssistantPage from '@/pages/assistant/AssistantPage'
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import NotFound from '@/pages/NotFound'

export const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'pomodoro', element: <PomodoroPage /> },
      { path: 'arcade', element: <ArcadePage /> },
      { path: 'whiteboard', element: <WhiteboardPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'journal', element: <JournalPage /> },
      { path: 'brainstorm', element: <BrainstormPage /> },
      { path: 'habits', element: <HabitsPage /> },
      { path: 'goals', element: <GoalsPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'bookmarks', element: <BookmarksPage /> },
      { path: 'files', element: <FilesPage /> },
      { path: 'devtools', element: <DevToolsPage /> },
      { path: 'assistant', element: <AssistantPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
