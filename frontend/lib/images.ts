export const IMAGES = {
  logo: '/logo.png',
  homework: '/illustrations/homework.jpg',
  classroom: '/illustrations/classroom.jpg',
  zoo: '/illustrations/zoo.jpg',
  playground: '/illustrations/playground.jpg',
  crosswalk: '/illustrations/crosswalk.jpg',
  chess: '/illustrations/chess.jpg',
  studyGames: '/illustrations/study-games.jpg',
  timetable: '/illustrations/timetable.jpg',
  schedule: '/illustrations/schedule.jpg',
  backToSchool: '/illustrations/back-to-school.jpg',
  flyingPencil: '/illustrations/flying-pencil.jpg',
  blocks: '/illustrations/blocks.jpg',
  abdul: '/team/abdul-salim-gani.png',
  john: '/team/john-conteh.png',
  joshua: '/team/joshua-turay.png',
} as const

export const GAME_IMAGES: Record<string, string> = {
  'g-switch': IMAGES.playground,
  'block-blast': IMAGES.blocks,
  tanker: IMAGES.chess,
  tetris: IMAGES.studyGames,
  puzzle: IMAGES.schedule,
}

export const EVENT_IMAGES: Record<string, string> = {
  'Science Fair': IMAGES.classroom,
  'Sports Day': IMAGES.playground,
  'Parent Meeting': IMAGES.homework,
  'Cultural Day': IMAGES.backToSchool,
  'Debate Competition': IMAGES.studyGames,
  'School Trip': IMAGES.zoo,
}
