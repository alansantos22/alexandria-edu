-- ============================================================
-- Migration 021 - Live Classes
-- Aulas ao vivo vinculadas a cohorts (turmas).
-- ============================================================

USE alexandria_edu;

CREATE TABLE IF NOT EXISTS live_classes (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  cohort_id       VARCHAR(36)  NOT NULL,
  course_id       VARCHAR(36)  NULL,                    -- vínculo pedagógico opcional (Course gravado)
  title           VARCHAR(255) NOT NULL,
  theme           VARCHAR(255) NULL,
  description     TEXT         NULL,

  starts_at       TIMESTAMP    NOT NULL,
  duration_min    INT          NOT NULL DEFAULT 60,
  timezone        VARCHAR(64)  NOT NULL DEFAULT 'America/Sao_Paulo',

  provider        ENUM('manual','livekit','jitsi','meet','zoom') NOT NULL DEFAULT 'manual',
  room_id         VARCHAR(255) NULL,                    -- id interno da sala (LiveKit room name etc.)
  external_url    VARCHAR(1000) NULL,                   -- URL real do provedor (NUNCA expor ao cliente)
  recording_url   VARCHAR(1000) NULL,                   -- preenchido pós-aula

  status          ENUM('scheduled','live','ended','cancelled') NOT NULL DEFAULT 'scheduled',
  capacity_override INT        NULL,                    -- se NULL, usa capacity da cohort

  created_by      VARCHAR(36)  NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_lc_cohort  FOREIGN KEY (cohort_id) REFERENCES cohorts (id) ON DELETE CASCADE,
  CONSTRAINT fk_lc_course  FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE SET NULL,
  CONSTRAINT fk_lc_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS m021_idx;
CREATE PROCEDURE m021_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='live_classes' AND INDEX_NAME='IDX_LC_STARTS') THEN
    CREATE INDEX IDX_LC_STARTS ON live_classes (starts_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='live_classes' AND INDEX_NAME='IDX_LC_COHORT_STARTS') THEN
    CREATE INDEX IDX_LC_COHORT_STARTS ON live_classes (cohort_id, starts_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='live_classes' AND INDEX_NAME='IDX_LC_STATUS') THEN
    CREATE INDEX IDX_LC_STATUS ON live_classes (status);
  END IF;
END;
CALL m021_idx();
DROP PROCEDURE IF EXISTS m021_idx;

-- Presença
CREATE TABLE IF NOT EXISTS live_class_attendance (
  id              VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  live_class_id   VARCHAR(36) NOT NULL,
  user_id         VARCHAR(36) NOT NULL,
  joined_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at         TIMESTAMP   NULL,
  watch_seconds   INT         NOT NULL DEFAULT 0,

  CONSTRAINT fk_att_lc   FOREIGN KEY (live_class_id) REFERENCES live_classes (id) ON DELETE CASCADE,
  CONSTRAINT fk_att_user FOREIGN KEY (user_id)       REFERENCES users (id)        ON DELETE CASCADE,
  CONSTRAINT uq_att UNIQUE (live_class_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('021-live-classes.sql', NOW(), 'applied');
