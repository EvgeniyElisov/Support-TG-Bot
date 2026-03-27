# Полный флоу: создание и запуск Telegram support-бота

Этот гайд описывает весь путь с нуля: создание бота, настройка Supabase, деплой вебхука и проверка работы админ-панели.

## 1) Подготовка

Установи инструменты:

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno](https://deno.com/)
- Node.js 20+ (для `admin-panel`)
- Telegram аккаунт

### 1.1 Установка Supabase CLI

macOS (Homebrew):

```bash
brew install supabase/tap/supabase
```

Linux (Homebrew):

```bash
brew install supabase/tap/supabase
```

Windows (Scoop):

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Альтернатива для любой ОС:

```bash
npm install -g supabase
```

### 1.2 Установка Deno

macOS / Linux:

```bash
curl -fsSL https://deno.land/install.sh | sh
```

Windows (PowerShell):

```powershell
irm https://deno.land/install.ps1 | iex
```

Проверь версии:

```bash
supabase --version
deno --version
```

## 2) Создать Telegram-бота через BotFather

1. Открой [@BotFather](https://t.me/BotFather)
2. Выполни `/newbot`
3. Задай имя и username бота
4. Скопируй токен (`TELEGRAM_BOT_TOKEN`)

Опционально:

- `/setdescription` — описание
- `/setuserpic` — аватар

## 3) Подключить проект Supabase

В корне репозитория:

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

Как получить `<YOUR_PROJECT_REF>`:

- открой Supabase Dashboard
- выбери проект
- `Settings -> General -> Reference ID`

Проверка, что всё привязано:

```bash
supabase projects list
```

## 4) Настроить переменные окружения (локально)

Создай/обнови корневой `.env`:

```dotenv
TELEGRAM_BOT_TOKEN=<YOUR_BOT_TOKEN>
SUPABASE_URL=<YOUR_SUPABASE_URL>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>
```

Для админки (`admin-panel/.env`):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

## 5) Поднять локальный Supabase и применить миграции

```bash
supabase start
supabase db reset
```

> `supabase db reset` применит миграции заново для локальной базы.

### 5.1 Как создать новую миграцию (когда меняешь схему БД)

Создай файл миграции:

```bash
supabase migration new create_messages_table
```

После команды появится файл в `supabase/migrations/<timestamp>_create_messages_table.sql`.
Добавь в него SQL (например, `create table`, `create policy`, `create index`).

Применить новую миграцию локально:

```bash
supabase db reset
```

Отправить миграцию в удаленную БД (prod):

```bash
supabase db push
```

> Если миграция уже есть в репозитории, достаточно `supabase db reset` локально и `supabase db push` для удаленной БД.

## 6) Запустить функцию вебхука локально

```bash
supabase functions serve tg-webhook --env-file .env
```

Локальный URL функции обычно:

`http://127.0.0.1:54321/functions/v1/tg-webhook`

Проверка health:

```bash
curl -i http://127.0.0.1:54321/functions/v1/tg-webhook
```

Ожидается `200 OK` и `OK` в теле.

### 6.1 Важно про `verify_jwt` для Telegram webhook

Telegram не отправляет Supabase JWT. Для публичного webhook в `supabase/config.toml` у функции `tg-webhook` должно быть:

```toml
[functions.tg-webhook]
verify_jwt = false
```

После изменения перезапусти локальный сервер функции и задеплой обновление в prod.

## 7) Сделать локальный URL публичным (для Telegram)

Telegram должен стучаться в публичный HTTPS URL. Можно использовать любой туннель (например, Cloudflare Tunnel или ngrok).

Пример с `ngrok`:

```bash
ngrok http 54321
```

Собери URL вида:

`https://<PUBLIC_HOST>/functions/v1/tg-webhook`

## 8) Зарегистрировать webhook в Telegram

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<PUBLIC_HTTPS_URL>/functions/v1/tg-webhook"
```

Проверить webhook:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

## 9) Проверить локальный флоу

1. Напиши сообщение боту в Telegram
2. Убедись, что бот ответил
3. Проверь, что запись появилась в `public.messages`

Проверка через SQL Editor в Supabase:

```sql
select id, chat_id, username, first_name, last_name, message_id, text_content, caption, created_at
from public.messages
order by created_at desc
limit 20;
```

## 10) Деплой в Supabase (prod)

### 10.1 Применить миграции в удаленную БД (`db push`)

```bash
supabase db push
```

### 10.2 Задать секреты для Edge Function

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=<YOUR_BOT_TOKEN>
```

### 10.3 Задеплоить функцию

```bash
supabase functions deploy tg-webhook
```

Если менял `supabase/config.toml` (например, `verify_jwt`), тоже задеплой:

```bash
supabase functions deploy tg-webhook
```

URL прод-функции:

`https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/tg-webhook`

## 11) Переключить Telegram webhook на prod

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/tg-webhook"
```

Проверка:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

## 12) Запустить админ-панель

```bash
cd admin-panel
npm install
npm run dev
```

Открой:

`http://localhost:3000`

На странице должны отображаться последние сообщения из `public.messages`.

## 13) Чек-лист готовности

- Бот отвечает в Telegram
- Новые сообщения пишутся в `public.messages`
- `edited_message` обновляет запись (upsert по `chat_id + message_id`)
- Админ-панель показывает последние сообщения
- `getWebhookInfo` не показывает ошибок доставки
- Для `tg-webhook` отключен `verify_jwt` (иначе Telegram webhook может получать 401)

## 14) Частые проблемы

1. **Webhook не вызывается**
   - Проверь, что URL публичный и HTTPS
   - Проверь `getWebhookInfo`

2. **Функция отвечает 500**
   - Проверь `TELEGRAM_BOT_TOKEN` в secrets
   - Проверь логи функции:
     ```bash
     supabase functions logs tg-webhook
     ```

3. **Нет записей в БД**
   - Проверь `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
   - Проверь наличие таблицы `public.messages`

4. **Админка пустая**
   - Проверь `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Проверь RLS policy на чтение `public.messages`
