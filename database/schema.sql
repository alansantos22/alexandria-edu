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
-- SETTINGS (chave/valor)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  key_name   VARCHAR(100) NOT NULL,
  value      TEXT         NULL,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED INICIAL
-- ============================================================
INSERT INTO settings (key_name, value)
VALUES ('live_meeting_url', '')
ON DUPLICATE KEY UPDATE value = value;
