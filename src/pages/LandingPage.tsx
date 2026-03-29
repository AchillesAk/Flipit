import LinkButton from '../components/ui/LinkButton'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-8 pb-10 pt-6">
      <div className="rounded-3xl border border-white/10 bg-bg-900/40 p-6 shadow-card backdrop-blur">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
          Tinder de trocas
        </div>
        <h1 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-tight text-white">
          FLIPIT
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Cadastre produtos que você não quer mais e faça swipe para trocar com
          pessoas perto de você. Matchou? Abre o chat e combina a troca.
        </p>

        <div className="mt-6 flex w-full flex-col gap-3">
          <LinkButton to="/auth" className="w-full">
            Criar conta / Entrar
          </LinkButton>
          <LinkButton to="/dashboard" className="w-full" variant="ghost">
            Ir para o app
          </LinkButton>
        </div>
      </div>
    </main>
  )
}
