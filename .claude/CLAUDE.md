# CLAUDE.md — СТОПРО Tutors Platform

## Обзор проекта

**СТОПРО** — EdTech платформа для подготовки к профильной математике (ЕГЭ).

Три роли: `TEACHER` (репетитор), `STUDENT` (ученик), `ADMIN`.

### Стек

| Слой | Технологии |
|------|-----------|
| Backend | Java 21, Spring Boot 3, Spring Security (JWT), Spring Data JPA, WebSocket (STOMP) |
| Frontend | React + TypeScript, Zustand, Vite, Tailwind CSS |
| AI-сервис | Python FastAPI (заглушки: OCR, проверка ответов, рекомендации) |
| БД | PostgreSQL |

---

## Архитектура

### Backend (`backend/src/main/java/ru/stopro/`)

```
controller/          — REST-контроллеры (AuthController, TeacherController, EgeTaskController, GroupController, ChatController, ...)
controller/ws/       — WebSocket-контроллеры (ChatWebSocketController)
service/             — бизнес-логика (AuthService, AssignmentService, TeacherService, GroupService, ChatMessageService, ...)
domain/entity/       — JPA-сущности
domain/enums/        — перечисления
dto/                 — DTO-слой (auth/, assignment/, chat/, student/, group/, ...)
repository/          — Spring Data JPA репозитории
config/              — конфигурация (Security, WebSocket, CORS, DemoDataLoader)
```

**Ключевые сущности:**

- `User` — учитель/ученик/администратор; реализует `UserDetails`; поле `teacher` (ученик привязан к репетитору)
- `Assignment` — тест/домашнее задание; связывает учителя, ученика, список `EgeTask`
- `EgeTask` — задача базы ЕГЭ (номер, тема, сложность, источник)
- `Chat` — базовый класс чата (`SINGLE_TABLE`, дискриминатор `chat_type`); учитель — владелец
  - `PersonalChat` — чат один-на-один (учитель + ученик)
  - `GroupChat` — групповой чат (учитель + учебная группа)
- `ChatMessage` — сообщение; поддерживает TEXT и SYSTEM-типы, редактирование, закрепление, `MessageReadReceipt`
- `Group` — учебная группа учителя, содержит учеников

**Безопасность:** JWT access/refresh tokens. `@PreAuthorize("hasAnyAuthority('TEACHER', ...)")` на уровне контроллеров.

### Frontend (`src/`)

```
App.tsx              — рутинг через activeTab (Zustand appStore), нет react-router
pages/               — страницы: TeacherDashboard, StudentDashboard, ChatsPage, HomeworkPage, TasksPage, AnalyticsPage, ...
components/layout/   — Layout, Sidebar (nav по ролям)
store/               — authStore (user, JWT), appStore (activeTab, sidebar)
types/               — TypeScript-интерфейсы (chat.ts, ...)
```

Навигация — `activeTab` в `appStore`. Роли определяют доступные пункты меню и компоненты.

### AI-сервис (`ai-service/`)

FastAPI с тремя заглушками: `/check-answer`, `/recognize` (OCR), `/generate` (рекомендации).

---

## Правила кодирования

### Комментарии

**В Java — только JavaDoc на русском языке.** Никаких inline-комментариев (`//`), блочных комментариев (`/* */`) и `TODO`-заметок внутри методов.

Допустимо:
```java
/**
 * Создаёт новую учебную группу для указанного учителя.
 *
 * @param name      название группы
 * @param teacherId идентификатор учителя-владельца
 * @return созданная группа
 */
public GroupResponse createGroup(String name, UUID teacherId) { ... }
```

Запрещено:
```java
// временный хардкод
UUID senderId = UUID.fromString("7ba96475-...");
```

**В TypeScript/TSX** — комментарии не нужны. Имена переменных и функций должны говорить сами за себя.

---

## Правила работы с Codegraph MCP

Codegraph предоставляет граф знаний кодовой базы. Использовать инструменты по назначению:

### Основное правило

**Тяжёлые аналитические команды (`codegraph_callers`, `codegraph_callees`, `codegraph_impact`, `codegraph_files`) разрешены только внутри Explore-субагентов** (запущенных через `Agent(subagent_type="Explore")`).

В основном контексте разговора — только:
- `codegraph_explore` — первичный инструмент для любого исследования кода
- `codegraph_search` — точечный поиск символа по имени
- `codegraph_status` — проверка состояния индекса
- `codegraph_node` — исходник конкретного символа (если `explore` не вернул полный текст)

### Логика выбора инструмента

| Вопрос | Инструмент |
|--------|-----------|
| Как работает X? Где определён X? Архитектура? | `codegraph_explore` |
| Что вызывает X? Что сломается при изменении X? | Explore-субагент → `codegraph_callers` / `codegraph_impact` |
| Что вызывает X внутри модуля? | Explore-субагент → `codegraph_callees` |
| Только найти имя/путь символа | `codegraph_search` |

---

## Бизнес-контекст

- Платформа ориентирована на **репетиторов по математике** и их учеников, готовящихся к ЕГЭ (профильный уровень)
- Учитель создаёт учеников (логины генерируются автоматически), формирует группы, выдаёт задания из базы ЕГЭ-задач
- Задания (`Assignment`) содержат подборку задач `EgeTask` с номерами ЕГЭ, темами и уровнями сложности
- Чаты: учитель инициирует чат с учеником или создаёт групповой чат к учебной группе
- Аналитика: прогресс ученика по темам, успеваемость, динамика выполнения заданий

---

## Бизнес-логика чатов (текущий фокус разработки)

### Создание чатов
Чат создаётся **автоматически** при добавлении ученика или создании группы — ни учитель, ни ученик не могут создать чат напрямую через UI.
- Добавили ученика → создаётся `PersonalChat`
- Создали учебную группу → создаётся `GroupChat`

### ChatInactivityWarning и PENDING_DELETION
Сценарий неактивности:
1. Если в чате **6 месяцев** не было сообщений → в чат добавляется системное сообщение-предупреждение (тип `SYSTEM`), статус чата переходит в `PENDING_DELETION`
2. Если в течение **7 дней** после предупреждения кто-либо пишет сообщение → статус сбрасывается в `ACTIVE`, счётчик неактивности обнуляется
3. Если за 7 дней активности не появилось → чат удаляется

Статус `PENDING_DELETION` — это именно ожидание удаления по сценарию неактивности (не ручное удаление).

### Прочее
- `EgeTask` — общая база задач для всех учителей, наполняется разработчиками
- `DemoDataLoader` (demo_teacher с хардкоженным UUID) — только для тестирования, убрать перед продакшеном
- AI-сервис (`ai-service/`) — заглушки, интеграция не планируется в ближайшее время, **не трогать**
- `CrmPage` — в разработке, **не трогать**
- `dataConsentStatus` — уточнить поведение при `false`
