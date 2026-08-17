'use client'

import { Select } from '@/components/ui/select'
import { groupedClassOptions } from '@/lib/ui-helpers'

export function ClassSelect({
  names,
  ...props
}: React.ComponentProps<typeof Select> & { names?: string[] }) {
  const groups = groupedClassOptions(names)
  return (
    <Select {...props}>
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  )
}
