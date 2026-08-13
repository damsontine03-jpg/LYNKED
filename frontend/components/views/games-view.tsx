'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Heart, Play, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/app-store'
import { relativeTime } from '@/lib/date-utils'
import { GAME_IMAGES } from '@/lib/images'
import { cn } from '@/lib/utils'
import type { GameInfo, User } from '@/lib/types'

export function GamesView({ user: _user }: { user: User }) {
  const { games, gameScores, recordGameScore, toggleGameFavorite } = useAppStore()
  const [playing, setPlaying] = useState<GameInfo | null>(null)
  const [score, setScore] = useState(0)
  const [seconds, setSeconds] = useState(12)
  const [running, setRunning] = useState(false)

  const scoreMap = Object.fromEntries(gameScores.map((g) => [g.game_id, g]))
  const recent = gameScores
    .filter((g) => g.last_played)
    .sort((a, b) => (b.last_played ?? '').localeCompare(a.last_played ?? ''))
  const favorites = gameScores.filter((g) => g.favorite)

  useEffect(() => {
    if (!running) return
    if (seconds <= 0) {
      setRunning(false)
      if (playing) recordGameScore(playing.id, score)
      return
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, seconds, playing, score, recordGameScore])

  function start(game: GameInfo) {
    setPlaying(game)
    setScore(0)
    setSeconds(12)
    setRunning(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">Games</h1>
        <p className="text-sm text-muted-foreground">
          A short break between lessons. Scores stay here. They never affect grades.
        </p>
      </div>

      {recent.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recently played
          </h2>
          <div className="flex flex-wrap gap-2">
            {recent.map((g) => {
              const info = games.find((x) => x.id === g.game_id)
              return info ? (
                <Badge key={g.game_id} variant="secondary">
                  {info.title} · {relativeTime(g.last_played!)}
                </Badge>
              ) : null
            })}
          </div>
        </section>
      ) : null}

      {favorites.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Favorites
          </h2>
          <p className="text-sm text-muted-foreground">
            {favorites
              .map((g) => games.find((x) => x.id === g.game_id)?.title)
              .filter(Boolean)
              .join(', ')}
          </p>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const s = scoreMap[game.id]
          return (
            <Card key={game.id} className="flex flex-col gap-3 overflow-hidden p-0">
              <div className="relative h-36 w-full overflow-hidden bg-muted">
                {GAME_IMAGES[game.id] ? (
                  <Image
                    src={GAME_IMAGES[game.id]}
                    alt={game.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center text-3xl font-semibold"
                    style={{ backgroundColor: `${game.accent}22`, color: game.accent }}
                  >
                    {game.title.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 px-5 pb-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{game.title}</h3>
                  <p className="text-xs text-muted-foreground">{game.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleGameFavorite(game.id)}
                  aria-label="Favorite"
                  className={cn(
                    'rounded-full p-2 [&_svg]:size-4',
                    s?.favorite ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <Heart className={s?.favorite ? 'fill-current' : ''} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{game.category}</Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3" />
                  Best {s?.high_score ?? 0}
                </span>
              </div>
              <Button onClick={() => start(game)}>
                <Play />
                Play
              </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Dialog
        open={Boolean(playing)}
        onOpenChange={(open) => {
          if (!open) {
            setPlaying(null)
            setRunning(false)
          }
        }}
        title={playing?.title ?? 'Game'}
        description="Tap the board. Highest score this round is saved to Fun Zone only."
      >
        {playing ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {running ? `${seconds}s left` : seconds <= 0 ? 'Round over' : 'Ready'}
            </p>
            <button
              type="button"
              disabled={!running}
              onClick={() => setScore((n) => n + (playing.id === 'puzzle' ? 2 : 1))}
              className="flex size-40 items-center justify-center rounded-3xl border border-border bg-muted text-3xl font-semibold transition-transform active:scale-95 disabled:opacity-50"
              style={{ color: playing.accent }}
            >
              {score}
            </button>
            {!running && seconds <= 0 ? (
              <p className="text-sm">
                You scored {score}. Personal best: {Math.max(score, scoreMap[playing.id]?.high_score ?? 0)}
              </p>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => {
                setScore(0)
                setSeconds(12)
                setRunning(true)
              }}
            >
              Play again
            </Button>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
