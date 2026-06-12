-- Chat System Schema

-- ===== Chat Tables (SINGLE_TABLE Inheritance) =====

-- Main Chat table (polymorphic - handles both PERSONAL and GROUP chats)
CREATE TABLE chats (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_type       VARCHAR(30)  NOT NULL,  -- PERSONAL, GROUP (discriminator)
    teacher_id      UUID         NOT NULL,
    chat_name       VARCHAR(255),           -- NULL for personal chats, required for group chats
    chat_avatar_url VARCHAR(500),          -- NULL for personal chats, uses default avatar
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    last_message_at TIMESTAMP,

    -- PersonalChat specific columns
    student_id      UUID,                   -- FK to student user (only for PERSONAL chats)

    -- GroupChat specific columns
    study_group_id  UUID,                   -- FK to study group (only for GROUP chats)
    next_group_number INTEGER DEFAULT 1,   -- For auto-naming groups

    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    version         BIGINT       NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_chats_teacher FOREIGN KEY (teacher_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_chats_student FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_chats_study_group FOREIGN KEY (study_group_id)
        REFERENCES study_groups (id) ON DELETE CASCADE
);

CREATE INDEX idx_chats_teacher      ON chats (teacher_id);
CREATE INDEX idx_chats_type         ON chats (chat_type);
CREATE INDEX idx_chats_status       ON chats (status);
CREATE INDEX idx_chats_last_message ON chats (last_message_at);
CREATE INDEX idx_chats_student      ON chats (student_id);
CREATE INDEX idx_chats_study_group  ON chats (study_group_id);

-- ===== Chat Participants =====

CREATE TABLE chat_participants (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id      UUID     NOT NULL,
    user_id      UUID     NOT NULL,
    joined_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMP,
    left_at      TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    version      BIGINT    NOT NULL DEFAULT 0,
    is_deleted   BOOLEAN   NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_chat_participants_chat FOREIGN KEY (chat_id)
        REFERENCES chats (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_participants_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_chat_participants UNIQUE (chat_id, user_id)
);

CREATE INDEX idx_chat_participants_chat ON chat_participants (chat_id);
CREATE INDEX idx_chat_participants_user ON chat_participants (user_id);
CREATE INDEX idx_chat_participants_last_read ON chat_participants (last_read_at);

-- ===== Chat Messages =====

CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id         UUID        NOT NULL,
    sender_id       UUID        NOT NULL,
    message_type    VARCHAR(30) NOT NULL DEFAULT 'TEXT',  -- TEXT, SYSTEM
    content         TEXT        NOT NULL,
    content_plain   TEXT,                                 -- For search
    is_edited       BOOLEAN     NOT NULL DEFAULT FALSE,
    edited_at       TIMESTAMP,
    pinned_by_id    UUID,                                 -- NULL if not pinned, UUID of teacher who pinned
    pinned_at       TIMESTAMP,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    version         BIGINT      NOT NULL DEFAULT 0,
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_messages_chat        FOREIGN KEY (chat_id)
        REFERENCES chats (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender      FOREIGN KEY (sender_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_messages_pinned_by   FOREIGN KEY (pinned_by_id)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_messages_chat         ON chat_messages (chat_id);
CREATE INDEX idx_messages_sender       ON chat_messages (sender_id);
CREATE INDEX idx_messages_created_at   ON chat_messages (created_at);
CREATE INDEX idx_messages_chat_created ON chat_messages (chat_id, created_at);
CREATE INDEX idx_messages_type         ON chat_messages (message_type);
CREATE INDEX idx_messages_pinned       ON chat_messages (pinned_by_id);
CREATE INDEX idx_messages_content_plain ON chat_messages USING GIN (to_tsvector('russian', content_plain));

-- ===== Message Attachments =====

CREATE TABLE message_attachments (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id    UUID         NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    file_type     VARCHAR(30)  NOT NULL,  -- IMAGE, VIDEO
    file_name     VARCHAR(255) NOT NULL,
    file_size_mb  DOUBLE PRECISION,
    width         INTEGER,                 -- For images/videos
    height        INTEGER,
    duration_sec  INTEGER,                 -- For videos
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    version       BIGINT       NOT NULL DEFAULT 0,
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_attachments_message FOREIGN KEY (message_id)
        REFERENCES chat_messages (id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_message ON message_attachments (message_id);
CREATE INDEX idx_attachments_type    ON message_attachments (file_type);

-- ===== Read Receipts =====

CREATE TABLE message_read_receipts (
                                       id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                       message_id UUID      NOT NULL,
                                       user_id    UUID      NOT NULL,
                                       read_at    TIMESTAMP NOT NULL DEFAULT NOW(),
                                       created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                                       updated_at TIMESTAMP,
                                       version    BIGINT    NOT NULL DEFAULT 0,
                                       is_deleted BOOLEAN   NOT NULL DEFAULT FALSE,

                                       CONSTRAINT fk_read_receipts_message FOREIGN KEY (message_id)
                                           REFERENCES chat_messages (id) ON DELETE CASCADE,
                                       CONSTRAINT fk_read_receipts_user    FOREIGN KEY (user_id)
                                           REFERENCES users (id) ON DELETE CASCADE,
                                       CONSTRAINT uq_read_receipts UNIQUE (message_id, user_id)
);

CREATE INDEX idx_read_receipts_message ON message_read_receipts (message_id);
CREATE INDEX idx_read_receipts_user    ON message_read_receipts (user_id);

-- ===== Chat Inactivity Tracking =====

CREATE TABLE chat_inactivity_warnings (
                                          id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                          chat_id         UUID      NOT NULL,
                                          warning_sent_at TIMESTAMP NOT NULL,
                                          scheduled_deletion_at TIMESTAMP NOT NULL,
                                          warning_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
                                          created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
                                          updated_at      TIMESTAMP,
                                          version         BIGINT    NOT NULL DEFAULT 0,
                                          is_deleted      BOOLEAN   NOT NULL DEFAULT FALSE,

                                          CONSTRAINT fk_inactivity_chat FOREIGN KEY (chat_id)
                                              REFERENCES chats (id) ON DELETE CASCADE,
                                          CONSTRAINT uq_inactivity_chat UNIQUE (chat_id, warning_sent_at)
);

CREATE INDEX idx_inactivity_chat ON chat_inactivity_warnings (chat_id);
CREATE INDEX idx_inactivity_scheduled_deletion ON chat_inactivity_warnings (scheduled_deletion_at);

-- ===== Ensure teacher_id column exists in users table =====
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='teacher_id'
    ) THEN
        ALTER TABLE users ADD COLUMN teacher_id UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_user_teacher ON users (teacher_id);
    END IF;
END $$;

