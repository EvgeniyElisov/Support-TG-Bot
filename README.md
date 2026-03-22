# Support TG Bot

Телеграм-бот поддержки на **Supabase Edge Functions** и **grammY**: входящие сообщения обрабатываются вебхуком, дублируются в таблицу PostgreSQL `public.messages`, пользователю отправляется эхо-ответ с текстом сообщения.

## Возможности

- Приём апдейтов через HTTPS-вебхук (без long polling).
- Сохранение входящих сообщений (включая правки через `edited_message`) в БД с upsert по паре `(chat_id, message_id)`.
- Ответ в чат с цитированием исходного сообщения.

## Стек

| Компонент | Технология |
|-----------|------------|
| Runtime Edge Function | Deno |
| Telegram API | [grammY](https://grammy.dev/) |
| База данных | Supabase (PostgreSQL) |
| Доступ к БД из функции | `@supabase/supabase-js` с service role |

## Структура репозитория

```
supabase/
  migrations/          # SQL-миграции (таблица messages и политики RLS)
  functions/
    tg-webhook/        # Edge Function: вебхук бота
      index.ts
      deno.json        # import map (grammy, supabase-js)
  config.toml          # настройки проекта и функции tg-webhook
```

## Требования

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno](https://deno.land/) (локальный запуск функции вне CLI — по желанию)
- Аккаунт Supabase и токен бота от [@BotFather](https://t.me/BotFather)

## Переменные окружения

Создайте файл `.env.local` в корне (не коммитьте его в git):

| Переменная | Описание |
|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен бота от BotFather |
| `SUPABASE_URL` | URL проекта Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (только на сервере; не использовать в клиенте) |

В облаке для Edge Functions задайте секреты:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=your_token
```

`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в развёрнутых функциях подставляются платформой автоматически.

## Локальная разработка

1. Запустите стек Supabase и примените миграции:

   ```bash
   supabase start
   supabase db reset   # при необходимости: миграции + seed
   ```

2. Поднимите функцию локально:

   ```bash
   supabase functions serve tg-webhook --env-file .env.local
   ```

   По умолчанию эндпоинт: `http://127.0.0.1:54321/functions/v1/tg-webhook`.

3. Сделайте URL доступным из интернета (например, [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) или аналог) и зарегистрируйте вебхук у Telegram:

   ```bash
   curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<HTTPS_URL_ДО_ФУНКЦИИ>"
   ```

   URL должен указывать **ровно** на обработчик вебхука (тот путь, который отдаёт `OK` на GET и принимает POST с JSON Update).

### Проверка JWT для вебхука

В `supabase/config.toml` для `tg-webhook` указано `verify_jwt = true`. Запросы от Telegram **не** содержат JWT Supabase, поэтому для реального вебхука обычно выставляют:

```toml
[functions.tg-webhook]
verify_jwt = false
```

Иначе POST от Telegram может получать `401`. Для дополнительной защиты можно использовать [secret_token](https://core.telegram.org/bots/api#setwebhook) в `setWebhook` и проверять заголовок `X-Telegram-Bot-Api-Secret-Token` в коде функции.

## Деплой

```bash
supabase link --project-ref <ref>
supabase db push              # миграции на удалённую БД
supabase functions deploy tg-webhook
```

После деплоя укажите вебхук на URL вида:

`https://<project-ref>.supabase.co/functions/v1/tg-webhook`

## База данных

Таблица `public.messages` хранит метаданные чата, идентификаторы сообщения, текст/подпись и полный объект сообщения в `raw` (JSONB). Уникальность: `(chat_id, message_id)`.

## Полезные ссылки

- [grammY: развёртывание и вебхуки](https://grammy.dev/guide/deployment-types.html)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Telegram Bot API: setWebhook](https://core.telegram.org/bots/api#setwebhook)
