import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import type { ProductCondition } from '../types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function NewProductPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState<ProductCondition>('novo')
  const [priceBRL, setPriceBRL] = useState('')
  const [acceptAny, setAcceptAny] = useState(true)
  const [acceptMinBRL, setAcceptMinBRL] = useState('')
  const [acceptMaxBRL, setAcceptMaxBRL] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priceCents = useMemo(() => {
    const normalized = priceBRL.replace(/\./g, '').replace(',', '.')
    const n = Number(normalized)
    if (!Number.isFinite(n) || n <= 0) return null
    return Math.round(n * 100)
  }, [priceBRL])

  const acceptMinCents = useMemo(() => {
    if (acceptAny) return null
    const normalized = acceptMinBRL.replace(/\./g, '').replace(',', '.')
    const n = Number(normalized)
    if (!Number.isFinite(n) || n <= 0) return null
    return Math.round(n * 100)
  }, [acceptAny, acceptMinBRL])

  const acceptMaxCents = useMemo(() => {
    if (acceptAny) return null
    const normalized = acceptMaxBRL.replace(/\./g, '').replace(',', '.')
    const n = Number(normalized)
    if (!Number.isFinite(n) || n <= 0) return null
    return Math.round(n * 100)
  }, [acceptAny, acceptMaxBRL])

  const canSave = useMemo(() => {
    if (title.trim().length <= 2) return false
    if (!file) return false
    if (!priceCents) return false
    if (!acceptAny) {
      if (!acceptMinCents || !acceptMaxCents) return false
      if (acceptMinCents > acceptMaxCents) return false
    }
    return !loading
  }, [title, file, loading, priceCents, acceptAny, acceptMinCents, acceptMaxCents])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!file) return
    if (!priceCents) {
      setError('Informe o valor do produto')
      return
    }
    if (!acceptAny) {
      if (!acceptMinCents || !acceptMaxCents) {
        setError('Informe o valor mínimo e máximo que você aceita')
        return
      }
      if (acceptMinCents > acceptMaxCents) {
        setError('O mínimo não pode ser maior que o máximo')
        return
      }
    }
    setError(null)
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const uuid =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`
      const path = `${user.id}/${uuid}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('products')
        .upload(path, file, { upsert: false })
      if (uploadErr) throw new Error(`Upload falhou: ${uploadErr.message}`)

      const { data: publicData } = supabase.storage
        .from('products')
        .getPublicUrl(path)
      const image_url = publicData.publicUrl

      const { data: profileRow, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      if (profileErr) throw new Error(`Perfil: ${profileErr.message}`)
      if (!profileRow) {
        const username =
          user.email?.split('@')[0]?.trim() || `user${user.id.slice(0, 6)}`
        const { error: createProfileErr } = await supabase
          .from('profiles')
          .insert({ id: user.id, username })
        if (createProfileErr)
          throw new Error(`Criar perfil: ${createProfileErr.message}`)
      }

      const { error: insertErr } = await supabase.from('products').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        category: category.trim() ? category.trim() : null,
        condition,
        price_cents: priceCents,
        accept_any: acceptAny,
        accept_min_cents: acceptAny ? null : acceptMinCents,
        accept_max_cents: acceptAny ? null : acceptMaxCents,
        image_url,
        is_active: true,
      })
      if (insertErr) throw new Error(`Salvar produto falhou: ${insertErr.message}`)

      navigate('/dashboard', { replace: true })
    } catch (err) {
      const anyErr = err as { message?: string } | null
      setError(anyErr?.message || 'Não foi possível salvar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10 pt-2">
      <header>
        <h1 className="font-display text-2xl font-black tracking-tight text-white">
          Novo produto
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          Título, descrição, categoria, condição e foto.
        </p>
      </header>

      <form
        onSubmit={handleSave}
        className="rounded-3xl border border-white/10 bg-bg-900/40 p-5 backdrop-blur"
      >
        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
            placeholder="Título"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-28 resize-none rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
            placeholder="Descrição"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
              placeholder="Categoria"
            />
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ProductCondition)}
              className="rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
            >
              <option value="novo">Novo</option>
              <option value="seminovo">Seminovo</option>
              <option value="usado">Usado</option>
            </select>
          </div>

          <label className="grid gap-1 text-sm text-slate-200">
            Valor estimado (R$)
            <input
              inputMode="decimal"
              value={priceBRL}
              onChange={(e) => setPriceBRL(e.target.value)}
              className="rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
              placeholder="Ex: 120,00"
            />
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">
                Aceito troca em aberto
              </p>
              <button
                type="button"
                onClick={() => setAcceptAny((v) => !v)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
                  acceptAny
                    ? 'border-white/10 bg-white/10'
                    : 'border-white/10 bg-bg-950/40'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white transition ${
                    acceptAny ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Se desligado, você define uma faixa de valores que aceita em troca.
            </p>

            {!acceptAny ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs text-slate-300">
                  Mín (R$)
                  <input
                    inputMode="decimal"
                    value={acceptMinBRL}
                    onChange={(e) => setAcceptMinBRL(e.target.value)}
                    className="rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                    placeholder="Ex: 80,00"
                  />
                </label>
                <label className="grid gap-1 text-xs text-slate-300">
                  Máx (R$)
                  <input
                    inputMode="decimal"
                    value={acceptMaxBRL}
                    onChange={(e) => setAcceptMaxBRL(e.target.value)}
                    className="rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
                    placeholder="Ex: 150,00"
                  />
                </label>
              </div>
            ) : null}
          </div>
          <label className="grid gap-2 text-sm text-slate-200">
            Foto
            <input
              type="file"
              accept="image/*"
              className="text-sm text-slate-300"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          <Button type="submit" disabled={!canSave}>
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </main>
  )
}
