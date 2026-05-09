-- ============================================================
-- Alexandria EDU - Database Schema
-- Engine: MySQL 8.0+ / InnoDB / utf8mb4
-- Padrões: snake_case, UUID, IDX_*, FK_*, UK_*
-- ============================================================

CREATE DATABASE IF NOT EXISTS alexandria_edu
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE alexandria_edu;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  username        VARCHAR(50)  NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('admin','student') NOT NULL DEFAULT 'student',
  is_active       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMP    NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_USERS_EMAIL (email),
  UNIQUE KEY UK_USERS_USERNAME (username),
  xp               INT          NOT NULL DEFAULT 0,
  level            INT          NOT NULL DEFAULT 1,
  streak_days      INT          NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP    NULL,

  INDEX IDX_USERS_ROLE (role),
  INDEX IDX_USERS_IS_ACTIVE (is_active),
  INDEX IDX_USERS_LAST_LOGIN (last_login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id             VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  title          VARCHAR(255) NOT NULL,
  description    TEXT         NULL,
  video_url      VARCHAR(500) NULL,
  material_link  VARCHAR(500) NULL,
  order_index    INT          NOT NULL DEFAULT 0,
  is_published   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_LESSONS_ORDER (order_index),
  INDEX IDX_LESSONS_PUBLISHED (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER LESSON PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id      VARCHAR(36)  NOT NULL,
  lesson_id    VARCHAR(36)  NOT NULL,
  completed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_PROGRESS_USER_LESSON (user_id, lesson_id),
  INDEX IDX_PROGRESS_USER (user_id),
  INDEX IDX_PROGRESS_LESSON (lesson_id),
  CONSTRAINT FK_PROGRESS_USER   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT FK_PROGRESS_LESSON FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SETTINGS (chave/valor)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key_name   VARCHAR(100) NOT NULL,
  value      TEXT         NULL,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FORUM CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  icon        VARCHAR(10)  NOT NULL DEFAULT '💬',
  order_index INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_FORUM_CAT_ORDER (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FORUM TOPICS
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_topics (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  user_id     VARCHAR(36)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NOT NULL,
  views       INT UNSIGNED NOT NULL DEFAULT 0,
  is_pinned   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_FORUM_TOPIC_CAT (category_id),
  INDEX IDX_FORUM_TOPIC_USER (user_id),
  INDEX IDX_FORUM_TOPIC_CREATED (created_at),
  CONSTRAINT FK_FORUM_TOPIC_CATEGORY FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
  CONSTRAINT FK_FORUM_TOPIC_USER     FOREIGN KEY (user_id)     REFERENCES users(id)            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FORUM POSTS (respostas)
-- ============================================================
CREATE TABLE IF NOT EXISTS forum_posts (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id   INT UNSIGNED NOT NULL,
  user_id    VARCHAR(36)  NOT NULL,
  content    TEXT         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_FORUM_POST_TOPIC (topic_id),
  INDEX IDX_FORUM_POST_USER (user_id),
  INDEX IDX_FORUM_POST_CREATED (created_at),
  CONSTRAINT FK_FORUM_POST_TOPIC FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
  CONSTRAINT FK_FORUM_POST_USER  FOREIGN KEY (user_id)  REFERENCES users(id)        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CITY META — one row per user, stores world position & seed
-- ============================================================
CREATE TABLE IF NOT EXISTS city_meta (
  user_id          VARCHAR(36)      NOT NULL,
  city_seed        VARCHAR(36)      NOT NULL,
  world_x          INT              NOT NULL DEFAULT 0,
  world_z          INT              NOT NULL DEFAULT 0,
  city_level       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  total_buildings  INT UNSIGNED     NOT NULL DEFAULT 0,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  UNIQUE KEY UK_CITY_WORLD_POS (world_x, world_z),
  INDEX IDX_CITY_LEVEL (city_level),
  CONSTRAINT FK_CITY_META_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CITY CHUNKS — 16×16 hex-encoded building grid per chunk
-- ============================================================
CREATE TABLE IF NOT EXISTS city_chunks (
  id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id    VARCHAR(36)  NOT NULL,
  chunk_x    SMALLINT     NOT NULL,
  chunk_z    SMALLINT     NOT NULL,
  data_hex   VARCHAR(512) NOT NULL DEFAULT '',
  version    INT UNSIGNED NOT NULL DEFAULT 1,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_CHUNK_POS (user_id, chunk_x, chunk_z),
  INDEX IDX_CHUNK_USER (user_id),
  CONSTRAINT FK_CHUNK_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER VEHICLES — inventory of purchased vehicles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_vehicles (
  id           VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id      VARCHAR(36) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  is_active    TINYINT(1)  NOT NULL DEFAULT 0,
  purchased_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_VEHICLE_TYPE (user_id, vehicle_type),
  INDEX IDX_VEHICLE_USER (user_id),
  CONSTRAINT FK_VEHICLE_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED INICIAL
-- ============================================================
INSERT INTO settings (key_name, value)
VALUES ('live_meeting_url', '')
ON DUPLICATE KEY UPDATE value = value;

INSERT INTO forum_categories (name, description, icon, order_index) VALUES
  ('Dúvidas Gerais',     'Perguntas sobre o conteúdo das aulas',        '❓', 1),
  ('Projetos e Portfólio', 'Compartilhe seus projetos e receba feedback', '🚀', 2),
  ('Recursos e Dicas',   'Links, ferramentas e dicas úteis',            '💡', 3),
  ('Off-topic',          'Conversas livres sobre tecnologia e carreira', '☕', 4)
ON DUPLICATE KEY UPDATE name = name;
