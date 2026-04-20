# Support TG Bot

Телеграм-бот поддержки на **Supabase Edge Functions** и **grammY**: входящие сообщения обрабатываются вебхуком, сохраняются в PostgreSQL (`clients` + `messages`), пользователю отправляется эхо-ответ с текстом сообщения. **Админ-панель** (Next.js) показывает диалоги, сообщения, назначение менеджеров, **статусы диалогов**, а также позволяет **отвечать в Telegram от имени назначенного менеджера** (исходящее сообщение записывается в БД и отправляется через Bot API).

## Возможности

- Приём апдейтов через HTTPS-вебхук (без long polling).
- Сохранение в БД: upsert клиента по `chat_id` в `public.clients`, вставка строки в `public.messages` (`client_id`, `text_content` — текст или подпись к медиа).
- Ответ в чат с цитированием исходного сообщения.
- В админке:
  - список диалогов (`message_dialogs`) + счётчики и сортировка по последнему сообщению;
  - сообщения по чату (входящие из Telegram и исходящие из панели);
  - назначение менеджера через `set_client_assignment`;
  - статусы диалогов (**Новый / В работе / Ждём клиента / Закрыт**) + фильтр и цветные бейджи;
  - ответ клиенту через `insert_manager_reply` + Bot API `sendMessage` (только у **текущего** ответственного).
- Realtime (WebSocket) в админке: новые сообщения и обновления сайдбара приходят автоматически через Supabase Realtime.

## Стек

| Компонент | Технология |
|-----------|------------|
| Edge Function (вебхук) | Deno |
| Админ-панель | Next.js, React |
| Telegram API | [grammY](https://grammy.dev/) |
| База данных | Supabase (PostgreSQL) |
| Доступ к БД из функции | `@supabase/supabase-js` с service role |
| Доступ из админки | `@supabase/ssr`, anon key + сессия |

## Структура репозитория

```
admin-panel/           # Next.js: дашборд сообщений, авторизация Supabase Auth
  types/supabase-database.ts  # реэкспорт Database из сгенерированных типов
docs/
  erd.puml             # целевая схема БД (PlantUML)
supabase/
  migrations/          # SQL-миграции (порядок по timestamp)
  functions/
    types.gen.ts       # типы БД для TS (генерация см. ниже)
    tg-webhook/        # Edge Function: HTTP → grammY → persist / preview
      index.ts
      components/
      deno.json
  config.toml
```

## Требования

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Node.js](https://nodejs.org/) — для `admin-panel`
- [Deno](https://deno.land/) — опционально для локального запуска функции вне CLI
- Аккаунт Supabase и токен бота от [@BotFather](https://t.me/BotFather)

## Переменные окружения

### Edge Function / локальный `.env.local` в корне (не коммитить)

| Переменная | Описание |
|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен бота от BotFather |
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (только на сервере; не в клиенте) |

В облаке для Edge Functions:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=your_token
```

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в развёрнутых функциях подставляются платформой автоматически.

### Админ-панель (`admin-panel/.env.local`)

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (клиент + сервер через SSR) |
| `NEXT_PUBLIC_SITE_URL` | Базовый URL админки (для ссылок из reset-password flow). Локально: `http://localhost:3000`, на Vercel: `https://<app>.vercel.app`. |
| `TELEGRAM_BOT_TOKEN` | Тот же токен бота, что у вебхука — **только на сервере** Next.js (server actions), для отправки ответов менеджера в Telegram. Не префикс `NEXT_PUBLIC_`. |

Без `TELEGRAM_BOT_TOKEN` в окружении админки кнопка «Отправить» в диалоге вернёт ошибку конфигурации.

## Типы TypeScript для Supabase

После изменения схемы БД:

```bash
supabase gen types typescript --local > supabase/functions/types.gen.ts
```

Админ-панель импортирует `Database` через `admin-panel/types/supabase-database.ts` (реэкспорт из `supabase/functions/types.gen.ts`). После регенерации проверьте сигнатуру RPC `set_client_assignment`: параметр `p_current_manager_id` в Postgres допускает `NULL` — при необходимости поправьте тип в `types.gen.ts`.

## Локальная разработка

1. Запустите Supabase и примените миграции:

   ```bash
   supabase start
   supabase db reset
   ```

2. Поднимите Edge Function:

   ```bash
   supabase functions serve tg-webhook --env-file .env.local
   ```

   Эндпоинт по умолчанию: `http://127.0.0.1:54321/functions/v1/tg-webhook`.

3. Админ-панель:

   ```bash
   cd admin-panel && npm install && npm run dev
   ```

4. Сделайте URL вебхука доступным из интернета и зарегистрируйте его у Telegram:

   ```bash
   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<HTTPS_URL_ДО_ФУНКЦИИ>"
   ```

### Проверка JWT для вебхука

В `supabase/config.toml` для `tg-webhook` может быть `verify_jwt = true`. Запросы от Telegram **не** содержат JWT Supabase — для реального вебхука обычно:

```toml
[functions.tg-webhook]
verify_jwt = false
```

Иначе POST от Telegram может получать `401`. Дополнительно: [secret_token](https://core.telegram.org/bots/api#setwebhook) и проверка заголовка `X-Telegram-Bot-Api-Secret-Token`.

## Деплой

```bash
supabase link --project-ref <ref>
supabase db push
supabase functions deploy tg-webhook
```

Вебхук в облаке: `https://<project-ref>.supabase.co/functions/v1/tg-webhook`

Админ-панель — отдельно (например Vercel) с теми же `NEXT_PUBLIC_SUPABASE_*`.

## База данных (основное)

| Объект | Назначение |
|--------|------------|
| **`public.clients`** | Один диалог Telegram на `chat_id` (уникальный); профиль (`username`, имена, `telegram_user_id`). |
| **`public.messages`** | Сообщения: `client_id`, `created_at`, `text_content`, `direction` (`inbound`/`outbound`), `sent_by_manager_id` (для outbound). |
| **`public.dialogs`** | Read-model для быстрого списка диалогов: `last_message_at`, `last_message_text`, `messages_count`. Обновляется триггером на `messages`. |
| **`public.managers`** | Профиль менеджера: `user_id` → `auth.users`, ФИО, `company_role`. |
| **`public.client_assignments`** | Необязательная строка `0..1` на клиента: `current_manager_id`, `assigned_by_manager_id` → `managers`. Создаётся при первом вызове RPC `set_client_assignment`. |
| **`public.client_dialog_states`** | Статус обработки диалога (workflow): `status` = `new` / `in_progress` / `waiting_client` / `closed`. |
| **`message_dialogs`**, **`message_stats`** | Представления: список диалогов для админки и глобальные метрики. `message_dialogs` читает агрегаты из `dialogs`. |

Миграции в `supabase/migrations/` накатываются по имени файла (timestamp). Схема на диаграмме: `docs/erd.puml`.

### Realtime (Supabase)

Чтобы админка получала события `postgres_changes` по WebSocket, таблицы должны быть включены в публикацию `supabase_realtime`.
В проекте это делается миграцией `supabase/migrations/20260422120000_enable_realtime_for_messages_and_dialogs.sql` (для `public.messages` и `public.dialogs`).

## Полезные ссылки

- [grammY: развёртывание и вебхуки](https://grammy.dev/guide/deployment-types.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Telegram Bot API: setWebhook](https://core.telegram.org/bots/api#setwebhook)
