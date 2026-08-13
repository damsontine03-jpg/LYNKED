-- Demo roster, homework, report cards, notifications and chat.
-- Due dates and timestamps are relative to "now" so the dashboard
-- still looks current whenever the database is first created.

INSERT INTO users (id, name, email, phone, role, class_name, verification_key) VALUES
  ('user-teacher-1', 'Mr. Kamara', 'kamara@school.edu', '', 'teacher', 'SSS 2', 'demo'),
  ('user-student-1', 'Mariama', 'mariama@school.edu', '', 'student', 'SSS 2', 'demo'),
  ('user-student-2', 'Ibrahim', 'ibrahim@school.edu', '', 'student', 'SSS 2', 'demo'),
  ('user-student-3', 'Fatmata', 'fatmata@school.edu', '', 'student', 'SSS 2', 'demo'),
  ('user-student-4', 'Sahr', 'sahr@school.edu', '', 'student', 'SSS 2', 'demo');

-- Photosynthesis lab report (due tomorrow)
INSERT INTO homework (id, title, description, subject, due_date, status, assigned_by, teacher_id, student_id, priority, created_at) VALUES
  ('hw-1-1', 'Photosynthesis lab report', 'Write up the results of the leaf starch experiment. Include a labelled diagram and a short conclusion.', 'Biology', date('now', '+1 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-1', 'high', datetime('now')),
  ('hw-1-2', 'Photosynthesis lab report', 'Write up the results of the leaf starch experiment. Include a labelled diagram and a short conclusion.', 'Biology', date('now', '+1 day'), 'completed', 'Mr. Kamara', 'user-teacher-1', 'user-student-2', 'high', datetime('now')),
  ('hw-1-3', 'Photosynthesis lab report', 'Write up the results of the leaf starch experiment. Include a labelled diagram and a short conclusion.', 'Biology', date('now', '+1 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-3', 'high', datetime('now')),
  ('hw-1-4', 'Photosynthesis lab report', 'Write up the results of the leaf starch experiment. Include a labelled diagram and a short conclusion.', 'Biology', date('now', '+1 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-4', 'high', datetime('now'));

-- Balancing chemical equations (due in 3 days)
INSERT INTO homework (id, title, description, subject, due_date, status, assigned_by, teacher_id, student_id, priority, created_at) VALUES
  ('hw-2-1', 'Balancing chemical equations', 'Complete questions 1-15 on page 84 of the workbook.', 'Chemistry', date('now', '+3 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-1', 'medium', datetime('now')),
  ('hw-2-2', 'Balancing chemical equations', 'Complete questions 1-15 on page 84 of the workbook.', 'Chemistry', date('now', '+3 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-2', 'medium', datetime('now')),
  ('hw-2-3', 'Balancing chemical equations', 'Complete questions 1-15 on page 84 of the workbook.', 'Chemistry', date('now', '+3 day'), 'completed', 'Mr. Kamara', 'user-teacher-1', 'user-student-3', 'medium', datetime('now'));

-- Newton's laws worksheet (due in 6 days)
INSERT INTO homework (id, title, description, subject, due_date, status, assigned_by, teacher_id, student_id, priority, created_at) VALUES
  ('hw-3-1', 'Newton''s laws worksheet', 'Answer all short-response questions and show your working.', 'Physics', date('now', '+6 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-1', 'low', datetime('now')),
  ('hw-3-2', 'Newton''s laws worksheet', 'Answer all short-response questions and show your working.', 'Physics', date('now', '+6 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-4', 'low', datetime('now'));

-- Cell structure flashcards (due yesterday)
INSERT INTO homework (id, title, description, subject, due_date, status, assigned_by, teacher_id, student_id, priority, created_at) VALUES
  ('hw-4-1', 'Cell structure flashcards', 'Create flashcards for each organelle and its function.', 'Biology', date('now', '-1 day'), 'completed', 'Mr. Kamara', 'user-teacher-1', 'user-student-1', 'medium', datetime('now')),
  ('hw-4-2', 'Cell structure flashcards', 'Create flashcards for each organelle and its function.', 'Biology', date('now', '-1 day'), 'completed', 'Mr. Kamara', 'user-teacher-1', 'user-student-2', 'medium', datetime('now')),
  ('hw-4-3', 'Cell structure flashcards', 'Create flashcards for each organelle and its function.', 'Biology', date('now', '-1 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-3', 'medium', datetime('now'));

-- Periodic table quiz prep (due in 9 days)
INSERT INTO homework (id, title, description, subject, due_date, status, assigned_by, teacher_id, student_id, priority, created_at) VALUES
  ('hw-5-1', 'Periodic table quiz prep', 'Revise the first 20 elements and their symbols.', 'Chemistry', date('now', '+9 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-1', 'medium', datetime('now')),
  ('hw-5-2', 'Periodic table quiz prep', 'Revise the first 20 elements and their symbols.', 'Chemistry', date('now', '+9 day'), 'pending', 'Mr. Kamara', 'user-teacher-1', 'user-student-2', 'medium', datetime('now'));

-- Ecosystem field notes (due 3 days ago)
INSERT INTO homework (id, title, description, subject, due_date, status, assigned_by, teacher_id, student_id, priority, created_at) VALUES
  ('hw-6-1', 'Ecosystem field notes', 'Summarise the food web observed during the school garden visit.', 'Biology', date('now', '-3 day'), 'completed', 'Mr. Kamara', 'user-teacher-1', 'user-student-1', 'low', datetime('now')),
  ('hw-6-2', 'Ecosystem field notes', 'Summarise the food web observed during the school garden visit.', 'Biology', date('now', '-3 day'), 'completed', 'Mr. Kamara', 'user-teacher-1', 'user-student-4', 'low', datetime('now'));

INSERT INTO report_cards (id, student_id, student_name, class_name, term, average, overall_grade, position, teacher_remark, published, updated_at) VALUES
  ('rc-1', 'user-student-1', 'Mariama', 'SSS 2', 'First Term', 75.6, 'B2', 2, 'A strong, consistent term. Keep pushing in Mathematics.', 1, datetime('now', '-3 day')),
  ('rc-2', 'user-student-2', 'Ibrahim', 'SSS 2', 'First Term', 72.6, 'B2', 1, 'Excellent results across the board. Well done, Ibrahim.', 1, datetime('now', '-3 day')),
  ('rc-3', 'user-student-3', 'Fatmata', 'SSS 2', 'First Term', 62.6, 'C4', 3, 'Good progress. More lab practice will lift your science grades.', 0, datetime('now', '-3 day')),
  ('rc-4', 'user-student-4', 'Sahr', 'SSS 2', 'First Term', 57.0, 'C5', 4, 'Steady effort. Focus on Mathematics next term.', 0, datetime('now', '-3 day'));

INSERT INTO report_card_results (id, report_card_id, subject, score, grade, remark) VALUES
  ('rcr-1-1', 'rc-1', 'Biology', 84, 'A1', 'Excellent'),
  ('rcr-1-2', 'rc-1', 'Chemistry', 76, 'B2', 'Excellent'),
  ('rcr-1-3', 'rc-1', 'Physics', 71, 'B2', 'Excellent'),
  ('rcr-1-4', 'rc-1', 'Mathematics', 68, 'B3', 'Good'),
  ('rcr-1-5', 'rc-1', 'English', 79, 'B2', 'Excellent'),
  ('rcr-2-1', 'rc-2', 'Biology', 72, 'B2', 'Excellent'),
  ('rcr-2-2', 'rc-2', 'Chemistry', 81, 'A1', 'Excellent'),
  ('rcr-2-3', 'rc-2', 'Physics', 66, 'B3', 'Good'),
  ('rcr-2-4', 'rc-2', 'Mathematics', 74, 'B2', 'Excellent'),
  ('rcr-2-5', 'rc-2', 'English', 70, 'B2', 'Excellent'),
  ('rcr-3-1', 'rc-3', 'Biology', 65, 'B3', 'Good'),
  ('rcr-3-2', 'rc-3', 'Chemistry', 60, 'C4', 'Good'),
  ('rcr-3-3', 'rc-3', 'Physics', 58, 'C5', 'Good'),
  ('rcr-3-4', 'rc-3', 'Mathematics', 62, 'C4', 'Good'),
  ('rcr-3-5', 'rc-3', 'English', 68, 'B3', 'Good'),
  ('rcr-4-1', 'rc-4', 'Biology', 58, 'C5', 'Good'),
  ('rcr-4-2', 'rc-4', 'Chemistry', 54, 'C6', 'Fair'),
  ('rcr-4-3', 'rc-4', 'Physics', 61, 'C4', 'Good'),
  ('rcr-4-4', 'rc-4', 'Mathematics', 49, 'D7', 'Fair'),
  ('rcr-4-5', 'rc-4', 'English', 63, 'C4', 'Good');

INSERT INTO notifications (id, user_id, type, title, body, created_at, read) VALUES
  ('n-1', 'user-student-1', 'assignment', 'New homework: Photosynthesis lab report', 'Mr. Kamara assigned a new Biology task due tomorrow.', datetime('now', '-35 minutes'), 0),
  ('n-2', 'user-student-1', 'deadline', 'Deadline approaching', 'Balancing chemical equations is due in 3 days.', datetime('now', '-190 minutes'), 0),
  ('n-3', 'user-student-1', 'message', 'Message from Mr. Kamara', 'Remember to include a labelled diagram in your report.', datetime('now', '-320 minutes'), 0),
  ('n-4', 'all', 'announcement', 'Mid-term break', 'School closes for mid-term on Friday. Submit pending work before then.', datetime('now', '-20 hours'), 1),
  ('n-5', 'user-student-1', 'status', 'Homework marked complete', 'Your "Cell structure flashcards" was recorded as completed.', datetime('now', '-26 hours'), 1);

INSERT INTO conversations (id, teacher_id, student_id) VALUES
  ('conv-user-teacher-1-user-student-1', 'user-teacher-1', 'user-student-1'),
  ('conv-user-teacher-1-user-student-2', 'user-teacher-1', 'user-student-2'),
  ('conv-user-teacher-1-user-student-3', 'user-teacher-1', 'user-student-3'),
  ('conv-user-teacher-1-user-student-4', 'user-teacher-1', 'user-student-4');

INSERT INTO messages (id, conversation_id, sender_id, sender_role, body, created_at) VALUES
  ('m-1', 'conv-user-teacher-1-user-student-1', 'user-teacher-1', 'teacher', 'Hi Mariama, how is the photosynthesis report coming along?', datetime('now', '-90 minutes')),
  ('m-2', 'conv-user-teacher-1-user-student-1', 'user-student-1', 'student', 'Almost done sir! Just finishing the diagram.', datetime('now', '-84 minutes')),
  ('m-3', 'conv-user-teacher-1-user-student-1', 'user-teacher-1', 'teacher', 'Great. Remember to label each part clearly.', datetime('now', '-80 minutes')),
  ('m-4', 'conv-user-teacher-1-user-student-2', 'user-student-2', 'student', 'Sir, can I submit the chemistry work tomorrow morning?', datetime('now', '-45 minutes'));
