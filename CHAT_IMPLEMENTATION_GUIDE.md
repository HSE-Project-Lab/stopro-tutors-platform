# Система Чатов - Руководство по Реализации

## 📋 Обзор

Реализована полнофункциональная система чатов в реальном времени для образовательной платформы СТОПРО с поддержкой:

- **Личных чатов** (1:1 между учителем и учеником)
- **Групповых чатов** (учитель + несколько учеников)
- **WebSocket коммуникации** через STOMP протокол
- **Редактирования и удаления сообщений** с отметками
- **Закрепленных сообщений** (только учителя)
- **Читов/прочтения сообщений** в реальном времени
- **Поиска по сообщениям** с полнотекстовым поиском PostgreSQL

## 🗄️ Структура Базы Данных

### Основные таблицы:

```sql
chats                           # Base table (SINGLE_TABLE inheritance)
├── chat_type (PERSONAL | GROUP)
├── teacher_id
├── chat_name
├── chat_avatar_url
├── status (ACTIVE | ARCHIVED | PENDING_DELETION)
└── last_message_at

personal_chats                  # 1:1 with Chat
├── chat_id
└── student_id

group_chats                     # 1:1 with Chat & StudyGroup
├── chat_id
├── study_group_id
└── next_group_number

chat_participants               # Who participates in chat
├── chat_id
├── user_id
├── joined_at
├── last_read_at
└── left_at

chat_messages                   # Messages in chats
├── chat_id
├── sender_id
├── message_type (TEXT | SYSTEM)
├── content
├── content_plain (for search)
├── is_edited
├── pinned_by_id
├── pinned_at
└── read_receipts (one-to-many)

message_attachments             # Files in messages
├── message_id
├── file_url
├── file_type (IMAGE | VIDEO)
├── file_name
└── file_size_mb

message_read_receipts           # Read status tracking
├── message_id
├── user_id
└── read_at

chat_inactivity_warnings        # Auto-deletion tracking
├── chat_id
├── warning_sent_at
├── scheduled_deletion_at
└── warning_dismissed
```

## 🔧 Backend Компоненты

### Java Entities (`ru.stopro.domain.entity`)

- **Chat** - базовая сущность с наследованием (SINGLE_TABLE)
- **PersonalChat** - расширение Chat для личных чатов
- **GroupChat** - расширение Chat для групповых чатов
- **ChatMessage** - сообщения в чате
- **ChatParticipant** - участники чата
- **MessageAttachment** - вложения (изображения/видео)
- **MessageReadReceipt** - отслеживание прочтения
- **ChatInactivityWarning** - предупреждения об удалении

### Enums (`ru.stopro.domain.enums`)

- **ChatType** - PERSONAL, GROUP
- **ChatStatus** - ACTIVE, ARCHIVED, PENDING_DELETION
- **ChatMessageType** - TEXT, SYSTEM
- **AttachmentType** - IMAGE, VIDEO

### Repositories (`ru.stopro.repository.chat`)

- **ChatRepository** - управление чатами
- **PersonalChatRepository** - личные чаты
- **GroupChatRepository** - групповые чаты
- **ChatMessageRepository** - сообщения (с полнотекстовым поиском)
- **ChatParticipantRepository** - участники
- **MessageReadReceiptRepository** - статусы прочтения
- **ChatInactivityWarningRepository** - предупреждения

### Services (`ru.stopro.service.chat`)

#### ChatService
```java
// Управление чатами
getOrCreatePersonalChat(teacherId, studentId)
createGroupChat(teacherId, request)
updateGroupChatName(chatId, teacherId, request)
addStudentToGroupChat(chatId, studentId, teacherId)
removeStudentFromGroupChat(chatId, studentId, teacherId)
deleteGroupChat(chatId, teacherId)

// Получение данных
getTeacherPersonalChats(teacherId)
getTeacherGroupChats(teacherId)
getStudentChats(studentId)
getChatHistory(chatId, page, pageSize)
searchMessages(chatId, query, page, pageSize)
getPinnedMessages(chatId)

// Статус
countUnreadMessages(chatId, userId)
markMessagesAsRead(chatId, userId)
```

