import clsx from 'clsx'
import type { LinkProps } from 'react-router-dom'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'ghost' | 'danger'

type Props = LinkProps & {
  variant?: Variant
}

export default function LinkButton({ className, variant = 'primary', ...props }: Props) {
  return (
    <Link
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition',
        variant === 'primary' &&
          'bg-brand-linear text-bg-950 shadow-card hover:opacity-95',
        variant === 'ghost' &&
          'border border-white/10 bg-white/5 text-white hover:bg-white/10',
        variant === 'danger' &&
          'border border-white/10 bg-red-500/15 text-red-100 hover:bg-red-500/20',
        className,
      )}
      {...props}
    />
  )
}
