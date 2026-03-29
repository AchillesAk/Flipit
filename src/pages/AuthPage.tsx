import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !loading
  }, [email, password, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (err) throw err
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        })
        if (err) throw err
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível autenticar'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10 pt-6">
      <header>
        <h1 className="font-display text-3xl font-black tracking-tight text-white">
          {mode === 'login' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Use e-mail e senha. No Supabase, desative confirmação de e-mail.
        </p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            mode === 'login'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            mode === 'signup'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:bg-white/5'
          }`}
        >
          Cadastro
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/10 bg-bg-900/40 p-5 backdrop-blur"
      >
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm text-slate-200">
            E-mail
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </label>
          <label className="grid gap-1 text-sm text-slate-200">
            Senha
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="rounded-xl border border-white/10 bg-bg-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
              placeholder="mínimo 6 caracteres"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </label>
          {error ? (
            <p className="text-sm text-red-200">{error}</p>
          ) : null}
          <Button type="submit" disabled={!canSubmit}>
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </div>
      </form>
    </main>
  )
}
