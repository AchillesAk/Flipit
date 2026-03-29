import { useAuthStore } from '../stores/authStore'
import { useMyProducts } from '../hooks/useMyProducts'
import ProductCard from '../components/ProductCard'
import LinkButton from '../components/ui/LinkButton'

export default function DashboardPage() {
  const signOut = useAuthStore((s) => s.signOut)
  const { items, loading, error, setActive } = useMyProducts()

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10 pt-2">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-white">
            Seus produtos
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Gerencie o que você quer trocar.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Sair
          </button>
          <LinkButton to="/produto/novo">Adicionar</LinkButton>
        </div>
      </header>

      <div className="flex gap-2">
        <LinkButton to="/swipe" className="w-full flex-1" variant="ghost">
          Ir para Swipe
        </LinkButton>
        <LinkButton to="/matches" className="w-full flex-1" variant="ghost">
          Ver Matches
        </LinkButton>
      </div>

      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-300">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-bg-900/40 p-5 backdrop-blur">
          <p className="text-sm text-slate-300">
            Você ainda não cadastrou nenhum produto.
          </p>
          <div className="mt-4">
            <LinkButton to="/produto/novo">Adicionar agora</LinkButton>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              right={
                <button
                  type="button"
                  onClick={() => void setActive(p.id, !p.is_active)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  {p.is_active ? 'Desativar' : 'Ativar'}
                </button>
              }
            />
          ))}
        </div>
      )}
    </main>
  )
}
