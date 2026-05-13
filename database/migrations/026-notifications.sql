-- ============================================================
-- Migration 026 - Notifications (in-app + email + scheduled)
-- ============================================================

USE alexandria_edu;

CREATE TABLE IF NOT EXISTS notifications (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id     VARCHAR(36)  NOT NULL,
  type        VARCHAR(60)  NOT NULL,             -- live_class_reminder, recording_available, promo_available...
  title       VARCHAR(255) NOT NULL,
  body        TEXT         NULL,
  link        VARCHAR(500) NULL,
  payload     JSON         NULL,
  read_at     TIMESTAMP    NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS m026_idx;
CREATE PROCEDURE m026_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notifications' AND INDEX_NAME='IDX_NOTIF_USER_READ') THEN
    CREATE INDEX IDX_NOTIF_USER_READ ON notifications (user_id, read_at);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='notifications' AND INDEX_NAME='IDX_NOTIF_TYPE') THEN
    CREATE INDEX IDX_NOTIF_TYPE ON notifications (type);
  END IF;
END;
CALL m026_idx();
DROP PROCEDURE IF EXISTS m026_idx;

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id            VARCHAR(36) NOT NULL PRIMARY KEY,
  in_app_enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  email_enabled      BOOLEAN     NOT NULL DEFAULT TRUE,
  remind_60min       BOOLEAN     NOT NULL DEFAULT TRUE,
  remind_15min       BOOLEAN     NOT NULL DEFAULT TRUE,
  promo_emails       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_pref_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id             VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  live_class_id  VARCHAR(36) NOT NULL,
  kind           ENUM('reminder_60min','reminder_15min','starting','recording_available') NOT NULL,
  scheduled_for  TIMESTAMP   NOT NULL,
  sent_at        TIMESTAMP   NULL,
  created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_sched_lc FOREIGN KEY (live_class_id) REFERENCES live_classes (id) ON DELETE CASCADE,
  CONSTRAINT uq_sched UNIQUE (live_class_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS m026_sched_idx;
CREATE PROCEDURE m026_sched_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='scheduled_notifications' AND INDEX_NAME='IDX_SCHED_DUE') THEN
    CREATE INDEX IDX_SCHED_DUE ON scheduled_notifications (scheduled_for, sent_at);
  END IF;
END;
CALL m026_sched_idx();
DROP PROCEDURE IF EXISTS m026_sched_idx;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('026-notifications.sql', NOW(), 'applied');