#### ChatMessageService
```java
// Управление сообщениями
sendMessage(chatId, senderId, content)
editMessage(messageId, editorId, newContent)
deleteMessage(messageId, deleterId)
pinMessage(messageId, teacherId)
unpinMessage(messageId, teacherId)
markMessageAsRead(messageId, userId)

// Вложения
addAttachment(messageId, fileUrl, fileType, fileName, fileSizeMb)

// Системные сообщения
createSystemMessage(chatId, content)
```

### Controllers

#### ChatWebSocketController (`@MessageMapping`)
Обработка STOMP сообщений в реальном времени:

```java
@MessageMapping("/chat/{chatId}/send")
@MessageMapping("/chat/{chatId}/edit/{messageId}")
@MessageMapping("/chat/{chatId}/delete/{messageId}")
@MessageMapping("/chat/{chatId}/pin/{messageId}")
@MessageMapping("/chat/{chatId}/unpin/{messageId}")
@MessageMapping("/chat/{chatId}/mark-read/{messageId}")
@MessageMapping("/chat/{chatId}/mark-all-read")
```

#### ChatController (`@RestController`)
REST API для управления чатами:

```java
POST   /api/v1/chats/personal/{studentId}     # Получить/создать личный чат
GET    /api/v1/chats/personal                 # Все личные чаты учителя
GET    /api/v1/chats/groups                   # Все групповые чаты учителя
GET    /api/v1/chats                          # Чаты ученика
POST   /api/v1/chats/groups                   # Создать групповой чат
PUT    /api/v1/chats/groups/{chatId}          # Обновить групповой чат
DELETE /api/v1/chats/groups/{chatId}          # Удалить групповой чат
POST   /api/v1/chats/{chatId}/students/{id}   # Добавить ученика
DELETE /api/v1/chats/{chatId}/students/{id}   # Удалить ученика
GET    /api/v1/chats/{chatId}/messages        # История сообщений
GET    /api/v1/chats/{chatId}/messages/search # Поиск сообщений
GET    /api/v1/chats/{chatId}/pinned-messages # Закрепленные сообщения
POST   /api/v1/chats/{chatId}/mark-read       # Пометить как прочитано
GET    /api/v1/chats/{chatId}/unread-count    # Считать непрочитанные
```

### WebSocket Configuration

**WebSocketConfig** - конфигурация STOMP + SockJS:

```java
registerStompEndpoints("/api/v1/ws/chat")
configureMessageBroker()  // /topic, /queue, /app, /user
```

**JwtWebSocketInterceptor** - аутентификация через JWT токен в заголовке `Authorization`

## 🎨 Frontend Компоненты

### Типы (`src/types/chat.ts`)

```typescript
Chat, PersonalChat, GroupChat
ChatMessage, MessageAttachment, ChatParticipant
SendMessageRequest, EditMessageRequest, CreateGroupChatRequest
```

### Zustand Store (`src/store/chatStore.ts`)

```typescript
selectedChatId, chatType
personalChats, groupChats
messages, pinnedMessages
isLoading, error, searchQuery

Actions:
setSelectedChat, setPersonalChats, setGroupChats
addMessage, updateMessage, deleteMessage
markMessageAsRead, setPinnedMessages
clearChatMessages, reset
```

### WebSocket Service (`src/lib/websocket.ts`)

Singleton для управления STOMP соединением:

```typescript
connect(token)
disconnect()
sendMessage(chatId, content)
editMessage(chatId, messageId, content)
deleteMessage(chatId, messageId)
pinMessage(chatId, messageId)
unpinMessage(chatId, messageId)
markMessageAsRead(chatId, messageId)
subscribeToChatMessages(chatId, handler)
subscribeToReadReceipts(chatId, messageId, handler)
subscribeToPrivateMessages(handler)
isConnected()
```

### Pages

**ChatsPage** (`src/pages/ChatsPage.tsx`)
- Список чатов (личные/групповые)
- Поиск по чатам
- Создание групповых чатов (для учителей)
- Выбор чата для открытия

### Components

**ChatWindow** (`src/components/chat/ChatWindow.tsx`)
- Отображение сообщений
- Ввод и отправка сообщений
- Удаление сообщений
- Автоматическая прокрутка

**CreateGroupChatModal** (`src/components/chat/CreateGroupChatModal.tsx`)
- Ввод названия группы
- Выбор участников
- Создание группового чата

## 🔐 Безопасность

### Проверки Прав:

