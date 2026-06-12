# Быстрый Старт - Система Чатов

## 🚀 Установка и Запуск

### 1. Backend

```bash
cd backend

# Собрать проект
mvn clean install

# Запустить приложение
mvn spring-boot:run

# или через Docker
docker-compose up -d stopro-backend
```

Убедитесь, что:
- PostgreSQL работает и БД `stopro` создана
- Redis работает на `localhost:6379`
- Миграция V16 выполнена (создала таблицы чатов)

### 2. Frontend

```bash
# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Приложение откроется на http://localhost:5173
```

## 🧪 Тестирование

### 1. Создание тестовых пользователей

Перейдите на http://localhost:5173/login и создайте:
- **Учитель** (email: teacher@example.com, пароль: pass123)
- **Ученик 1** (email: student1@example.com, пароль: pass123)
- **Ученик 2** (email: student2@example.com, пароль: pass123)

### 2. Тестирование Личных Чатов

**Как Учитель:**
1. Откройте боковое меню → **Чаты**
2. Перейдите на вкладку **Личные**
3. Нажмите на ученика
4. Введите сообщение и отправьте

**Как Ученик:**
1. Откройте боковое меню → **Чаты**
2. Откроется личный чат с учителем
3. Отправьте ответное сообщение

### 3. Тестирование Групповых Чатов

**Как Учитель:**
1. Откройте вкладку **Групповые чаты**
2. Нажмите кнопку **Создать группу**
3. Введите название (например, "Группа Математики")
4. Нажмите **Далее**
5. Выберите учеников
6. Нажмите **Создать**

**Как Ученик (в этой группе):**
1. Откройте чаты
2. Найдите группу в списке
3. Участвуйте в групповом чате

### 4. Тестирование Функций

#### Отправка сообщения
```
Просто введите текст и нажмите Enter или кнопку "Отправить"
```

#### Редактирование сообщения
```
Наведите на сообщение и нажмите иконку редактирования
(В следующей версии)
```

#### Удаление сообщения
```
Наведите на сообщение и нажмите иконку удаления (🗑️)
Сообщение будет заменено на "Сообщение удалено"
```

#### Закрепление сообщения (только учитель)
```
Наведите на сообщение и нажмите иконку закрепления (📌)
Закрепленное сообщение будет видно в разделе "Закрепленные"
```

#### Поиск сообщений
```
В чате используйте поле поиска
Результаты обновляются в реальном времени
```

#### Пометка как прочитано
```
Когда вы откроете чат, сообщения автоматически помечаются как прочитанные
Счетчик непрочитанных исчезнет из списка чатов
```

## 🔍 Тестирование WebSocket

### Через консоль браузера

```javascript
// Откройте DevTools (F12)

// 1. Посмотрите WebSocket соединение
// Network → WS → /api/v1/ws/chat

// 2. Проверьте логи
console.log('WebSocket ready');

// 3. Отправьте тестовое сообщение
// Оно должно появиться в реальном времени всем участникам чата
```

### Тест в двух окнах браузера

1. Откройте два окна/вкладки браузера
2. В одном залогинитесь как учитель, в другом как ученик
3. Откройте один и тот же чат в обоих
4. Отправьте сообщение от одного - оно должно появиться у другого в реальном времени

## 🐛 Отладка

### Логи Backend

```bash
# Посмотреть логи
docker logs stopro-backend

# или в IDE
# Смотрите Application.log в консоли
```

### Логи Frontend

```javascript
// В консоли браузера (F12)
// Будут логи WebSocket событий
// Примеры:
// "WebSocket connected"
// "Message sent to chat ..."
// "Message received: ..."
```

### Проверить WebSocket

```bash
# Проверить, что WebSocket endpoint доступен
curl -i http://localhost:8080/api/v1/ws/chat

# Должно вернуть 400 (потому что это WebSocket, не HTTP)
# Это нормально!
```

### Проверить STOMP

```bash
# Через wscat (установите: npm install -g wscat)
wscat -c ws://localhost:8080/api/v1/ws/chat

# Должно подключиться к WebSocket
# Введите STOMP команду (в следующей версии добавим тестовый CLI)
```

## 📊 Примеры API Запросов

### Получить все личные чаты

```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:8080/api/v1/chats/personal
```

### Получить все групповые чаты

```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  http://localhost:8080/api/v1/chats/groups
```

### Создать групповой чат

```bash
curl -X POST \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "chatName": "Группа Математики",
    "chatAvatarUrl": null,
    "studentIds": ["uuid1", "uuid2"],
    "existingGroupId": null
  }' \
  http://localhost:8080/api/v1/chats/groups
```

### Получить историю сообщений

```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  "http://localhost:8080/api/v1/chats/{chatId}/messages?page=0&pageSize=50"
```

### Поиск сообщений

```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  "http://localhost:8080/api/v1/chats/{chatId}/messages/search?query=привет"
```

## 🚨 Типичные Проблемы

### Проблема: WebSocket не подключается

**Решение:**
1. Проверьте, что токен валидный
2. Убедитесь, что Authorization заголовок передается правильно
3. Посмотрите сервер логи на ошибки аутентификации
4. Проверьте CORS конфигурацию

### Проблема: Сообщения не отправляются

**Решение:**
1. Проверьте WebSocket соединение в DevTools
2. Убедитесь, что сообщение не пусто
3. Проверьте длину сообщения (макс 4096)
4. Посмотрите ошибки в консоли браузера

### Проблема: Старые сообщения не видны

**Решение:**
1. Проверьте параметры page и pageSize
2. Убедитесь, что чат существует
3. Проверьте права доступа к чату

### Проблема: Непрочитанные счетчики не обновляются

**Решение:**
1. Обновите страницу вручную
2. Проверьте, что WebSocket подключен
3. Убедитесь, что сообщение прошло (не было удалено)

## 📝 Заметки для Разработчика

### Файлы которые нужно отслеживать при обновлениях:

Backend:
- `/backend/src/main/resources/db/migration/V16__create_chat_system.sql`
- `/backend/src/main/java/ru/stopro/domain/entity/Chat*.java`
- `/backend/src/main/java/ru/stopro/service/chat/*.java`
- `/backend/src/main/java/ru/stopro/controller/ChatController.java`
- `/backend/src/main/java/ru/stopro/controller/ws/ChatWebSocketController.java`

Frontend:
- `/src/pages/ChatsPage.tsx`
- `/src/components/chat/*.tsx`
- `/src/store/chatStore.ts`
- `/src/lib/websocket.ts`
- `/src/types/chat.ts`

### Git commits для отката

```bash
# Если что-то сломалось, можно откатить до предыдущей версии
git log --oneline | grep -i chat
git revert {commit-hash}
```

## 🎓 Обучающие ресурсы

- Spring WebSocket: https://spring.io/guides/gs/messaging-stomp-websocket/
- STOMP Protocol: https://stomp.github.io/
- SockJS: https://github.com/sockjs/sockjs-client
- PostgreSQL FTS: https://www.postgresql.org/docs/current/textsearch.html

---

**Успешного тестирования! 🎉**

Если возникли проблемы, смотрите CHAT_IMPLEMENTATION_GUIDE.md для подробной информации.

