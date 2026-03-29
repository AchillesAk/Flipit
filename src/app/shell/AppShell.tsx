import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import NavBar from '../../components/NavBar'
import { useAuthStore } from '../../stores/authStore'
import clsx from 'clsx'

export default function AppShell() {
  const location = useLocation()
  const showNav = !['/', '/auth'].includes(location.pathname)
  const init = useAuthStore((s) => s.init)
  const wide = location.pathname.startsWith('/swipe')

  useEffect(() => {
    void init()
  }, [init])

  return (
    <div className="min-h-[100svh] bg-bg-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-brand-radial" />
      <div
        className={clsx(
          'relative mx-auto flex h-[100svh] w-full flex-col px-4 pb-[76px] pt-3',
          wide ? 'max-w-[840px]' : 'max-w-[520px]',
        )}
      >
        <Outlet />
      </div>
      {showNav ? <NavBar /> : null}
    </div>
  )
}
