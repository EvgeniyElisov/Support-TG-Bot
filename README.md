# Support TG Bot (Supabase + Admin + RAG)

Телеграм‑бот поддержки на **Supabase Edge Functions** и **grammY**.

Возможности проекта:
- **Сбор входящих** сообщений в Supabase Postgres (`clients`, `messages`).
- **Админ‑панель** (Next.js) для просмотра диалогов и работы менеджеров.
- **База знаний** в Supabase: CRUD в админке.
- **RAG‑ответы**: бот ищет релевантные фрагменты в базе знаний (pgvector) и отвечает через **DeepSeek**.

## Стек

| Компонент | Технология |
|---|---|
| Telegram webhook | Supabase Edge Functions (Deno) |
| Bot framework | [grammY](https://grammy.dev/) |
| Админ‑панель | Next.js (App Router), React |
| База данных | Supabase Postgres + pgvector |

## Структура репозитория

```text
admin-panel/                 # Next.js админка
supabase/
  migrations/                # SQL-миграции
  functions/
    types.gen.ts             # сгенерированные типы БД
    tg-webhook/              # Edge Function: Telegram webhook + RAG
      components/
```

## Переменные окружения (важно)

В репозитории лежат **шаблоны** `.env` и `admin-panel/.env` **без значений**.
Реальные значения кладём в **`.env.local`** (не коммитится).

### **1) Edge Function (`supabase/functions/tg-webhook`) — корневой `/.env.local`**

Минимум для работы бота + RAG:

| Переменная | Где используется | Зачем |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | tg-webhook | принимать/отвечать в Telegram |
| `SUPABASE_URL` | tg-webhook | доступ к БД |
| `SUPABASE_SERVICE_ROLE_KEY` | tg-webhook | запись в БД (server-only) |
| `DEEPSEEK_API_KEY` | tg-webhook | генерация ответа |
| `EMBEDDINGS_API_KEY` **или** `OPENAI_API_KEY` | tg-webhook | векторы для поиска (embeddings) |

Опционально:
`EMBEDDINGS_BASE_URL`, `EMBEDDINGS_MODEL`, `EMBEDDINGS_PROVIDER`, `RAG_TOP_K`, `RAG_MIN_SIMILARITY`, `DEEPSEEK_MODEL`.

Также опционально (для OpenRouter):
`OPENROUTER_HTTP_REFERER`, `OPENROUTER_X_TITLE`.

#### Пример: embeddings через DeepInfra (OpenAI‑совместимо)

См. [DeepInfra Embeddings](https://docs.deepinfra.com/apis/embeddings).

- `EMBEDDINGS_BASE_URL=https://api.deepinfra.com/v1/openai`
- `EMBEDDINGS_API_KEY=<DEEPINFRA_TOKEN>` (получить токен: `https://deepinfra.com/dash/api_keys`)
- `EMBEDDINGS_MODEL=Qwen/Qwen3-Embedding-8B`

#### Пример: embeddings через OpenRouter (OpenAI‑совместимо)

Модель: [nvidia/llama-nemotron-embed-vl-1b-v2:free](https://openrouter.ai/nvidia/llama-nemotron-embed-vl-1b-v2:free)

- `EMBEDDINGS_PROVIDER=openai`
- `EMBEDDINGS_BASE_URL=https://openrouter.ai/api/v1`
- `EMBEDDINGS_API_KEY=<OPENROUTER_KEY>` (ключи: `https://openrouter.ai/keys`)
- `EMBEDDINGS_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free`
- (опционально) `OPENROUTER_HTTP_REFERER=<ваш сайт/репо>`
- (опционально) `OPENROUTER_X_TITLE=Support-TG-Bot`

В облаке (Supabase) эти значения задаются через **Secrets**:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=...
supabase secrets set DEEPSEEK_API_KEY=...
supabase secrets set EMBEDDINGS_API_KEY=...
```

> Примечание: `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в развернутых Edge Functions обычно подставляются платформой автоматически, но локально их нужно иметь.

### **2) Админ‑панель (`admin-panel/.env.local`)**

| Переменная | Зачем |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL для SSR/клиента |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable ключ для админки |
| `NEXT_PUBLIC_SITE_URL` | ссылка для reset-password flow |
| `EMBEDDINGS_API_KEY` **или** `OPENAI_API_KEY` | пересчёт векторов при “Переиндексировать” |

> Админке **не нужны** `SUPABASE_SERVICE_ROLE_KEY` и `DEEPSEEK_API_KEY`.
> Для **ответов менеджера в Telegram** на Vercel нужен `TELEGRAM_BOT_TOKEN` (server-only, без `NEXT_PUBLIC_`).

## База знаний и RAG (как это работает)

### **Схема**
- `kb_documents`: документы (редактируются в админке).
- `kb_chunks`: фрагменты (chunks) с `embedding vector`.
- `match_kb_chunks(...)`: RPC для top‑K поиска по embedding (`<=>`).

### **Переиндексация**
В админке (Dashboard → **База знаний**) добавьте документ и нажмите **«Переиндексировать»**.
Это нарежет документы на chunks и запишет embeddings в `kb_chunks`.

### **Ответ бота**
tg-webhook делает:
1) embeddings вопроса
2) `match_kb_chunks` → top‑K контекст
3) запрос в DeepSeek → ответ пользователю

Поведение:
- Если запрос слишком общий или поиск “неуверенный” (низкая similarity / нет чанков) — бот задаёт 1–2 уточняющих вопроса.
- Если диалог назначен менеджеру (`client_assignments.current_manager_id` задан) — бот **не отвечает автоматически**, чтобы не мешать менеджеру.
- Ответы бота сохраняются в `messages` как `outbound` (без `sent_by_manager_id`), чтобы их было видно в админке.
- `read_at` для исходящих сообщений проставляется best‑effort: когда клиент присылает следующее входящее сообщение.

Если embeddings не настроены или chunks пустые — бот ответит, что сейчас не может ответить по базе знаний.

## Чек‑лист: включить RAG за 5 минут

1) **Применить миграции в Supabase**

```bash
supabase db push
```

2) **Заполнить env**
- **Корень `/.env.local` (tg-webhook)**:
  - `TELEGRAM_BOT_TOKEN`
  - `DEEPSEEK_API_KEY`
  - `EMBEDDINGS_API_KEY` (или `OPENAI_API_KEY`)
- **`admin-panel/.env.local` (админка)**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `EMBEDDINGS_API_KEY` (или `OPENAI_API_KEY`)

3) **Запустить локально**

```bash
supabase functions serve tg-webhook --env-file .env.local
cd admin-panel && npm run dev
```

4) **Заполнить базу знаний и проиндексировать**
- Откройте админку → **Dashboard → База знаний**
- Добавьте 1–2 документа (статус **опубликовано**)
- Нажмите **«Переиндексировать»**

5) **Проверить в Telegram**
- Напишите боту вопрос, который точно есть в документах.

## Локальный запуск

### 1) Supabase + миграции

```bash
supabase start
supabase db reset
```

### 2) Edge Function

```bash
supabase functions serve tg-webhook --env-file .env.local
```

### 3) Админка

```bash
cd admin-panel
npm install
npm run dev
```

## Деплой (минимум)

```bash
supabase link --project-ref <ref>
supabase db push
supabase functions deploy tg-webhook
```

Админ‑панель деплоится отдельно (например, Vercel) со своими env vars.
