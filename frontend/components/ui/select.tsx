import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// A native <select> styled to match the design system. Native gives us
// accessible keyboard + mobile behaviour for free.
function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className={cn('relative w-full', className)}>
      <select
        data-slot="select"
        className={cn(
          'flex h-11 w-full appearance-none rounded-md border border-input bg-white px-3 pr-9 text-base transition-colors outline-none sm:h-10 sm:text-sm',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { Select }
