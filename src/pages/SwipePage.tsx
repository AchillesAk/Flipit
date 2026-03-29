import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useMyProducts } from '../hooks/useMyProducts'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Product } from '../types'
import { formatBRLFromCents } from '../lib/format'

export default function SwipePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { items, loading: loadingMine } = useMyProducts()
  const activeMine = useMemo(() => items.filter((p) => p.is_active), [items])
  const [swiperProductId, setSwiperProductId] = useState<string>('')
  const [feed, setFeed] = useState<Array<Product & { profiles?: { username: string } }>>(
    [],
  )
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem('flipit_swiper_product_id')
    if (saved) setSwiperProductId(saved)
  }, [])

  useEffect(() => {
    if (swiperProductId) {
      window.localStorage.setItem('flipit_swiper_product_id', swiperProductId)
    }
  }, [swiperProductId])

  useEffect(() => {
    if (loadingMine) return
    if (activeMine.length === 0) {
      navigate('/dashboard', { replace: true })
    }
  }, [activeMine.length, loadingMine, navigate])

  async function loadFeed(selected: string) {
    if (!user) return
    setError(null)
    setLoadingFeed(true)
    try {
      const { data: mine, error: mineErr } = await supabase
        .from('products')
        .select('accept_any,accept_min_cents,accept_max_cents')
        .eq('id', selected)
        .maybeSingle()
      if (mineErr) throw mineErr

      const { data: swipedRows, error: swipedErr } = await supabase
        .from('swipes')
        .select('swiped_product_id')
        .eq('swiper_product_id', selected)
      if (swipedErr) throw swipedErr
      const swipedIds = (swipedRows ?? []).map((r) => r.swiped_product_id)

      let query = supabase
        .from('products')
        .select('*, profiles(username)')
        .eq('is_active', true)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (mine && mine.accept_any === false) {
        if (mine.accept_min_cents != null) {
          query = query.gte('price_cents', mine.accept_min_cents)
        }
        if (mine.accept_max_cents != null) {
          query = query.lte('price_cents', mine.accept_max_cents)
        }
      }

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.map((id) => `"${id}"`).join(',')})`)
      }

      const { data, error: err } = await query
      if (err) throw err
      setFeed((data ?? []) as any)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível carregar feed'
      setError(msg)
      setFeed([])
    } finally {
      setLoadingFeed(false)
    }
  }

  useEffect(() => {
    if (swiperProductId) void loadFeed(swiperProductId)
  }, [swiperProductId])

  const current = feed[0] ?? null

  async function swipe(direction: 'like' | 'pass') {
    if (!user) return
    if (!swiperProductId) return
    if (!current) return
    setError(null)
    setToast(null)
    try {
      const { error: swipeErr } = await supabase.from('swipes').insert({
        swiper_product_id: swiperProductId,
        swiped_product_id: current.id,
        direction,
      })
      if (swipeErr) throw swipeErr

      if (direction === 'like') {
        const { data: reciprocal } = await supabase
          .from('swipes')
          .select('id')
          .eq('swiper_product_id', current.id)
          .eq('swiped_product_id', swiperProductId)
          .eq('direction', 'like')
          .maybeSingle()

        if (reciprocal?.id) {
          const a = swiperProductId
          const b = current.id
          const { data: existing } = await supabase
            .from('matches')
            .select('id')
            .or(`and(product_a_id.eq.${a},product_b_id.eq.${b}),and(product_a_id.eq.${b},product_b_id.eq.${a})`)
            .maybeSingle()

          if (!existing?.id) {
            const { error: matchErr } = await supabase.from('matches').insert({
              product_a_id: a,
              product_b_id: b,
              status: 'pending',
            })
            if (!matchErr) setToast('Match!')
          } else {
            setToast('Match!')
          }
        }
      }

      setFeed((prev) => prev.slice(1))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Swipe falhou'
      setError(msg)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-1 overflow-hidden">
      <header className="shrink-0">
        <h1 className="font-display text-2xl font-black tracking-tight text-white">
          Swipe
        </h1>
        <p className="mt-0.5 text-sm text-slate-300">
          Escolha um produto seu e faça swipe nos produtos de outras pessoas.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 items-stretch gap-3">
        <aside className="hidden h-full min-h-0 w-[190px] shrink-0 sm:flex sm:flex-col rounded-3xl border border-white/10 bg-bg-900/40 p-3 backdrop-blur">
          <p className="px-2 pb-2 text-xs font-semibold text-slate-300">Seu item</p>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {activeMine.map((p) => {
              const selected = p.id === swiperProductId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSwiperProductId(p.id)}
                  className={`flex w-full items-center gap-2 rounded-2xl border px-2 py-2 text-left transition ${
                    selected
                      ? 'border-white/20 bg-white/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="h-10 w-10 overflow-hidden rounded-xl bg-bg-950/40">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      {p.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {p.condition}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-1 flex-col gap-3 rounded-3xl border border-white/10 bg-bg-900/40 p-3 backdrop-blur">
          <div className="sm:hidden">
            <p className="px-1 pb-2 text-xs font-semibold text-slate-300">
              Seu item
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeMine.map((p) => {
                const selected = p.id === swiperProductId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSwiperProductId(p.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-2xl border px-2 py-2 text-left transition ${
                      selected
                        ? 'border-white/20 bg-white/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-xl bg-bg-950/40">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="max-w-[140px] min-w-0">
                      <p className="truncate text-xs font-semibold text-white">
                        {p.title}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {p.condition}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-bg-950/40">
            {loadingFeed ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-300">
                Carregando…
              </div>
            ) : current ? (
              <div className="relative h-full w-full">
                {current.image_url ? (
                  <img
                    src={current.image_url}
                    alt={current.title}
                    className="h-full w-full object-contain"
                  />
                ) : null}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4">
                  <p className="text-lg font-black text-white">
                    {current.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-200">
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5">
                      {current.condition}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5">
                      {formatBRLFromCents(current.price_cents ?? 0)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5">
                      @{current.profiles?.username ?? 'user'}
                    </span>
                  </div>
                </div>
              </div>
            ) : swiperProductId ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-300">
                Sem mais produtos para swipe.
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-300">
                Selecione um produto seu para começar.
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-3 flex flex-col gap-2 px-3">
              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  {error}
                </div>
              ) : null}
              {toast ? (
                <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white">
                  {toast}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="danger"
              disabled={!swiperProductId || !current || loadingFeed}
              onClick={() => void swipe('pass')}
              type="button"
            >
              ✗ Pass
            </Button>
            <Button
              disabled={!swiperProductId || !current || loadingFeed}
              onClick={() => void swipe('like')}
              type="button"
            >
              ✓ Like
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
