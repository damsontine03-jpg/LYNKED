'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { groupedClassOptions } from '@/lib/ui-helpers'
import { cn } from '@/lib/utils'

export function MultiPick({
  label,
  options,
  selected,
  onChange,
  extra,
  allowCustom = false,
  customPlaceholder = 'Add your own',
  groups,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  extra?: ReactNode
  allowCustom?: boolean
  customPlaceholder?: string
  groups?: { label: string; options: readonly string[] }[]
}) {
  const [draft, setDraft] = useState('')
  const sections =
    groups?.length
      ? groupedClassOptions([...new Set([...options, ...selected])])
      : [{ label: '', options: [...new Set([...options, ...selected])] }]

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
      <div className="flex flex-col gap-3">
        {sections.map((section) => (
          <div key={section.label || 'all'} className="flex flex-col gap-1.5">
            {section.label ? (
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {section.options.map((option) => {
                const active = selected.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm',
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
          </div>
        ))}
      </div>
      {allowCustom ? (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
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
          <Button type="button" variant="outline" className="sm:shrink-0" onClick={addCustom}>
            Add
          </Button>
        </div>
      ) : null}
      {extra}
    </div>
  )
}
