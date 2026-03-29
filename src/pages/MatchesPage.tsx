import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LinkButton from '../components/ui/LinkButton'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Match, Message, Product } from '../types'
import { clampText, formatTimeHHMM } from '../lib/format'

export default function MatchesPage() {
  const user = useAuthStore((s) => s.user)
  const [matches, setMatches] = useState<Match[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [lastByMatch, setLastByMatch] = useState<Record<string, Message>>({})
  const [unreadCount, setUnreadCount] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const { data: m, error: mErr } = await supabase
          .from('matches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200)
        if (mErr) throw mErr
        const matchRows = (m ?? []) as Match[]
        setMatches(matchRows)

        const productIds = Array.from(
          new Set(
            matchRows.flatMap((x) => [x.product_a_id, x.product_b_id]).filter(Boolean),
          ),
        )
        if (productIds.length > 0) {
          const { data: p, error: pErr } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds)
          if (pErr) throw pErr
          const map: Record<string, Product> = {}
          for (const row of (p ?? []) as Product[]) map[row.id] = row
          setProducts(map)
        } else {
          setProducts({})
        }

        const matchIds = matchRows.map((x) => x.id)
        if (matchIds.length > 0) {
          const { data: msgs, error: msgErr } = await supabase
            .from('messages')
            .select('*')
            .in('match_id', matchIds)
            .order('created_at', { ascending: false })
            .limit(400)
          if (msgErr) throw msgErr

          const lastMap: Record<string, Message> = {}
          for (const row of (msgs ?? []) as Message[]) {
            if (!lastMap[row.match_id]) lastMap[row.match_id] = row
          }
          setLastByMatch(lastMap)

          const unread = (msgs ?? [])
            .filter((x) => (x as Message).read_at == null)
            .filter((x) => (x as Message).sender_id !== user.id) as Message[]
          const unreadMap: Record<string, number> = {}
          for (const row of unread) unreadMap[row.match_id] = (unreadMap[row.match_id] ?? 0) + 1
          setUnreadCount(unreadMap)
        } else {
          setLastByMatch({})
          setUnreadCount({})
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Não foi possível carregar matches'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [user])

  const ordered = useMemo(() => {
    const arr = [...matches]
    arr.sort((a, b) => {
      const aTime = lastByMatch[a.id]?.created_at ?? a.created_at
      const bTime = lastByMatch[b.id]?.created_at ?? b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
    return arr
  }, [matches, lastByMatch])

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10 pt-2">
      <header>
        <h1 className="font-display text-2xl font-black tracking-tight text-white">
          Matches
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Seus matches e últimas mensagens.
        </p>
      </header>

      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-300">Carregando…</p>
      ) : ordered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-bg-900/40 p-5 backdrop-blur">
          <p className="text-sm text-slate-300">Nenhum match ainda.</p>
          <div className="mt-4">
            <LinkButton to="/swipe">Ir para Swipe</LinkButton>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {ordered.map((m) => {
            const a = products[m.product_a_id]
            const b = products[m.product_b_id]
            const last = lastByMatch[m.id]
            const unread = unreadCount[m.id] ?? 0
            return (
              <Link
                key={m.id}
                to={`/chat/${m.id}`}
                className="rounded-3xl border border-white/10 bg-bg-900/40 p-4 backdrop-blur hover:bg-bg-900/55"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {a?.title ?? 'Produto'} ↔ {b?.title ?? 'Produto'}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-300">
                      {last ? clampText(last.content, 40) : 'Sem mensagens ainda'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {last ? (
                      <span className="text-xs text-slate-400">
                        {formatTimeHHMM(last.created_at)}
                      </span>
                    ) : null}
                    {unread > 0 ? (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand-linear px-2 py-1 text-xs font-black text-bg-950">
                        {unread}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
