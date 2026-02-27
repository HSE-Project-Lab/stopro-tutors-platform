<div align="center">

# 🎓 СТОПРО — EdTech Platform

**Платформа для подготовки к профильной математике ЕГЭ/ОГЭ с AI-ассистентом**

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square)](https://www.gnu.org/licenses/gpl-3.0)

[🇷🇺 Русский](#-русский) • [🇬🇧 English](#-english)

</div>

---

## 🇷🇺 Русский

### О проекте

**СТОПРО** — это EdTech-платформа с микросервисной архитектурой для подготовки школьников к профильной математике ЕГЭ/ОГЭ. Платформа объединяет личные кабинеты учеников и преподавателей, систему задач, домашние задания и AI-ассистента, способного распознавать рукописные решения, находить ошибки и давать персональные рекомендации.

### Возможности

| Модуль | Описание |
|--------|----------|
| **Кабинет ученика** | Дашборд с прогрессом, статистика по темам, еженедельные графики |
| **Кабинет учителя** | Управление группами, назначение ДЗ, аналитика по ученикам |
| **Банк задач** | Задачи по темам ЕГЭ (№1–19), три уровня сложности |
| **Домашние задания** | Создание, назначение группам, отслеживание дедлайнов |
| **AI-ассистент** | OCR рукописных решений, анализ ошибок, рекомендации |
| **Аналитика** | Прогресс по темам, графики успеваемости, слабые/сильные стороны |

### Архитектура

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend   │────▶│     Backend      │────▶│   AI Service    │
│  React + TS  │     │  Spring Boot 3.4 │     │    FastAPI      │
│  Tailwind    │     │  Java 21         │     │    Python 3.11  │
│  Port: 3000  │     │  Port: 8080      │     │    Port: 8000   │
└──────────────┘     └────────┬─────────┘     └────────┬────────┘
                              │                        │
                     ┌────────▼─────────┐     ┌────────▼────────┐
                     │   PostgreSQL 16  │     │   Redis 7       │
                     │   База данных    │     │   Celery Broker │
                     │   Port: 5432     │     │   Port: 6379    │
                     └──────────────────┘     └─────────────────┘
```

### Технологический стек

<details>
<summary><b>Frontend</b></summary>

- **React 19** — UI-библиотека
- **TypeScript 5.9** — типизация
- **Vite 7** — сборщик
- **Tailwind CSS 4** — стилизация
- **Zustand** — управление состоянием
- **React Query** — серверное состояние и кеширование
- **Recharts** — графики и визуализация
- **Axios** — HTTP-клиент
- **Nginx** — продакшн-сервер

</details>

<details>
<summary><b>Backend</b></summary>

- **Java 21** — язык
- **Spring Boot 3.4** — фреймворк
- **Spring Security + JWT** — аутентификация и авторизация
- **Spring Data JPA + Hibernate** — ORM
- **PostgreSQL 16** — реляционная БД
- **Flyway** — миграции БД
- **MapStruct** — маппинг DTO
- **Lombok** — генерация boilerplate
- **SpringDoc OpenAPI** — документация API
- **Spring Cache + Redis** — кеширование

</details>

<details>
<summary><b>AI Service</b></summary>

- **Python 3.11** — язык
- **FastAPI** — веб-фреймворк
- **Celery** — очередь асинхронных задач
- **Redis** — брокер сообщений
- **OCR** — распознавание рукописного текста
- **SymPy** — анализ математических ошибок
- **LLM** — генерация рекомендаций

</details>

### Быстрый старт

#### Требования

- [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 20+](https://nodejs.org/) (для локальной разработки фронтенда)
- [Java 21+](https://adoptium.net/) (для локальной разработки бэкенда)
- [Python 3.11+](https://www.python.org/) (для локальной разработки AI-сервиса)

#### Запуск через Docker Compose

```bash
# Клонировать репозиторий
git clone https://github.com/HSE-Project-Lab/stopro-tutors-platform
cd tutors-platform

# Собрать и запустить все сервисы
make build
make start

# Или одной командой
docker-compose up -d --build
```

#### Локальная разработка фронтенда

```bash
npm install
npm run dev
# → http://localhost:5173
```

#### Полезные команды (Makefile)

| Команда | Описание |
|---------|----------|
| `make build` | Собрать все сервисы |
| `make start` | Запустить сервисы |
| `make stop` | Остановить сервисы |
| `make restart` | Перезапустить сервисы |
| `make rebuild` | Пересобрать и запустить |
| `make logs` | Логи всех сервисов |
| `make status` | Статус контейнеров |
| `make clean` | Удалить всё (контейнеры, образы, тома) |

### Порты сервисов

| Сервис | Порт | URL |
|--------|------|-----|
| Frontend | `3000` | http://localhost:3000 |
| Backend API | `8080` | http://localhost:8080/api/v1 |
| AI Service | `8000` | http://localhost:8000/docs |
| PostgreSQL | `5432` | — |
| Redis | `6379` | — |

### Структура проекта

```
tutors-platform/
├── src/                  # Frontend (React + TypeScript)
│   ├── components/       # UI-компоненты
│   ├── pages/            # Страницы приложения
│   ├── store/            # Zustand-сторы
│   ├── types/            # TypeScript-типы
│   └── lib/              # Утилиты и конфиг
├── backend/              # Backend (Java Spring Boot)
│   └── src/main/java/    # Исходный код
├── ai-service/           # AI-микросервис (Python FastAPI)
│   └── app/              # Приложение и роутеры
├── frontend/             # Dockerfile и nginx.conf
├── docs/                 # Документация
├── docker-compose.yml    # Оркестрация сервисов
├── Makefile              # Команды управления
└── vite.config.ts        # Конфигурация Vite
```

---

## 🇬🇧 English

### About

**STOPRO** is a microservice-based EdTech platform designed for preparing students for advanced math exams (Russian EGE/OGE). It combines student and teacher dashboards, a task bank, homework management, and an AI assistant capable of recognizing handwritten solutions, detecting errors, and providing personalized recommendations.

### Features

| Module | Description |
|--------|-------------|
| **Student Dashboard** | Progress overview, topic statistics, weekly charts |
| **Teacher Dashboard** | Group management, homework assignment, student analytics |
| **Task Bank** | Tasks by EGE topics (#1–19), three difficulty levels |
| **Homework** | Create, assign to groups, track deadlines |
| **AI Assistant** | OCR for handwritten solutions, error analysis, recommendations |
| **Analytics** | Topic progress, performance graphs, strengths & weaknesses |

### Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend   │────▶│     Backend      │────▶│   AI Service    │
│  React + TS  │     │  Spring Boot 3.4 │     │    FastAPI      │
│  Tailwind    │     │  Java 21         │     │    Python 3.11  │
│  Port: 3000  │     │  Port: 8080      │     │    Port: 8000   │
└──────────────┘     └────────┬─────────┘     └────────┬────────┘
                              │                        │
                     ┌────────▼─────────┐     ┌────────▼────────┐
                     │   PostgreSQL 16  │     │   Redis 7       │
                     │   Database       │     │   Celery Broker │
                     │   Port: 5432     │     │   Port: 6379    │
                     └──────────────────┘     └─────────────────┘
```

### 🛠️ Tech Stack

<details>
<summary><b>Frontend</b></summary>

- **React 19** — UI library
- **TypeScript 5.9** — type safety
- **Vite 7** — build tool
- **Tailwind CSS 4** — styling
- **Zustand** — state management
- **React Query** — server state & caching
- **Recharts** — charts & visualization
- **Axios** — HTTP client
- **Nginx** — production server

</details>

<details>
<summary><b>Backend</b></summary>

- **Java 21** — language
- **Spring Boot 3.4** — framework
- **Spring Security + JWT** — authentication & authorization
- **Spring Data JPA + Hibernate** — ORM
- **PostgreSQL 16** — relational database
- **Flyway** — database migrations
- **MapStruct** — DTO mapping
- **Lombok** — boilerplate reduction
- **SpringDoc OpenAPI** — API documentation
- **Spring Cache + Redis** — caching

</details>

<details>
<summary><b>AI Service</b></summary>

- **Python 3.11** — language
- **FastAPI** — web framework
- **Celery** — async task queue
- **Redis** — message broker
- **OCR** — handwriting recognition
- **SymPy** — mathematical error analysis
- **LLM** — recommendation generation

</details>

### 🚀 Quick Start

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 20+](https://nodejs.org/) (for local frontend development)
- [Java 21+](https://adoptium.net/) (for local backend development)
- [Python 3.11+](https://www.python.org/) (for local AI service development)

#### Run with Docker Compose

```bash
# Clone the repository
git clone https://github.com/mirotvoretts/tutors-platform.git
cd tutors-platform

# Build and start all services
make build
make start

# Or in a single command
docker-compose up -d --build
```

#### Local frontend development

```bash
npm install
npm run dev
# → http://localhost:5173
```

#### Useful commands (Makefile)

| Command | Description |
|---------|-------------|
| `make build` | Build all services |
| `make start` | Start services |
| `make stop` | Stop services |
| `make restart` | Restart services |
| `make rebuild` | Rebuild and start |
| `make logs` | Follow all service logs |
| `make status` | Container status |
| `make clean` | Remove everything (containers, images, volumes) |

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | `3000` | http://localhost:3000 |
| Backend API | `8080` | http://localhost:8080/api/v1 |
| AI Service | `8000` | http://localhost:8000/docs |
| PostgreSQL | `5432` | — |
| Redis | `6379` | — |

### Project Structure

```
tutors-platform/
├── src/                  # Frontend (React + TypeScript)
│   ├── components/       # UI components
│   ├── pages/            # Application pages
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   └── lib/              # Utilities & config
├── backend/              # Backend (Java Spring Boot)
│   └── src/main/java/    # Source code
├── ai-service/           # AI microservice (Python FastAPI)
│   └── app/              # Application & routers
├── frontend/             # Dockerfile & nginx.conf
├── docs/                 # Documentation
├── docker-compose.yml    # Service orchestration
├── Makefile              # Management commands
└── vite.config.ts        # Vite configuration
```

---

<div align="center">

### License / Лицензия

This project is licensed under the [GNU General Public License v3.0](LICENSE).

Проект распространяется под лицензией [GNU General Public License v3.0](LICENSE).

</div>
