-- ============================================================
-- Migration 007 — Content Hierarchy
-- Trilha → Curso → Módulo → Aula → Prova
-- Engine: MySQL 8.0+ / InnoDB
-- ============================================================

USE alexandria_edu;

-- ── Pre-validation ──────────────────────────────────────────

-- Verificar se tabelas já existem antes de criar
SELECT COUNT(*) INTO @trails_exists
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'trails';

SELECT COUNT(*) INTO @courses_exists
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses';

SELECT COUNT(*) INTO @course_modules_exists
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_modules';

SELECT COUNT(*) INTO @quizzes_exists
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quizzes';

-- ── 1. TRAILS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trails (
  id              VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  title           VARCHAR(255)  NOT NULL,
  description     TEXT          NULL,
  thumbnail_url   VARCHAR(500)  NULL,
  order_index     INT           NOT NULL DEFAULT 0,
  is_published    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_TRAILS_ORDER (order_index),
  INDEX IDX_TRAILS_PUBLISHED (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. COURSES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courses (
  id              VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  trail_id        VARCHAR(36)   NOT NULL,
  title           VARCHAR(255)  NOT NULL,
  description     TEXT          NULL,
  thumbnail_url   VARCHAR(500)  NULL,
  order_index     INT           NOT NULL DEFAULT 0,
  is_published    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_COURSES_TRAIL (trail_id),
  INDEX IDX_COURSES_ORDER (order_index),
  INDEX IDX_COURSES_PUBLISHED (is_published),
  CONSTRAINT FK_COURSES_TRAIL FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. COURSE MODULES ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS course_modules (
  id              VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  course_id       VARCHAR(36)   NOT NULL,
  title           VARCHAR(255)  NOT NULL,
  description     TEXT          NULL,
  order_index     INT           NOT NULL DEFAULT 0,
  is_published    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_MOD_COURSE (course_id),
  INDEX IDX_MOD_ORDER (order_index),
  INDEX IDX_MOD_PUBLISHED (is_published),
  CONSTRAINT FK_MOD_COURSE FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Garantir FK de lessons → course_modules ──────────────
-- A coluna module_id já existe na tabela lessons (migration 003).
-- Adicionamos a FK apenas se ainda não existir.

SELECT COUNT(*) INTO @fk_lesson_mod_exists
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
  AND TABLE_NAME = 'lessons'
  AND CONSTRAINT_NAME = 'FK_LESSONS_MODULE';

SET @add_fk_sql = IF(
  @fk_lesson_mod_exists = 0,
  'ALTER TABLE lessons ADD CONSTRAINT FK_LESSONS_MODULE FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE fk_stmt FROM @add_fk_sql;
EXECUTE fk_stmt;
DEALLOCATE PREPARE fk_stmt;

-- ── 5. QUIZZES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quizzes (
  id                   VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  module_id            VARCHAR(36)   NOT NULL,
  title                VARCHAR(255)  NOT NULL,
  description          TEXT          NULL,
  time_window_seconds  INT           NOT NULL DEFAULT 45,
  passing_score        TINYINT       NOT NULL DEFAULT 70
                         CHECK (passing_score BETWEEN 0 AND 100),
  is_published         BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_QUIZ_MODULE (module_id),
  CONSTRAINT FK_QUIZ_MODULE FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. QUIZ QUESTIONS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS quiz_questions (
  id                VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  quiz_id           VARCHAR(36)   NOT NULL,
  text              TEXT          NOT NULL,
  order_index       INT           NOT NULL DEFAULT 0,
  review_lesson_id  VARCHAR(36)   NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_QQST_QUIZ (quiz_id),
  INDEX IDX_QQST_ORDER (order_index),
  CONSTRAINT FK_QQST_QUIZ          FOREIGN KEY (quiz_id)          REFERENCES quizzes(id)  ON DELETE CASCADE,
  CONSTRAINT FK_QQST_REVIEW_LESSON FOREIGN KEY (review_lesson_id) REFERENCES lessons(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. QUIZ OPTIONS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quiz_options (
  id           VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  question_id  VARCHAR(36)   NOT NULL,
  text         VARCHAR(500)  NOT NULL,
  is_correct   BOOLEAN       NOT NULL DEFAULT FALSE,
  order_index  INT           NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  INDEX IDX_QOPT_QUESTION (question_id),
  CONSTRAINT FK_QOPT_QUESTION FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. USER QUIZ ATTEMPTS ───────────────────────────────────

CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
  user_id       VARCHAR(36)   NOT NULL,
  quiz_id       VARCHAR(36)   NOT NULL,
  score         TINYINT       NOT NULL DEFAULT 0,
  passed        BOOLEAN       NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_ATTEMPT_USER (user_id),
  INDEX IDX_ATTEMPT_QUIZ (quiz_id),
  CONSTRAINT FK_ATTEMPT_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT FK_ATTEMPT_QUIZ FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Registro ─────────────────────────────────────────────────

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('007-content-hierarchy.sql', NOW(), 'applied');
