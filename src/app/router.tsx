import { createBrowserRouter } from 'react-router-dom'
import AppShell from './shell/AppShell'
import ChatPage from '../pages/ChatPage'
import DashboardPage from '../pages/DashboardPage'
import LandingPage from '../pages/LandingPage'
import MatchesPage from '../pages/MatchesPage'
import NewProductPage from '../pages/NewProductPage'
import SwipePage from '../pages/SwipePage'
import AuthPage from '../pages/AuthPage'
import RequireAuth from '../components/RequireAuth'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/auth', element: <AuthPage /> },
      {
        path: '/dashboard',
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: '/produto/novo',
        element: (
          <RequireAuth>
            <NewProductPage />
          </RequireAuth>
        ),
      },
      {
        path: '/swipe',
        element: (
          <RequireAuth>
            <SwipePage />
          </RequireAuth>
        ),
      },
      {
        path: '/matches',
        element: (
          <RequireAuth>
            <MatchesPage />
          </RequireAuth>
        ),
      },
      {
        path: '/chat/:matchId',
        element: (
          <RequireAuth>
            <ChatPage />
          </RequireAuth>
        ),
      },
    ],
  },
])
