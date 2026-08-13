'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function MultiPick({
  label,
  options,
  selected,
  onChange,
  extra,
  allowCustom = false,
  customPlaceholder = 'Add your own',
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  extra?: ReactNode
  allowCustom?: boolean
  customPlaceholder?: string
}) {
  const [draft, setDraft] = useState('')
  const chips = [...new Set([...options, ...selected])]

  function toggle(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    )
  }

  function addCustom() {
    const value = draft.trim()
    if (!value) return
    if (!selected.includes(value)) onChange([...selected, value])
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={active}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-white text-foreground hover:bg-muted',
              )}
            >
              {option}
            </button>
          )
        })}
      </div>
      {allowCustom ? (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
            placeholder={customPlaceholder}
          />
          <Button type="button" variant="outline" onClick={addCustom}>
            Add
          </Button>
        </div>
      ) : null}
      {extra}
    </div>
  )
}