1. **Учитель может:**
   - Просматривать все свои личные и групповые чаты
   - Создавать/обновлять/удалять групповые чаты
   - Добавлять/удалять учеников из чатов
   - Редактировать и удалять любые сообщения
   - Закреплять/откреплять сообщения

2. **Ученик может:**
   - Видеть только свои чаты
   - Отправлять сообщения
   - Редактировать только свои сообщения
   - Удалять только свои сообщения

3. **WebSocket:**
   - JWT токен передается в заголовке `Authorization`
   - Проверка в `JwtWebSocketInterceptor`
   - Таймауты и переподключение включены

## 📊 Основные Особенности

### Сообщения

- ✅ Текстовые с форматированием (bold, italic, underline, strikethrough, lists)
- ✅ Вложения (изображения/видео до 50MB/500MB)
- ✅ Максимум 4096 символов на сообщение
- ✅ Отметка "изменено" после редактирования
- ✅ Мягкое удаление (заменяется на "Сообщение удалено")

### Статусы

- ✅ "Отправлено" (галочка)
- ✅ "Прочитано" (двойная галочка)
- ✅ Отслеживание читателей
- ✅ Непрочитанные счетчики

### Закрепленные Сообщения

- ✅ Только учителя могут закреплять
- ✅ Несколько одновременно
- ✅ Отдельный раздел в UI

### Поиск

- ✅ Полнотекстовый поиск в чате (PostgreSQL GIN индекс)
- ✅ Поиск в списке чатов
- ✅ Результаты в реальном времени

### Системные Сообщения

Автоматически создаются при:
- Создании группового чата
- Добавлении ученика
- Удалении ученика
- Изменении названия
- Закреплении сообщения

### История и Очистка

- ✅ История хранится 1 год после последней активности
- ✅ Предупреждение за неделю до удаления
- ✅ Возможность отменить удаление
- ✅ Автоматическое удаление пустых чатов

## 🚀 Развертывание

### Dependencies (pom.xml)
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### Frontend (package.json)
```json
"@stomp/stompjs": "^7.0.0",
"sockjs-client": "^1.6.1"
```

### Миграция БД

Flyway миграция: `V16__create_chat_system.sql`

```bash
./mvnw flyway:migrate
```

## 📝 API Примеры

### Создание группового чата

```bash
POST /api/v1/chats/groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "chatName": "Группа 1",
  "chatAvatarUrl": null,
  "studentIds": ["uuid1", "uuid2", "uuid3"],
  "existingGroupId": null
}
```

### Отправка сообщения (WebSocket)

```javascript
// Подключиться
webSocketService.connect(token, () => {
  console.log('Connected');
});

// Отправить сообщение
webSocketService.sendMessage('chat-id', 'Привет, всем!');

// Подписаться на сообщения
webSocketService.subscribeToChatMessages('chat-id', (message) => {
  console.log('New message:', message);
});
```

### Получение истории

```bash
GET /api/v1/chats/{chatId}/messages?page=0&pageSize=50
Authorization: Bearer {token}
```

## ⚙️ Конфигурация

### application.yml

```yaml
spring:
  # ... existing config ...
  
  # WebSocket работает на же порту как и REST API (8080)
  # STOMP endpoint: /api/v1/ws/chat
  # Требуется JWT в заголовке Authorization
```

## 🐛 Известные Ограничения

1. ❌ Голосовые сообщения - в следующей версии
2. ❌ Синхронизация между браузерами в разных вкладках - надо добавить SharedWorker
3. ⚠️  Полнотекстовый поиск только на русском - нужна индексация SymSpell
4. ⚠️  Нет шифрования сообщений end-to-end - плановое улучшение

## 🔄 Следующие Шаги

### Phase 2 - Улучшения

1. **Медиа-плеер**
   - Встроенный плеер для видео
   - Превью изображений
   - Загрузка файлов напрямую

2. **Реакции на сообщения**
   - Emoji реакции
   - Счетчик реакций

3. **Печатание...**
   - Индикатор "печатает..."
   - Использовать /topic/chat/{id}/typing

4. **Голосовые сообщения**
   - WebRTC для записи
   - Трансляция через WebSocket

5. **Менеджмент чатов**
   - Архивирование вместо удаления
   - Экспорт истории
   - Backup сообщений

## 📚 Документация

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- API docs: `http://localhost:8080/v3/api-docs`

---

**Версия**: 1.0.0  
**Дата**: 2 июня 2026  
**Автор**: GitHub Copilot

