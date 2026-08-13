-- PostgreSQL schema for Neon.
-- Applied automatically when DATABASE_URL is set (local or Render).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  class_name TEXT NOT NULL,
  class_names TEXT,
  subjects TEXT,
  verification_key TEXT
);

CREATE TABLE IF NOT EXISTS homework (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  assigned_by TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_cards (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id),
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  term TEXT NOT NULL,
  average REAL NOT NULL,
  overall_grade TEXT NOT NULL,
  position INTEGER NOT NULL,
  teacher_remark TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_card_results (
  id TEXT PRIMARY KEY,
  report_card_id TEXT NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  score INTEGER NOT NULL,
  grade TEXT NOT NULL,
  remark TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'assignment', 'deadline', 'status', 'message', 'announcement',
      'grade', 'event', 'exam', 'submission'
    )
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0 CHECK (read IN (0, 1))
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  UNIQUE (teacher_id, student_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'teacher')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_reads (
  user_id TEXT NOT NULL REFERENCES users(id),
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  read_at TEXT NOT NULL,
  PRIMARY KEY (user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_homework_teacher ON homework(teacher_id);
CREATE INDEX IF NOT EXISTS idx_homework_student ON homework(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  teacher_name TEXT NOT NULL,
  student_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  teacher_name TEXT NOT NULL,
  class_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  instructions TEXT,
  attachment_name TEXT,
  attachment_size TEXT,
  posted_at TEXT NOT NULL,
  due_date TEXT NOT NULL,
  max_marks INTEGER NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  teacher_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id),
  student_name TEXT NOT NULL,
  file_name TEXT,
  file_size TEXT,
  comment TEXT,
  submitted_at TEXT,
  status TEXT NOT NULL CHECK (
    status IN ('not_submitted', 'submitted', 'late', 'graded')
  ),
  score INTEGER,
  feedback TEXT,
  graded_at TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  organizer TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1))
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration TEXT NOT NULL,
  room TEXT NOT NULL,
  class_name TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1))
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  date TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'important')),
  author TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1))
);

CREATE TABLE IF NOT EXISTS game_scores (
  user_id TEXT NOT NULL REFERENCES users(id),
  game_id TEXT NOT NULL,
  high_score INTEGER NOT NULL DEFAULT 0,
  last_played TEXT,
  favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
  PRIMARY KEY (user_id, game_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_name);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_class ON exams(class_name);

CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signin', 'signup')),
  name TEXT,
  role TEXT,
  class_name TEXT,
  class_names TEXT,
  subjects TEXT,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS class_names TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subjects TEXT;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS class_names TEXT;
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS subjects TEXT;
