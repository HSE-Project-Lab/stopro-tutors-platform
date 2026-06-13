-- Reply support for chat messages

ALTER TABLE chat_messages
    ADD COLUMN reply_to_id UUID;

ALTER TABLE chat_messages
    ADD CONSTRAINT fk_messages_reply_to FOREIGN KEY (reply_to_id)
        REFERENCES chat_messages (id) ON DELETE SET NULL;

CREATE INDEX idx_messages_reply_to ON chat_messages (reply_to_id);
