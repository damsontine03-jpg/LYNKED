import type { GameInfo } from './types'

export const GAMES: GameInfo[] = [
  { id: 'g-switch', title: 'G Switch', description: 'Flip gravity and keep running. A short break for focus.', category: 'Arcade', accent: 'var(--chart-1)' },
  { id: 'block-blast', title: 'Block Blast', description: 'Clear lines of blocks. Calm, quick rounds.', category: 'Puzzle', accent: 'var(--chart-5)' },
  { id: 'tanker', title: 'Tanker', description: 'Aim, tap, score. Reflexes only. Not on your report.', category: 'Action', accent: 'var(--chart-4)' },
  { id: 'tetris', title: 'Tetris', description: 'Stack falling shapes. One more round, then back to work.', category: 'Puzzle', accent: 'var(--chart-2)' },
  { id: 'puzzle', title: 'Puzzle', description: 'Match pairs of school icons. Memory, not marks.', category: 'Brain', accent: 'var(--chart-3)' },
]
