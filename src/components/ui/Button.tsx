import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export default function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-60',
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
