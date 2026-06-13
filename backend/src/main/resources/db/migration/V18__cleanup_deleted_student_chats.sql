-- Разовая очистка данных, осиротевших из-за прежней версии удаления ученика:
-- мягко удалённые ученики (users.is_deleted = TRUE) оставались в личных и групповых чатах.

-- 1. Удаляем личные чаты с удалёнными учениками.
--    Каскад (ON DELETE CASCADE) уберёт сообщения, участников, квитанции прочтения,
--    вложения и предупреждения о неактивности этих чатов.
DELETE FROM chats c
USING users u
WHERE c.chat_type = 'PERSONAL'
  AND c.student_id = u.id
  AND u.is_deleted = TRUE;

-- 2. Убираем удалённых учеников из состава учебных групп.
DELETE FROM group_students gs
USING users u
WHERE gs.student_id = u.id
  AND u.is_deleted = TRUE;

-- 3. Убираем удалённых учеников из участников оставшихся (групповых) чатов.
DELETE FROM chat_participants cp
USING users u
WHERE cp.user_id = u.id
  AND u.is_deleted = TRUE;

-- 4. Удаляем учебные группы, в которых после очистки не осталось ни одного ученика
--    и при этом существует групповой чат. Каскад по chats.study_group_id снесёт
--    сам групповой чат с его сообщениями и участниками; у связанных заданий
--    ссылка на группу обнуляется (assignments.group_id ON DELETE SET NULL).
DELETE FROM study_groups sg
WHERE NOT EXISTS (
        SELECT 1 FROM group_students gs WHERE gs.group_id = sg.id
      )
  AND EXISTS (
        SELECT 1 FROM chats c WHERE c.study_group_id = sg.id AND c.chat_type = 'GROUP'
      );
