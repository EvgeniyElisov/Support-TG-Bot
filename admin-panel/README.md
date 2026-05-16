# Admin Panel

Админ‑панель для проекта `Support-TG-Bot` (Next.js).

Основное:
- просмотр диалогов и сообщений
- управление статусами/назначениями
- **База знаний**: CRUD документов + **«Переиндексировать»** (chunks + embeddings)

## Локальный запуск

```bash
npm install
npm run dev
```

## Переменные окружения

Используйте `admin-panel/.env.local` (не коммитится). Шаблон лежит в `admin-panel/.env`.

Минимум:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Для переиндексации базы знаний:
- `EMBEDDINGS_API_KEY` (или `OPENAI_API_KEY`)

Для отправки ответов менеджера в Telegram (server action):
- `TELEGRAM_BOT_TOKEN`

Подробности см. в корневом `README.md`.
