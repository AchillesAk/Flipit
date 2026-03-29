import clsx from 'clsx'
import type { Product } from '../types'

export default function ProductCard({
  product,
  right,
  subtitle,
}: {
  product: Product
  right?: React.ReactNode
  subtitle?: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-bg-900/40 backdrop-blur">
      <div className="aspect-[4/3] w-full bg-bg-950/40">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {product.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span
              className={clsx(
                'rounded-full border px-2 py-0.5',
                product.is_active
                  ? 'border-white/10 bg-white/5'
                  : 'border-white/10 bg-white/5 opacity-60',
              )}
            >
              {product.condition}
            </span>
            {product.category ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                {product.category}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <div className="mt-2 text-xs text-slate-400">{subtitle}</div>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  )
}
