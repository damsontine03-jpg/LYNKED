import Image from 'next/image'
import { cn } from '@/lib/utils'
import { IMAGES } from '@/lib/images'

const sizes = {
  sm: { className: 'h-12 sm:h-14', width: 220, height: 220 },
  md: { className: 'h-14 sm:h-16', width: 280, height: 280 },
  lg: { className: 'h-24 sm:h-28', width: 400, height: 400 },
  xl: { className: 'h-28 sm:h-36', width: 480, height: 480 },
} as const

export function BrandLogo({
  className,
  size = 'md',
  priority = false,
}: {
  className?: string
  size?: keyof typeof sizes
  priority?: boolean
}) {
  const spec = sizes[size]
  return (
    <Image
      src={IMAGES.logo}
      alt="LynkED"
      width={spec.width}
      height={spec.height}
      priority={priority}
      className={cn('w-auto bg-transparent object-contain', spec.className, className)}
    />
  )
}
