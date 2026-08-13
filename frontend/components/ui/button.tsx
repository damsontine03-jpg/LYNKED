import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold tracking-wide whitespace-nowrap transition-all duration-300 outline-none select-none hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(30,80,50,0.18)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline:
          'border-primary bg-transparent text-primary hover:bg-primary/8',
        secondary:
          'bg-white text-primary border border-transparent hover:bg-white/90',
        ghost:
          'hover:bg-muted hover:text-foreground text-foreground',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 gap-1.5 px-5',
        xs: 'h-6 gap-1 px-3 text-xs',
        sm: 'h-8 gap-1 px-4 text-[0.8rem]',
        lg: 'h-11 gap-2 px-7 text-sm',
        icon: 'size-10',
        'icon-xs': 'size-6',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  render,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  // Support the `asChild` composition pattern by mapping it onto Base UI's
  // `render` prop: the child element becomes the rendered element (e.g. a
  // Next.js <Link>) and its own children become the button's content.
  let renderProp = render
  let content = children
  let nativeButton = true
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ children?: React.ReactNode }>
    content = child.props.children
    renderProp = React.cloneElement(child, { children: undefined })
    // The rendered element (e.g. a Next.js <Link> -> <a>) is not a native
    // <button>, so opt out of Base UI's native-button semantics.
    nativeButton = false
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      render={renderProp}
      nativeButton={nativeButton}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {content}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
