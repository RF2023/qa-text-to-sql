-- QA Text-to-SQL schema
-- Tables: bugs, test_cases, releases

CREATE TABLE IF NOT EXISTS releases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  version     TEXT    NOT NULL UNIQUE,
  status      TEXT    NOT NULL CHECK(status IN ('planned', 'in_progress', 'released', 'cancelled')),
  released_at TEXT
);

CREATE TABLE IF NOT EXISTS bugs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  severity    TEXT    NOT NULL CHECK(severity IN ('critical', 'high', 'medium', 'low')),
  status      TEXT    NOT NULL CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
  reporter    TEXT    NOT NULL,
  release_id  INTEGER REFERENCES releases(id),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS test_cases (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  bug_id     INTEGER REFERENCES bugs(id),
  status     TEXT    NOT NULL CHECK(status IN ('pass', 'fail', 'pending', 'blocked')),
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Seed data (INSERT OR IGNORE keeps this idempotent on restart)
INSERT OR IGNORE INTO releases (id, version, status, released_at) VALUES
  (1, 'v1.0.0', 'released',    '2024-01-15'),
  (2, 'v1.1.0', 'released',    '2024-03-01'),
  (3, 'v1.2.0', 'in_progress', NULL),
  (4, 'v2.0.0', 'planned',     NULL);

INSERT OR IGNORE INTO bugs (id, title, severity, status, reporter, release_id, created_at) VALUES
  (1, 'Login button unresponsive on mobile',   'high',     'open',        'alice',   1, '2024-01-10'),
  (2, 'Export to CSV crashes for large data',  'critical', 'in_progress', 'bob',     1, '2024-01-20'),
  (3, 'Dashboard charts not rendering Safari', 'medium',   'resolved',    'charlie', 2, '2024-02-05'),
  (4, 'Incorrect totals in quarterly report',  'high',     'open',        'alice',   2, '2024-02-18'),
  (5, 'Password reset email delay',            'low',      'closed',      'dave',    2, '2024-03-02'),
  (6, 'API rate limiting not enforced',        'critical', 'open',        'bob',     3, '2024-03-10'),
  (7, 'Dark mode toggle breaks layout',        'medium',   'open',        'charlie', 3, '2024-03-15'),
  (8, 'Search results pagination off by one',  'low',      'resolved',    'alice',   3, '2024-03-20');

INSERT OR IGNORE INTO test_cases (id, title, bug_id, status, created_at) VALUES
  (1,  'Login on iOS Safari',        1, 'fail',    '2024-01-11'),
  (2,  'Login on Android Chrome',    1, 'fail',    '2024-01-11'),
  (3,  'Export 1 000-row CSV',       2, 'fail',    '2024-01-21'),
  (4,  'Export 100-row CSV',         2, 'pass',    '2024-01-21'),
  (5,  'Dashboard load Safari 17',   3, 'pass',    '2024-02-06'),
  (6,  'Quarterly report Q1 totals', 4, 'fail',    '2024-02-19'),
  (7,  'Rate limit 100 req/min',     6, 'fail',    '2024-03-11'),
  (8,  'Rate limit 60 req/min',      6, 'pending', '2024-03-11'),
  (9,  'Dark mode on desktop',       7, 'fail',    '2024-03-16'),
  (10, 'Pagination page 2',          8, 'pass',    '2024-03-21');
