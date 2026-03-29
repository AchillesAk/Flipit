import { Link, useLocation } from 'react-router-dom'
import { Flame, HeartHandshake, Layers } from 'lucide-react'
import clsx from 'clsx'
import { useUnreadTotal } from '../hooks/useUnreadTotal'

const items = [
  { to: '/dashboard', label: 'Dashboard', Icon: Layers },
  { to: '/swipe', label: 'Swipe', Icon: Flame },
  { to: '/matches', label: 'Matches', Icon: HeartHandshake },
]

export default function NavBar() {
  const location = useLocation()
  const { total } = useUnreadTotal()

  return (
    <nav className="fixed inset-x-0 bottom-0 h-[76px] border-t border-white/10 bg-bg-900/80 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[520px] items-center justify-around px-4">
        {items.map(({ to, label, Icon }) => {
          const active = location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs',
                active ? 'text-white' : 'text-slate-400',
              )}
            >
              <span className="relative">
                <Icon className={clsx('h-5 w-5', active ? 'text-white' : '')} />
                {to === '/matches' && total > 0 ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                ) : null}
              </span>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
