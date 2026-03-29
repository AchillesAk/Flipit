import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Match, Message, Product } from '../types'
import { formatTimeHHMM } from '../lib/format'

export default function ChatPage() {
  const { matchId } = useParams()
  const user = useAuthStore((s) => s.user)
  const [match, setMatch] = useState<Match | null>(null)
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const header = useMemo(() => {
    if (!match) return null
    const a = products[match.product_a_id]
    const b = products[match.product_b_id]
    return { a, b }
  }, [match, products])

  useEffect(() => {
    if (!matchId || !user) return
    let mounted = true
    const userId = user.id

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data: m, error: mErr } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .maybeSingle()
        if (mErr) throw mErr
        if (!m) throw new Error('Match não encontrado')
        if (!mounted) return
        setMatch(m as Match)

        const productIds = [m.product_a_id, m.product_b_id]
        const { data: p, error: pErr } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
        if (pErr) throw pErr
        if (!mounted) return
        const map: Record<string, Product> = {}
        for (const row of (p ?? []) as Product[]) map[row.id] = row
        setProducts(map)

        const { data: msgs, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true })
          .limit(500)
        if (msgErr) throw msgErr
        if (!mounted) return
        setMessages((msgs ?? []) as Message[])

        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('match_id', matchId)
          .is('read_at', null)
          .neq('sender_id', userId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao abrir chat'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    void load()

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row]
          })
          if (row.sender_id !== userId) {
            void supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', row.id)
              .is('read_at', null)
          }
        },
      )
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [matchId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send() {
    if (!matchId || !user) return
    const content = text.trim()
    if (!content) return
    setText('')
    const { error: err } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    })
    if (err) setError(err.message)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 pb-28 pt-2">
      <header className="rounded-3xl border border-white/10 bg-bg-900/40 p-4 backdrop-blur">
        <p className="text-xs text-slate-400">Troca</p>
        <p className="mt-1 truncate text-sm font-semibold text-white">
          {header?.a?.title ?? 'Produto'} ↔ {header?.b?.title ?? 'Produto'}
        </p>
        <div className="mt-3 flex gap-2">
          {header?.a?.image_url ? (
            <img
              src={header.a.image_url}
              alt={header.a.title}
              className="h-10 w-10 rounded-2xl object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-white/10" />
          )}
          {header?.b?.image_url ? (
            <img
              src={header.b.image_url}
              alt={header.b.title}
              className="h-10 w-10 rounded-2xl object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-white/10" />
          )}
        </div>
      </header>

      {error ? <p className="text-sm text-red-200">{error}</p> : null}

      <div className="flex flex-1 flex-col gap-3">
        {loading ? (
          <p className="text-sm text-slate-300">Carregando…</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id
            return (
              <div
                key={m.id}
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                  mine
                    ? 'self-end bg-brand-linear font-semibold text-bg-950'
                    : 'self-start bg-white/10 text-slate-100'
                }`}
              >
                {m.content}
                <div
                  className={`mt-1 text-right text-[11px] ${
                    mine ? 'text-bg-950/70' : 'text-slate-300'
                  }`}
                >
                  {formatTimeHHMM(m.created_at)}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
        className="fixed inset-x-0 bottom-[72px] mx-auto flex w-full max-w-[520px] gap-2 px-4"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-bg-900/80 px-4 py-3 text-sm text-white outline-none backdrop-blur focus:border-white/25"
          placeholder="Digite sua mensagem…"
        />
        <Button
          type="submit"
          className="shrink-0 px-5"
          disabled={text.trim().length === 0}
        >
          Enviar
        </Button>
      </form>
    </main>
  )
}
